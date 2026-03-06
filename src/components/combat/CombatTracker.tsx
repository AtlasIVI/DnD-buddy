import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { Tables } from '../../types/database';
import {
  GiBroadsword, GiSundial, GiShield, GiHearts,
  GiCrestedHelmet, GiWolfHead, GiCharacter,
  GiDeathSkull, GiCrossedSwords, GiAura,
} from 'react-icons/gi';

interface CombatTrackerProps { campaignId: string; }

export default function CombatTracker({ campaignId }: CombatTrackerProps) {
  const [combat,       setCombat]       = useState<Tables<'combats'> | null>(null);
  const [participants, setParticipants] = useState<Tables<'combat_participants'>[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [combatName,   setCombatName]   = useState('Nouveau combat');
  const [showAdd,      setShowAdd]      = useState(false);
  const [addForm,      setAddForm]      = useState({
    display_name: '', participant_type: 'monster' as 'player' | 'monster' | 'npc',
    hp_max: 10, hp_current: 10, armor_class: 10, initiative: 0,
  });
  const [availableNpcs, setAvailableNpcs] = useState<Array<{ id: string; name: string; hp_current: number; hp_max: number; armor_class: number }>>([]);
  const [hpFlash, setHpFlash] = useState<Record<string, 'damage' | 'heal'>>({});
  const [round,   setRound]   = useState(1);

  const fetchParticipants = useCallback(async (combatId: string) => {
    const { data } = await supabase
      .from('combat_participants').select('*')
      .eq('combat_id', combatId).order('initiative', { ascending: false });
    if (data) setParticipants(data);
  }, []);

  const fetchCombat = useCallback(async () => {
    const { data } = await supabase
      .from('combats').select('*')
      .eq('campaign_id', campaignId).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(1).single();
    if (data) { setCombat(data); await fetchParticipants(data.id); }
    setLoading(false);
  }, [campaignId, fetchParticipants]);

  useEffect(() => { fetchCombat(); }, [fetchCombat]);

  useEffect(() => {
    supabase.from('npcs').select('id, name, hp_current, hp_max, armor_class')
      .eq('campaign_id', campaignId)
      .then(({ data }) => { if (data) setAvailableNpcs(data); });
  }, [campaignId]);

  useEffect(() => {
    if (!combat) return;
    const channel = supabase.channel('combat-gm-' + combat.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'combat_participants', filter: 'combat_id=eq.' + combat.id }, async (p: any) => {
        if (p.eventType === 'UPDATE' && p.old && p.new) {
          const delta = p.new.hp_current - p.old.hp_current;
          if (delta !== 0) {
            setHpFlash(prev => ({ ...prev, [p.new.id]: delta < 0 ? 'damage' : 'heal' }));
            setTimeout(() => setHpFlash(prev => { const n = { ...prev }; delete n[p.new.id]; return n; }), 500);
          }
        }
        await fetchParticipants(combat.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'combats', filter: 'id=eq.' + combat.id }, (p: any) => {
        if (p.new) setCombat(p.new);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [combat?.id, fetchParticipants]);

  // ── Lancer le combat — auto-ajoute TOUS les joueurs de la campagne ──────────

  async function createCombat() {
    // 1. Créer le combat
    const { data: newCombat } = await supabase
      .from('combats').insert({ campaign_id: campaignId, name: combatName }).select().single();
    if (!newCombat) return;

    setCombat(newCombat);
    setRound(1);

    // 2. Passer la campagne en mode combat
    await supabase.from('campaigns')
      .update({ mode: 'combat', active_combat_id: newCombat.id })
      .eq('id', campaignId);

    // 3. Récupérer tous les personnages de la campagne
    const { data: characters } = await supabase
      .from('characters')
      .select('id, name, hp_current, hp_max, armor_class')
      .eq('campaign_id', campaignId);

    if (characters && characters.length > 0) {
      await supabase.from('combat_participants').insert(
        characters.map(c => ({
          combat_id:        newCombat.id,
          display_name:     c.name,
          participant_type: 'player' as const,
          hp_max:           c.hp_max,
          hp_current:       c.hp_current,
          armor_class:      c.armor_class,
          character_id:     c.id,
          initiative:       0,
        }))
      );
    }

    await fetchParticipants(newCombat.id);
  }

  async function addParticipant() {
    if (!combat || !addForm.display_name.trim()) return;
    await supabase.from('combat_participants').insert({
      combat_id: combat.id,
      display_name: addForm.display_name,
      participant_type: addForm.participant_type,
      hp_max: addForm.hp_max, hp_current: addForm.hp_current,
      armor_class: addForm.armor_class, initiative: addForm.initiative,
    });
    setAddForm({ display_name: '', participant_type: 'monster', hp_max: 10, hp_current: 10, armor_class: 10, initiative: 0 });
    setShowAdd(false);
  }

  async function addExistingNpc(n: typeof availableNpcs[0]) {
    if (!combat) return;
    if (participants.some(x => x.npc_id === n.id)) return;
    await supabase.from('combat_participants').insert({
      combat_id: combat.id, display_name: n.name, participant_type: 'npc',
      hp_max: n.hp_max, hp_current: n.hp_current, armor_class: n.armor_class,
      npc_id: n.id, initiative: 0,
    });
  }

  function flashHp(id: string, delta: number) {
    setHpFlash(prev => ({ ...prev, [id]: delta < 0 ? 'damage' : 'heal' }));
    setTimeout(() => setHpFlash(prev => { const n = { ...prev }; delete n[id]; return n; }), 500);
  }

  async function updateParticipantHp(id: string, delta: number) {
    const p = participants.find(x => x.id === id);
    if (!p) return;
    const newHp = Math.max(0, Math.min(p.hp_max, p.hp_current + delta));
    flashHp(id, delta);
    await supabase.from('combat_participants').update({ hp_current: newHp }).eq('id', id);
  }

  async function updateInitiative(id: string, init: number) {
    await supabase.from('combat_participants').update({ initiative: init }).eq('id', id);
  }

  async function removeParticipant(id: string) {
    await supabase.from('combat_participants').delete().eq('id', id);
  }

  async function toggleActive(id: string, isActive: boolean) {
    await supabase.from('combat_participants').update({ is_active: !isActive }).eq('id', id);
  }

  async function nextTurn() {
    if (!combat) return;
    const activeParts = participants.filter(p => p.is_active).sort((a, b) => b.initiative - a.initiative);
    if (activeParts.length === 0) return;
    const nextIdx = (combat.current_turn_index ?? -1) + 1;
    if (nextIdx >= activeParts.length) {
      setRound(r => r + 1);
      await supabase.from('combats').update({ current_turn_index: 0 }).eq('id', combat.id);
    } else {
      await supabase.from('combats').update({ current_turn_index: nextIdx }).eq('id', combat.id);
    }
  }

  async function endCombat() {
    if (!combat) return;
    await supabase.from('combats').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', combat.id);
    await supabase.from('campaigns').update({ mode: 'exploration', active_combat_id: null }).eq('id', campaignId);
    for (const p of participants) {
      if (p.character_id) await supabase.from('characters').update({ hp_current: p.hp_current }).eq('id', p.character_id);
      if (p.npc_id)       await supabase.from('npcs').update({ hp_current: p.hp_current }).eq('id', p.npc_id);
    }
    setCombat(null); setParticipants([]); setRound(1);
  }

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Chargement...</p>;

  // ── Pas de combat actif ───────────────────────────────────────────────────

  if (!combat) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GiCrossedSwords size={20} style={{ color: 'var(--color-accent)' }} />
          <h2 style={{ fontSize: '1.25rem' }}>Combat</h2>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <GiBroadsword size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem' }} />
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Aucun combat actif</p>
          <input className="input" value={combatName} onChange={e => setCombatName(e.target.value)}
            placeholder="Nom du combat" style={{ marginBottom: '0.5rem', textAlign: 'center' }} />
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
            Tous les joueurs de la campagne seront automatiquement ajoutés.
          </p>
          <button className="btn btn--primary" onClick={createCombat} style={{ width: '100%' }}>
            <GiBroadsword size={16} /> Lancer le combat
          </button>
        </div>
      </div>
    );
  }

  // ── Combat actif ─────────────────────────────────────────────────────────

  const activeParts    = participants.filter(p => p.is_active).sort((a, b) => b.initiative - a.initiative);
  const downParts      = participants.filter(p => !p.is_active);
  const currentTurnIdx = combat.current_turn_index ?? -1;
  const safeIdx        = activeParts.length > 0
    ? ((currentTurnIdx % activeParts.length) + activeParts.length) % activeParts.length
    : -1;
  const currentParticipant = currentTurnIdx >= 0 && activeParts.length > 0 ? activeParts[safeIdx] : null;

  const typeIcon = (type: string) => {
    if (type === 'player')  return <GiCrestedHelmet size={12} style={{ color: 'var(--color-player-color)' }} />;
    if (type === 'monster') return <GiWolfHead size={12} style={{ color: 'var(--color-monster-color)' }} />;
    return <GiCharacter size={12} style={{ color: 'var(--color-npc-color)' }} />;
  };

  // PNJs pas encore dans le combat
  const npcsNotIn = availableNpcs.filter(n => !participants.some(x => x.npc_id === n.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GiCrossedSwords size={20} style={{ color: 'var(--color-error)' }} />
          <h2 style={{ fontSize: '1.25rem' }}>{combat.name}</h2>
          <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-background-alt)', padding: '0.125rem 0.5rem', borderRadius: '999px' }}>
            Round {round}
          </span>
        </div>
        <button className="btn btn--danger" onClick={endCombat} style={{ fontSize: '0.75rem' }}>Fin du combat</button>
      </div>

      {/* Tour en cours */}
      {currentTurnIdx === -1 && activeParts.length > 0 ? (
        <button className="btn btn--primary" onClick={nextTurn} style={{ width: '100%' }}>
          <GiSundial size={16} /> Démarrer les tours
        </button>
      ) : currentParticipant ? (
        <div className="card card--accent animate-pulse-turn" style={{ textAlign: 'center', padding: '0.75rem' }}>
          <p style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>
            <GiSundial size={12} style={{ marginRight: '0.25rem' }} />Tour {safeIdx + 1}/{activeParts.length}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            {typeIcon(currentParticipant.participant_type)}
            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-your-turn)', margin: 0 }}>{currentParticipant.display_name}</h3>
          </div>

          {/* Actions rapides MJ sur le participant actif */}
          <div style={{ backgroundColor: 'var(--color-background-alt)', borderRadius: '0.5rem', padding: '0.75rem', marginTop: '0.75rem', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
              Actions rapides MJ
            </span>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
              <button className="btn btn--danger" onClick={() => updateParticipantHp(currentParticipant.id, -5)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>-5 PV</button>
              <button className="btn btn--danger" onClick={() => updateParticipantHp(currentParticipant.id, -1)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>-1 PV</button>
              <div style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem', fontWeight: 'bold', minWidth: '3rem', fontFamily: 'var(--font-mono)' }}>
                {currentParticipant.hp_current}
              </div>
              <button className="btn btn--primary" onClick={() => updateParticipantHp(currentParticipant.id, 1)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: 'var(--color-success)' }}>+1 PV</button>
              <button className="btn btn--primary" onClick={() => updateParticipantHp(currentParticipant.id, 5)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: 'var(--color-success)' }}>+5 PV</button>
            </div>
            <button
              className="btn btn--ghost"
              onClick={() => alert("Effets temporaires — prochaine feature !")}
              style={{ fontSize: '0.75rem', width: '100%', marginTop: '0.5rem' }}
            >
              <GiAura size={14} style={{ marginRight: '0.375rem' }} /> Appliquer un Effet Temporaire
            </button>
          </div>

          <button className="btn btn--primary" onClick={nextTurn} style={{ width: '100%' }}>
            Fin du tour →
          </button>
        </div>
      ) : null}

      {/* Ajouter monstres/PNJs — les joueurs sont auto-ajoutés */}
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn--ghost" onClick={() => setShowAdd(!showAdd)} style={{ fontSize: '0.75rem' }}>
          {showAdd ? 'Annuler' : '+ Monstre / PNJ'}
        </button>
        {npcsNotIn.map(n => (
          <button key={n.id} className="btn btn--ghost" onClick={() => addExistingNpc(n)}
            style={{ fontSize: '0.6875rem', color: 'var(--color-npc-color)' }}>
            <GiCharacter size={12} /> {n.name}
          </button>
        ))}
      </div>

      {showAdd && (
        <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <input className="input" placeholder="Nom" value={addForm.display_name}
            onChange={e => setAddForm({ ...addForm, display_name: e.target.value })} />
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {(['monster', 'npc'] as const).map(t => (
              <button key={t} className={addForm.participant_type === t ? 'btn btn--primary' : 'btn btn--ghost'}
                onClick={() => setAddForm({ ...addForm, participant_type: t })}
                style={{ flex: 1, fontSize: '0.75rem' }}>
                {t === 'monster' ? <><GiWolfHead size={14} /> Monstre</> : <><GiCharacter size={14} /> PNJ</>}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.125rem' }}><GiHearts size={10} /> PV</label>
              <input className="input" type="number" inputMode="numeric" min={0} value={addForm.hp_max}
                onChange={e => { const v = Math.max(0, parseInt(e.target.value) || 0); setAddForm({ ...addForm, hp_max: v, hp_current: v }); }}
                style={{ textAlign: 'center' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.125rem' }}><GiShield size={10} /> CA</label>
              <input className="input" type="number" inputMode="numeric" min={0} value={addForm.armor_class}
                onChange={e => setAddForm({ ...addForm, armor_class: Math.max(0, parseInt(e.target.value) || 0) })}
                style={{ textAlign: 'center' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.125rem' }}><GiSundial size={10} /> Init.</label>
              <input className="input" type="number" inputMode="numeric" value={addForm.initiative}
                onChange={e => setAddForm({ ...addForm, initiative: parseInt(e.target.value) || 0 })}
                style={{ textAlign: 'center' }} />
            </div>
          </div>
          <button className="btn btn--primary" onClick={addParticipant} disabled={!addForm.display_name.trim()}>Ajouter</button>
        </div>
      )}

      {/* Participants actifs */}
      {activeParts.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Aucun participant actif.</p>
        </div>
      )}

      {activeParts.map((p, idx) => {
        const hpPct    = p.hp_max > 0 ? Math.round((p.hp_current / p.hp_max) * 100) : 0;
        const isCurrent = idx === safeIdx && currentTurnIdx >= 0;
        const flash    = hpFlash[p.id];
        const hpColor  = hpPct > 60 ? 'var(--color-hp)' : hpPct > 30 ? 'var(--color-warning)' : 'var(--color-error)';

        return (
          <div key={p.id}
            className={`card ${flash === 'damage' ? 'animate-damage' : flash === 'heal' ? 'animate-heal' : ''}`}
            style={{ borderColor: isCurrent ? 'var(--color-your-turn)' : undefined, boxShadow: isCurrent ? 'var(--glow-accent)' : undefined, transition: 'border-color 0.3s, box-shadow 0.3s' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                {typeIcon(p.participant_type)}
                <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{p.display_name}</span>
                {isCurrent && <span style={{ fontSize: '0.5rem', color: 'var(--color-your-turn)', textTransform: 'uppercase', fontWeight: 700, backgroundColor: 'rgba(255,200,0,0.15)', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>En jeu</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <GiSundial size={12} style={{ color: 'var(--color-warning)' }} />
                <input className="input" type="number" inputMode="numeric" value={p.initiative}
                  onChange={e => updateInitiative(p.id, parseInt(e.target.value) || 0)}
                  style={{ width: '3rem', textAlign: 'center', padding: '0.125rem', fontSize: '0.75rem' }} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
              <button className="btn btn--danger" onClick={() => updateParticipantHp(p.id, -5)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minWidth: '2.5rem' }}>-5</button>
              <button className="btn btn--danger" onClick={() => updateParticipantHp(p.id, -1)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minWidth: '2.5rem' }}>-1</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1, justifyContent: 'center' }}>
                <GiHearts size={14} style={{ color: hpColor }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9375rem', color: hpColor, fontWeight: 700 }}>{p.hp_current}</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>/{p.hp_max}</span>
                <GiShield size={12} style={{ color: 'var(--color-armor-class)', marginLeft: '0.5rem' }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{p.armor_class}</span>
              </div>
              <button className="btn btn--primary" onClick={() => updateParticipantHp(p.id, 1)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minWidth: '2.5rem', backgroundColor: 'var(--color-success)' }}>+1</button>
              <button className="btn btn--primary" onClick={() => updateParticipantHp(p.id, 5)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minWidth: '2.5rem', backgroundColor: 'var(--color-success)' }}>+5</button>
            </div>

            <div className="hp-bar">
              <div className="hp-bar__fill" style={{ width: `${Math.min(100, hpPct)}%`, backgroundColor: hpColor, transition: 'width 0.4s ease, background-color 0.4s ease' }} />
            </div>

            <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.375rem', justifyContent: 'flex-end' }}>
              <button className="btn btn--ghost" onClick={() => toggleActive(p.id, p.is_active)}
                style={{ fontSize: '0.6875rem', color: 'var(--color-warning)', padding: '0.25rem 0.5rem' }}>
                <GiDeathSkull size={14} /> KO
              </button>
              <button className="btn btn--ghost" onClick={() => removeParticipant(p.id)}
                style={{ fontSize: '0.6875rem', color: 'var(--color-error)', padding: '0.25rem 0.5rem' }}>✕</button>
            </div>
          </div>
        );
      })}

      {/* KO */}
      {downParts.length > 0 && (
        <>
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <GiDeathSkull size={12} /> Hors combat ({downParts.length})
          </p>
          {downParts.map(p => (
            <div key={p.id} className="card" style={{ opacity: 0.5, padding: '0.375rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem' }}>
                {typeIcon(p.participant_type)} <span style={{ textDecoration: 'line-through' }}>{p.display_name}</span>
              </span>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button className="btn btn--ghost" onClick={() => toggleActive(p.id, p.is_active)}
                  style={{ fontSize: '0.6875rem', color: 'var(--color-success)', padding: '0.25rem 0.5rem' }}>Relever</button>
                <button className="btn btn--ghost" onClick={() => removeParticipant(p.id)}
                  style={{ fontSize: '0.6875rem', color: 'var(--color-error)', padding: '0.25rem 0.5rem' }}>✕</button>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}