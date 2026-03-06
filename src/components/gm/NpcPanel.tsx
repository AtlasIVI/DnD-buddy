import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { GiCrownedSkull, GiHearts, GiShield, GiEyeTarget, GiQuillInk, GiWolfHead, GiSparkles, GiDeathSkull } from 'react-icons/gi';interface NpcManagerProps { campaignId: string; }
interface Npc { id: string; name: string; hp_current: number; hp_max: number; armor_class: number; notes: string; is_active: boolean; is_visible_to_players: boolean; }

export default function NpcManager({ campaignId }: NpcManagerProps) {
  const { user } = useAuth();
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', hp_max: 10, armor_class: 10, notes: '' });

  const fetchNpcs = useCallback(async () => {
    const { data } = await supabase.from('npcs').select('id, name, hp_current, hp_max, armor_class, notes, is_active, is_visible_to_players').eq('campaign_id', campaignId).order('created_at');
    if (data) setNpcs(data); setLoading(false);
  }, [campaignId]);

  useEffect(() => { fetchNpcs(); }, [fetchNpcs]);

  useEffect(() => {
    const ch = supabase.channel('npcs-' + campaignId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'npcs', filter: 'campaign_id=eq.' + campaignId }, () => fetchNpcs())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [campaignId, fetchNpcs]);

  async function addNpc() {
    if (!user || !form.name.trim()) return;
    await supabase.from('npcs').insert({ campaign_id: campaignId, created_by: user.id, name: form.name.trim(), hp_current: form.hp_max, hp_max: form.hp_max, armor_class: form.armor_class, notes: form.notes });
    setForm({ name: '', hp_max: 10, armor_class: 10, notes: '' }); setShowAdd(false); fetchNpcs();
  }

  async function toggleVisibility(npc: Npc) {
    await supabase.from('npcs').update({ is_visible_to_players: !npc.is_visible_to_players }).eq('id', npc.id);
  }

  async function updateHp(npc: Npc, delta: number) {
    const newHp = Math.max(0, Math.min(npc.hp_max, npc.hp_current + delta));
    await supabase.from('npcs').update({ hp_current: newHp }).eq('id', npc.id);
  }

  async function deleteNpc(id: string) {
    await supabase.from('npcs').delete().eq('id', id); fetchNpcs();
  }

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Chargement...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><GiWolfHead /> PNJ ({npcs.length})</h2>
        <button className="btn btn--secondary btn--secondary-active" onClick={() => setShowAdd(!showAdd)} style={{ fontSize: '0.8125rem' }}><GiSparkles size={14} /> Ajouter</button>
      </div>

      {showAdd && (
        <div className="card animate-fade-in" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input className="input" placeholder="Nom du PNJ" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ flex: 1 }}><label style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}><GiHearts size={10} /> PV Max</label><input className="input" type="number" min={0} value={form.hp_max} onChange={e => setForm({ ...form, hp_max: Math.max(0, +e.target.value) })} /></div>
              <div style={{ flex: 1 }}><label style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}><GiShield size={10} /> CA</label><input className="input" type="number" min={0} value={form.armor_class} onChange={e => setForm({ ...form, armor_class: Math.max(0, +e.target.value) })} /></div>
            </div>
            <textarea className="input" placeholder="Notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
            <button className="btn btn--primary" onClick={addNpc} disabled={!form.name.trim()}>Creer le PNJ</button>
          </div>
        </div>
      )}

      <div className="card-grid card-grid--2col">
        {npcs.map(npc => (
          <div key={npc.id} className="card" style={{ opacity: npc.is_active ? 1 : 0.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
              <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}><GiWolfHead size={16} /> {npc.name}</h3>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button className="btn btn--ghost" onClick={() => toggleVisibility(npc)} style={{ padding: '0.125rem 0.25rem', fontSize: '0.75rem', color: npc.is_visible_to_players ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                  <GiEyeTarget size={14} />
                </button>
                <button className="btn btn--ghost" onClick={() => deleteNpc(npc.id)} style={{ padding: '0.125rem 0.25rem', color: 'var(--color-error)' }}><GiDeathSkull size={14} /></button>
              </div>
            </div>
            <div className="hp-bar" style={{ marginBottom: '0.375rem' }}>
              <div className="hp-bar__fill" style={{ width: `${(npc.hp_current / npc.hp_max) * 100}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><GiHearts size={12} style={{ color: 'var(--color-hp)' }} /> {npc.hp_current}/{npc.hp_max}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><GiShield size={12} /> CA {npc.armor_class}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.375rem' }}>
              <button className="btn btn--danger" onClick={() => updateHp(npc, -1)} style={{ flex: 1, fontSize: '0.75rem', padding: '0.25rem' }}>-1</button>
              <button className="btn btn--danger" onClick={() => updateHp(npc, -5)} style={{ flex: 1, fontSize: '0.75rem', padding: '0.25rem' }}>-5</button>
              <button className="btn btn--primary" onClick={() => updateHp(npc, 1)} style={{ flex: 1, fontSize: '0.75rem', padding: '0.25rem' }}>+1</button>
              <button className="btn btn--primary" onClick={() => updateHp(npc, 5)} style={{ flex: 1, fontSize: '0.75rem', padding: '0.25rem' }}>+5</button>
            </div>
            {npc.notes && <p style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'flex-start', gap: '0.25rem' }}><GiQuillInk size={12} style={{ flexShrink: 0, marginTop: '0.125rem' }} /> {npc.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
