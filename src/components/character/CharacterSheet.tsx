import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Tables, Enums } from '../../types/database';
import {
  GiHearts, GiShield, GiLeatherBoot, GiBroadsword,
  GiMuscleUp, GiRunningNinja, GiBrain, GiPrayer, GiChatBubble,
  GiSparkles, GiScrollUnfurled, GiQuillInk, GiCrossedSwords,
} from 'react-icons/gi';
import SpellsPanel from './SpellsPanel';
import SkillsList  from './SkillsPanel';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CharacterSheetProps {
  campaignId: string;
  readOnly?: boolean;
  characterId?: string;
  /** Passé depuis CampaignPage — active le layout 2 colonnes */
  inCombat?: boolean;
}

type SkillAbility = Enums<'skill_ability'>

const ABILITIES: { key: string; label: string; abilityKey: SkillAbility; icon: React.ComponentType<any> }[] = [
  { key: 'str', label: 'FOR', abilityKey: 'STR', icon: GiMuscleUp    },
  { key: 'dex', label: 'DEX', abilityKey: 'DEX', icon: GiRunningNinja },
  { key: 'con', label: 'CON', abilityKey: 'CON', icon: GiShield       },
  { key: 'int', label: 'INT', abilityKey: 'INT', icon: GiBrain        },
  { key: 'wis', label: 'SAG', abilityKey: 'WIS', icon: GiPrayer       },
  { key: 'cha', label: 'CHA', abilityKey: 'CHA', icon: GiChatBubble   },
]

function modStr(value: number): string {
  const mod = Math.floor((value - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function CharacterSheet({ campaignId, readOnly, characterId, inCombat }: CharacterSheetProps) {
  const { user } = useAuth();
  const [char,      setChar]      = useState<Tables<'characters'> | null>(null);
  const [effects,   setEffects]   = useState<Tables<'effects'>[]>([]);
  const [passiveSkills, setPassiveSkills] = useState<Tables<'skills'>[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [newEffect, setNewEffect] = useState({ name: '', description: '', source: '', is_positive: true });
  const [showEffectForm, setShowEffectForm] = useState(false);
  const [localChar, setLocalChar] = useState<Tables<'characters'> | null>(null);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const fetchChar = useCallback(async () => {
    if (characterId) {
      const { data } = await supabase.from('characters').select('*').eq('id', characterId).single();
      if (data) { setChar(data); setLocalChar(data); }
    } else if (user) {
      const { data } = await supabase.from('characters').select('*')
        .eq('campaign_id', campaignId).eq('user_id', user.id).single();
      if (data) { setChar(data); setLocalChar(data); }
    }
    setLoading(false);
  }, [campaignId, user, characterId]);

  const fetchEffects = useCallback(async (cid: string) => {
    const { data } = await supabase.from('effects').select('*').eq('character_id', cid).order('created_at');
    if (data) setEffects(data);
  }, []);

  const fetchPassiveSkillBonuses = useCallback(async (cid: string) => {
    const { data } = await supabase
      .from('skills').select('stat_bonus_ability, stat_bonus_value, name')
      .eq('character_id', cid).eq('is_active', false)
      .not('stat_bonus_ability', 'is', null).not('stat_bonus_value', 'is', null);
    if (data) setPassiveSkills(data as Tables<'skills'>[]);
  }, []);

  useEffect(() => { fetchChar(); }, [fetchChar]);
  useEffect(() => {
    if (char) { fetchEffects(char.id); fetchPassiveSkillBonuses(char.id); }
  }, [char?.id, fetchEffects, fetchPassiveSkillBonuses]);

  useEffect(() => {
    if (!char) return;
    const channel = supabase.channel('char-' + char.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'characters', filter: 'id=eq.' + char.id }, (p: any) => {
        if (readOnly && p.new) { setChar(p.new); setLocalChar(p.new); }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'effects', filter: 'character_id=eq.' + char.id }, () => fetchEffects(char.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'skills',  filter: 'character_id=eq.' + char.id }, () => fetchPassiveSkillBonuses(char.id))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [char?.id, fetchEffects, fetchPassiveSkillBonuses, readOnly]);

  useEffect(() => () => { Object.values(saveTimers.current).forEach(clearTimeout); }, []);

  async function createCharacter() {
    if (!user) return;
    setSaving(true);
    const { data } = await supabase.from('characters')
      .insert({ campaign_id: campaignId, user_id: user.id, name: 'Nouveau Personnage' }).select().single();
    if (data) { setChar(data); setLocalChar(data); }
    setSaving(false);
  }

  function updateField(field: string, value: any) {
    if (!localChar || readOnly) return;
    setLocalChar(prev => prev ? { ...prev, [field]: value } : prev);
    if (saveTimers.current[field]) clearTimeout(saveTimers.current[field]);
    saveTimers.current[field] = setTimeout(async () => {
      setSaving(true);
      await supabase.from('characters').update({ [field]: value }).eq('id', localChar.id);
      setChar(prev => prev ? { ...prev, [field]: value } : prev);
      setSaving(false);
    }, 600);
  }

  async function addEffect() {
    if (!char || !newEffect.name.trim()) return;
    await supabase.from('effects').insert({ character_id: char.id, ...newEffect });
    setNewEffect({ name: '', description: '', source: '', is_positive: true });
    setShowEffectForm(false);
    fetchEffects(char.id);
  }

  async function removeEffect(id: string) {
    await supabase.from('effects').delete().eq('id', id);
    setEffects(effects.filter(e => e.id !== id));
  }

  function passiveBonusFor(ab: SkillAbility): number {
    return passiveSkills
      .filter(s => s.stat_bonus_ability === ab && s.stat_bonus_value !== null)
      .reduce((sum, s) => sum + (s.stat_bonus_value ?? 0), 0);
  }

  function passiveBonusSourcesFor(ab: SkillAbility): string {
    return passiveSkills
      .filter(s => s.stat_bonus_ability === ab && s.stat_bonus_value !== null)
      .map(s => `${s.name} (${(s.stat_bonus_value ?? 0) >= 0 ? '+' : ''}${s.stat_bonus_value})`)
      .join(', ');
  }

  // ── Rendu ──

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Chargement...</p>;

  if (!localChar) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <GiBroadsword size={32} style={{ color: 'var(--color-accent)', marginBottom: '0.75rem' }} />
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Pas encore de personnage</p>
        <button className="btn btn--primary" onClick={createCharacter} disabled={saving}>
          {saving ? '...' : 'Créer mon personnage'}
        </button>
      </div>
    );
  }

  const charStatsForSkills = {
    str: localChar.str, dex: localChar.dex, con: localChar.con,
    int: localChar.int, wis: localChar.wis, cha: localChar.cha,
    level: localChar.level,
  };

  const sharedProps = { localChar, effects, saving, readOnly, newEffect, showEffectForm, inCombat, setNewEffect, setShowEffectForm, updateField, addEffect, removeEffect, passiveBonusFor, passiveBonusSourcesFor };

  // Mode combat — 2 colonnes
  if (inCombat) {
    return (
      <div className="combat-sheet-grid">
        {/* Colonne gauche — fiche */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <SheetLeft {...sharedProps} />
        </div>

        {/* Colonne droite — compétences + sorts (lecture + Utiliser) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.375rem 0.75rem',
            backgroundColor: 'rgba(231,76,60,0.1)',
            border: '1px solid rgba(231,76,60,0.25)',
            borderRadius: 'var(--button-radius)',
            fontSize: '0.6875rem', color: 'var(--color-error)', fontWeight: 600,
          }}>
            <GiCrossedSwords size={13} /> Mode Combat — Actions disponibles
          </div>

          {char && (
            <SkillsList
              characterId={char.id}
              canEdit={false}
              charStats={charStatsForSkills}
            />
          )}

          {char && (
            <SpellsPanel characterId={char.id} readOnly={true} />
          )}
        </div>
      </div>
    );
  }

  // Mode exploration — 1 colonne
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <SheetLeft {...sharedProps} />
    </div>
  );
}

// ─── Panneau gauche ───────────────────────────────────────────────────────────

type SheetLeftProps = {
  localChar: Tables<'characters'>
  effects: Tables<'effects'>[]
  saving: boolean; readOnly?: boolean; inCombat?: boolean
  newEffect: { name: string; description: string; source: string; is_positive: boolean }
  showEffectForm: boolean
  setNewEffect: (v: any) => void
  setShowEffectForm: (v: boolean) => void
  updateField: (field: string, value: any) => void
  addEffect: () => void
  removeEffect: (id: string) => void
  passiveBonusFor: (ab: SkillAbility) => number
  passiveBonusSourcesFor: (ab: SkillAbility) => string
}

function SheetLeft({ localChar, effects, saving, readOnly, inCombat, newEffect, showEffectForm, setNewEffect, setShowEffectForm, updateField, addEffect, removeEffect, passiveBonusFor, passiveBonusSourcesFor }: SheetLeftProps) {
  const hpPercent = localChar.hp_max > 0 ? Math.round((localChar.hp_current / localChar.hp_max) * 100) : 0;
  const hpColor = hpPercent > 60 ? 'var(--color-hp)' : hpPercent > 30 ? 'var(--color-warning)' : 'var(--color-error)';

  return (
    <>
      {/* ── Identité ── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <GiScrollUnfurled size={18} style={{ color: 'var(--color-accent)' }} />
          <h2 style={{ fontSize: '1.125rem' }}>Identité</h2>
          {saving && <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>sauvegarde...</span>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <input className="input" value={localChar.name} onChange={e => updateField('name', e.target.value)} placeholder="Nom" readOnly={readOnly} />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input className="input" value={localChar.race}  onChange={e => updateField('race',  e.target.value)} placeholder="Race"   style={{ flex: 1 }} readOnly={readOnly} />
            <input className="input" value={localChar.class} onChange={e => updateField('class', e.target.value)} placeholder="Classe" style={{ flex: 1 }} readOnly={readOnly} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <GiSparkles size={14} style={{ color: 'var(--color-xp)' }} />
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Niv.</label>
              <input className="input" type="number" inputMode="numeric" min={1} max={20}
                value={localChar.level} onChange={e => updateField('level', parseInt(e.target.value) || 1)}
                style={{ width: '4rem', textAlign: 'center' }} readOnly={readOnly} />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <GiSparkles size={14} style={{ color: 'var(--color-xp)' }} />
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>XP</label>
              <input className="input" type="number" inputMode="numeric" min={0}
                value={localChar.xp} onChange={e => updateField('xp', parseInt(e.target.value) || 0)}
                style={{ flex: 1, textAlign: 'center' }} readOnly={readOnly} />
            </div>
          </div>
        </div>
      </div>

      {/* ── PV / CA / Vitesse ── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <GiHearts size={18} style={{ color: hpColor }} />
          <h3 style={{ fontSize: '1rem' }}>Points de Vie</h3>
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: hpColor, fontWeight: 700 }}>{hpPercent}%</span>
        </div>
        {!readOnly && (
          <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.5rem', justifyContent: 'center' }}>
            {[-10, -5, -1].map(d => (
              <button key={d} className="btn btn--danger" style={{ flex: 1, fontSize: '0.875rem', padding: '0.5rem', fontWeight: 700 }}
                onClick={() => updateField('hp_current', Math.max(0, localChar.hp_current + d))}>{d}</button>
            ))}
            {[1, 5, 10].map(d => (
              <button key={d} className="btn btn--primary" style={{ flex: 1, fontSize: '0.875rem', padding: '0.5rem', fontWeight: 700, backgroundColor: 'var(--color-success)' }}
                onClick={() => updateField('hp_current', Math.min(localChar.hp_max, localChar.hp_current + d))}>+{d}</button>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
          <input className="input" type="number" inputMode="numeric" min={0}
            value={localChar.hp_current} onChange={e => updateField('hp_current', Math.max(0, parseInt(e.target.value) || 0))}
            style={{ width: '4.5rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '1.25rem', color: hpColor }}
            readOnly={readOnly} />
          <span style={{ color: 'var(--color-text-muted)' }}>/</span>
          <input className="input" type="number" inputMode="numeric" min={0}
            value={localChar.hp_max} onChange={e => updateField('hp_max', Math.max(0, parseInt(e.target.value) || 0))}
            style={{ width: '4.5rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}
            readOnly={readOnly} />
          {!readOnly && (
            <button className="btn btn--ghost" style={{ fontSize: '0.6875rem', marginLeft: 'auto' }}
              onClick={() => updateField('hp_current', localChar.hp_max)}>Récupérer</button>
          )}
        </div>
        <div className="hp-bar hp-bar--large">
          <div className="hp-bar__fill" style={{ width: `${Math.min(100, hpPercent)}%`, backgroundColor: hpColor, transition: 'width 0.4s ease, background-color 0.4s ease' }} />
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <GiShield size={16} style={{ color: 'var(--color-armor-class)' }} />
            <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>CA</label>
            <input className="input" type="number" inputMode="numeric" min={0}
              value={localChar.armor_class} onChange={e => updateField('armor_class', parseInt(e.target.value) || 0)}
              style={{ width: '4rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }} readOnly={readOnly} />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <GiLeatherBoot size={16} style={{ color: 'var(--color-info)' }} />
            <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Vit.</label>
            <input className="input" type="number" inputMode="numeric" min={0}
              value={localChar.speed} onChange={e => updateField('speed', parseInt(e.target.value) || 0)}
              style={{ width: '4rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }} readOnly={readOnly} />
          </div>
        </div>
      </div>

      {/* ── Caractéristiques avec bonus passifs ── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <GiMuscleUp size={18} style={{ color: 'var(--color-accent)' }} />
          <h3 style={{ fontSize: '1rem' }}>Caractéristiques</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
          {ABILITIES.map(({ key, label, abilityKey, icon: Icon }) => {
            const baseVal      = (localChar as any)[key] as number;
            const bonus        = passiveBonusFor(abilityKey);
            const effectiveVal = baseVal + bonus;
            const hasBonus     = bonus !== 0;
            const bonusColor   = bonus > 0 ? 'var(--color-success)' : 'var(--color-error)';
            const sources      = hasBonus ? passiveBonusSourcesFor(abilityKey) : '';

            return (
              <div
                key={key}
                title={hasBonus ? `Bonus passif : ${sources}` : undefined}
                className="stat-block"
                style={{
                  // Fond coloré si bonus passif
                  backgroundColor: hasBonus
                    ? bonus > 0 ? 'rgba(39,174,96,0.1)' : 'rgba(231,76,60,0.1)'
                    : 'var(--color-background-alt)',
                  border: hasBonus
                    ? `1px solid ${bonusColor}`
                    : '1px solid transparent',
                  borderRadius: 'var(--button-radius)',
                  padding: '0.5rem', gap: '0.125rem',
                  position: 'relative',
                  transition: 'background-color 0.3s, border-color 0.3s',
                }}
              >
                <Icon size={14} style={{ color: hasBonus ? bonusColor : 'var(--color-text-muted)' }} />
                <span className="stat-block__label" style={{ color: hasBonus ? bonusColor : undefined }}>{label}</span>

                {/* Valeur effective avec +1/-1 (verrouillé — pas de saisie directe) */}
                {!readOnly ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.1rem' }}>
                    <button className="btn btn--ghost"
                      onClick={() => updateField(key, Math.max(1, baseVal - 1))}
                      style={{ padding: '0.1rem 0.3rem', minHeight: 'unset', fontSize: '0.8rem', lineHeight: 1 }}
                    >−</button>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '1.125rem', fontWeight: 700,
                      minWidth: '1.75rem', textAlign: 'center',
                      color: hasBonus ? bonusColor : 'var(--color-text-primary)',
                    }}>
                      {effectiveVal}
                    </span>
                    <button className="btn btn--ghost"
                      onClick={() => updateField(key, Math.min(30, baseVal + 1))}
                      style={{ padding: '0.1rem 0.3rem', minHeight: 'unset', fontSize: '0.8rem', lineHeight: 1 }}
                    >+</button>
                  </div>
                ) : (
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '1.125rem', fontWeight: 700,
                    color: hasBonus ? bonusColor : 'var(--color-text-primary)',
                  }}>
                    {effectiveVal}
                  </span>
                )}

                {/* Modificateur D&D5e basé sur valeur effective */}
                <span style={{
                  fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', fontWeight: 700,
                  color: hasBonus ? bonusColor : 'var(--color-accent)',
                }}>
                  {modStr(effectiveVal)}
                </span>

                {/* Valeur de base en petit (coin haut-droit) si bonus actif */}
                {hasBonus && (
                  <span style={{
                    position: 'absolute', top: '0.2rem', right: '0.3rem',
                    fontSize: '0.5rem', fontFamily: 'var(--font-mono)',
                    color: 'var(--color-text-muted)', lineHeight: 1,
                  }}>
                    base {baseVal}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Effets ── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GiSparkles size={18} style={{ color: 'var(--color-warning)' }} />
            <h3 style={{ fontSize: '1rem' }}>Effets ({effects.length})</h3>
          </div>
          {!readOnly && (
            <button className="btn btn--ghost" onClick={() => setShowEffectForm(!showEffectForm)} style={{ fontSize: '0.75rem' }}>
              {showEffectForm ? 'Annuler' : '+ Effet'}
            </button>
          )}
        </div>
        {showEffectForm && !readOnly && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '0.75rem', padding: '0.5rem', backgroundColor: 'var(--color-background-alt)', borderRadius: 'var(--button-radius)' }}>
            <input className="input" placeholder="Nom de l'effet" value={newEffect.name} onChange={e => setNewEffect({ ...newEffect, name: e.target.value })} />
            <input className="input" placeholder="Description" value={newEffect.description} onChange={e => setNewEffect({ ...newEffect, description: e.target.value })} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input className="input" placeholder="Source" value={newEffect.source} onChange={e => setNewEffect({ ...newEffect, source: e.target.value })} style={{ flex: 1 }} />
              <button className={newEffect.is_positive ? 'btn btn--primary' : 'btn btn--danger'}
                onClick={() => setNewEffect({ ...newEffect, is_positive: !newEffect.is_positive })}
                style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                {newEffect.is_positive ? '✨ Positif' : '💀 Négatif'}
              </button>
            </div>
            <button className="btn btn--primary" onClick={addEffect} disabled={!newEffect.name.trim()} style={{ fontSize: '0.8125rem' }}>Ajouter</button>
          </div>
        )}
        {effects.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>Aucun effet actif</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {effects.map(e => (
              <div key={e.id} className="animate-pop-in" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.375rem 0.5rem', backgroundColor: 'var(--color-background-alt)',
                borderRadius: 'var(--button-radius)',
                borderLeft: `3px solid ${e.is_positive ? 'var(--color-success)' : 'var(--color-error)'}`,
              }}>
                <div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{e.name}</span>
                  {e.description && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>{e.description}</span>}
                  {e.source && <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', display: 'block' }}>Source: {e.source}</span>}
                </div>
                {!readOnly && (
                  <button className="btn btn--ghost" onClick={() => removeEffect(e.id)}
                    style={{ fontSize: '0.75rem', color: 'var(--color-error)', padding: '0.25rem 0.5rem', minWidth: '2.5rem' }}>✕</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Notes — masquées en mode combat pour économiser l'espace ── */}
      {!inCombat && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <GiQuillInk size={18} style={{ color: 'var(--color-accent)' }} />
            <h3 style={{ fontSize: '1rem' }}>Notes</h3>
          </div>
          <textarea className="input" rows={4} value={localChar.notes}
            onChange={e => updateField('notes', e.target.value)}
            placeholder="Notes personnelles..." readOnly={readOnly} style={{ resize: 'vertical' }} />
        </div>
      )}
    </>
  );
}