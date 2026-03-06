import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { GiSpellBook, GiMagicSwirl, GiCrystalBall, GiFireSpellCast, GiConcentrationOrb } from 'react-icons/gi';
import SpellList from './spells/SpellList';
import SpellCombatCard from './spells/SpellCombatCard';
import { type Spell, type SpellSlot, SLOT_LEVELS, ORDINAL, CASTING_TIMES, emptySpell } from './spells/types';

interface SpellsPanelProps {
  characterId: string;
  readOnly?: boolean;
  combatMode?: boolean;
}

function SlotPip({ filled }: { filled: boolean }) {
  return <div style={{ width: '1rem', height: '1rem', borderRadius: '50%', border: '1.5px solid var(--color-accent)', backgroundColor: filled ? 'var(--color-accent)' : 'transparent', transition: 'background-color 0.15s', flexShrink: 0 }} />;
}

export default function SpellsPanel({ characterId, readOnly, combatMode }: SpellsPanelProps) {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [slots, setSlots] = useState<SpellSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<Spell, 'id' | 'created_at'>>(emptySpell(characterId));
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'cantrips' | 'prepared' | 'known'>('prepared');

  const fetchSpells = useCallback(async () => {
    const { data } = await supabase.from('spells').select('*').eq('character_id', characterId).order('level').order('sort_order').order('name');
    if (data) setSpells(data);
  }, [characterId]);

  const fetchSlots = useCallback(async () => {
    const { data } = await supabase.from('spell_slots').select('*').eq('character_id', characterId).order('slot_level');
    if (data) setSlots(data);
  }, [characterId]);

  useEffect(() => { Promise.all([fetchSpells(), fetchSlots()]).finally(() => setLoading(false)); }, [fetchSpells, fetchSlots]);

  useEffect(() => {
    const ch = supabase.channel('spells-' + characterId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spells', filter: `character_id=eq.${characterId}` }, fetchSpells)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'spell_slots', filter: `character_id=eq.${characterId}` }, fetchSlots)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [characterId, fetchSpells, fetchSlots]);

  async function addSpell() {
    if (!form.name.trim()) return;
    setSaving(true);
    const { data } = await supabase.from('spells').insert(form).select().single();
    if (data) { setSpells(prev => [...prev, data]); setForm(emptySpell(characterId)); setShowForm(false); }
    setSaving(false);
  }

  async function togglePrepared(spell: Spell) { const val = !spell.is_prepared; setSpells(prev => prev.map(s => s.id === spell.id ? { ...s, is_prepared: val } : s)); await supabase.from('spells').update({ is_prepared: val }).eq('id', spell.id); }
  async function deleteSpell(id: string) { setSpells(prev => prev.filter(s => s.id !== id)); await supabase.from('spells').delete().eq('id', id); }

  async function upsertSlotTotal(level: number, total: number) {
    const existing = slots.find(s => s.slot_level === level);
    if (existing) {
      const upd = { ...existing, slots_total: Math.max(0, total), slots_used: Math.min(existing.slots_used, Math.max(0, total)) };
      setSlots(prev => prev.map(s => s.slot_level === level ? upd : s));
      await supabase.from('spell_slots').update({ slots_total: upd.slots_total, slots_used: upd.slots_used }).eq('id', existing.id);
    } else if (total > 0) {
      const { data } = await supabase.from('spell_slots').insert({ character_id: characterId, slot_level: level, slots_total: total, slots_used: 0 }).select().single();
      if (data) setSlots(prev => [...prev, data].sort((a, b) => a.slot_level - b.slot_level));
    }
  }

  async function useSlot(level: number) { const s = slots.find(x => x.slot_level === level); if (!s || s.slots_used >= s.slots_total) return; const used = s.slots_used + 1; setSlots(prev => prev.map(x => x.slot_level === level ? { ...x, slots_used: used } : x)); await supabase.from('spell_slots').update({ slots_used: used }).eq('id', s.id); }
  async function restoreSlot(level: number) { const s = slots.find(x => x.slot_level === level); if (!s || s.slots_used === 0) return; const used = s.slots_used - 1; setSlots(prev => prev.map(x => x.slot_level === level ? { ...x, slots_used: used } : x)); await supabase.from('spell_slots').update({ slots_used: used }).eq('id', s.id); }
  async function longRest() { const updated = slots.map(s => ({ ...s, slots_used: 0 })); setSlots(updated); await Promise.all(updated.map(s => supabase.from('spell_slots').update({ slots_used: 0 }).eq('id', s.id))); }
  async function castSpell(_spell: Spell, slotLevel: number) { if (slotLevel > 0) await useSlot(slotLevel); }

  const cantrips = spells.filter(s => s.level === 0);
  const prepared = spells.filter(s => s.level > 0 && s.is_prepared);
  const known = spells.filter(s => s.level > 0 && !s.is_prepared);
  const usedSlots = slots.reduce((acc, s) => acc + s.slots_used, 0);
  const totalSlots = slots.reduce((acc, s) => acc + s.slots_total, 0);

  if (loading) return <p style={{ color: 'var(--color-text-muted)', padding: '1rem' }}>Chargement...</p>;

  if (combatMode) {
    const combatSpells = [...cantrips, ...prepared];
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div className="card" style={{ padding: '0.5rem 0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><GiMagicSwirl size={16} style={{ color: 'var(--color-accent)' }} /><h3 style={{ fontSize: '0.9375rem' }}>Sorts</h3></div>
            {totalSlots > 0 && <button className="btn btn--ghost" onClick={longRest} style={{ fontSize: '0.625rem', color: 'var(--color-info)' }}>↺ Repos long</button>}
          </div>
          {totalSlots > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>{SLOT_LEVELS.map(level => { const slot = slots.find(s => s.slot_level === level); const total = slot?.slots_total ?? 0; if (total === 0) return null; const used = slot?.slots_used ?? 0; const available = total - used; return <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><span style={{ fontSize: '0.5625rem', color: 'var(--color-text-muted)', minWidth: '2rem', fontFamily: 'var(--font-mono)' }}>{ORDINAL[level]}</span><div style={{ display: 'flex', gap: '0.2rem', flex: 1, flexWrap: 'wrap' }}>{Array.from({ length: total }).map((_, i) => <button key={i} className="btn btn--ghost" onClick={() => i < available ? useSlot(level) : restoreSlot(level)} style={{ padding: 0, minHeight: 'unset' }}><SlotPip filled={i < available} /></button>)}</div><span style={{ fontSize: '0.5625rem', fontFamily: 'var(--font-mono)', color: available > 0 ? 'var(--color-text-muted)' : 'var(--color-error)' }}>{available}/{total}</span></div>; })}</div>}
        </div>
        {combatSpells.length === 0 ? <div className="card" style={{ textAlign: 'center', padding: '0.75rem' }}><p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>Aucun sort préparé</p></div> : <div className="card" style={{ padding: '0.5rem 0.75rem' }}><p style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.375rem' }}>Sorts disponibles ({combatSpells.length})</p><div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>{combatSpells.map(spell => <SpellCombatCard key={spell.id} spell={spell} slots={slots} onCast={slotLevel => castSpell(spell, slotLevel)} />)}</div></div>}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><GiMagicSwirl size={18} style={{ color: 'var(--color-accent)' }} /><h3 style={{ fontSize: '1rem' }}>Emplacements de sort</h3></div>
          {!readOnly && totalSlots > 0 && <button className="btn btn--ghost" onClick={longRest} style={{ fontSize: '0.6875rem', color: 'var(--color-info)' }}>Repos long ↺</button>}
        </div>
        {totalSlots > 0 && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: usedSlots >= totalSlots ? 'var(--color-error)' : 'var(--color-text-muted)', marginBottom: '0.5rem' }}>{totalSlots - usedSlots}/{totalSlots} disponibles</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>{SLOT_LEVELS.map(level => { const slot = slots.find(s => s.slot_level === level); const total = slot?.slots_total ?? 0; const used = slot?.slots_used ?? 0; const available = total - used; return <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', minWidth: '2.5rem', fontFamily: 'var(--font-mono)' }}>{ORDINAL[level]}</span>{total > 0 && <div style={{ display: 'flex', gap: '0.25rem', flex: 1, flexWrap: 'wrap' }}>{Array.from({ length: total }).map((_, i) => <button key={i} className="btn btn--ghost" onClick={() => !readOnly && (i < available ? useSlot(level) : restoreSlot(level))} disabled={readOnly} style={{ padding: 0, minHeight: 'unset' }}><SlotPip filled={i < available} /></button>)}</div>}{!readOnly && <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: 'auto', flexShrink: 0 }}><button className="btn btn--ghost" onClick={() => upsertSlotTotal(level, total - 1)} disabled={total === 0} style={{ fontSize: '0.75rem', padding: '0.125rem 0.375rem', minHeight: 'unset' }}>−</button><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', minWidth: '1rem', textAlign: 'center' }}>{total}</span><button className="btn btn--ghost" onClick={() => upsertSlotTotal(level, total + 1)} style={{ fontSize: '0.75rem', padding: '0.125rem 0.375rem', minHeight: 'unset' }}>+</button></div>}</div>; })}</div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><GiSpellBook size={18} style={{ color: 'var(--color-accent)' }} /><h3 style={{ fontSize: '1rem' }}>Sorts ({spells.length})</h3></div>
          {!readOnly && <button className="btn btn--ghost btn--add-toggle" onClick={() => setShowForm(x => !x)} style={{ fontSize: '0.75rem' }}>{showForm ? 'Annuler' : '+ Sort'}</button>}
        </div>

        {showForm && !readOnly && (
          <div className="animate-fade-in" style={{ backgroundColor: 'var(--color-background-alt)', borderRadius: 'var(--button-radius)', padding: '0.75rem', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}><input className="input" placeholder="Nom du sort *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={{ flex: 2 }} /><select className="input" value={form.level} onChange={e => setForm(f => ({ ...f, level: parseInt(e.target.value) }))} style={{ flex: 1 }}><option value={0}>Cantrip</option>{SLOT_LEVELS.map(l => <option key={l} value={l}>Niv. {l}</option>)}</select></div>
            <div style={{ display: 'flex', gap: '0.5rem' }}><select className="input" value={form.casting_time} onChange={e => setForm(f => ({ ...f, casting_time: e.target.value }))} style={{ flex: 1 }}>{CASTING_TIMES.map(t => <option key={t} value={t}>{t}</option>)}</select><input className="input" placeholder="Portée (ex: 9m)" value={form.range} onChange={e => setForm(f => ({ ...f, range: e.target.value }))} style={{ flex: 1 }} /></div>
            <div style={{ display: 'flex', gap: '0.5rem' }}><input className="input" placeholder="Durée" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} style={{ flex: 1 }} /><input className="input" placeholder="Dés (ex: 2d6+3)" value={form.damage_dice} onChange={e => setForm(f => ({ ...f, damage_dice: e.target.value }))} style={{ flex: 1, fontFamily: 'var(--font-mono)' }} /></div>
            <textarea className="input" placeholder="Description..." rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'none' }} />
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', cursor: 'pointer' }}><input type="checkbox" checked={form.concentration} onChange={e => setForm(f => ({ ...f, concentration: e.target.checked }))} /><GiConcentrationOrb size={14} style={{ color: 'var(--color-warning)' }} /> Concentration</label>
              {form.level > 0 && <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', cursor: 'pointer' }}><input type="checkbox" checked={form.is_prepared} onChange={e => setForm(f => ({ ...f, is_prepared: e.target.checked }))} /><GiCrystalBall size={14} style={{ color: 'var(--color-accent)' }} /> Préparé</label>}
              <button className="btn btn--primary" onClick={addSpell} disabled={saving || !form.name.trim()} style={{ marginLeft: 'auto', fontSize: '0.8125rem' }}>{saving ? '...' : 'Ajouter'}</button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem', backgroundColor: 'var(--color-background-alt)', borderRadius: 'var(--button-radius)', padding: '0.25rem' }}>
          {([
            { key: 'cantrips', label: 'Cantrips', count: cantrips.length, icon: GiFireSpellCast },
            { key: 'prepared', label: 'Préparés', count: prepared.length, icon: GiCrystalBall },
            { key: 'known', label: 'Connus', count: known.length, icon: GiSpellBook },
          ] as const).map(({ key, label, count, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', padding: '0.375rem 0.25rem', borderRadius: 'calc(var(--button-radius) - 2px)', fontSize: '0.75rem', fontWeight: 600, border: 'none', backgroundColor: activeTab === key ? 'var(--color-surface)' : 'transparent', color: activeTab === key ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
              <Icon size={13} /> {label}
              <span style={{ fontSize: '0.625rem', fontFamily: 'var(--font-mono)', backgroundColor: activeTab === key ? 'var(--color-accent)' : 'var(--color-border)', color: activeTab === key ? 'var(--color-accent-text)' : 'var(--color-text-muted)', padding: '0.1rem 0.35rem', borderRadius: '999px' }}>{count}</span>
            </button>
          ))}
        </div>

        {activeTab === 'cantrips' && <SpellList spells={cantrips} emptyMsg="Aucun cantrip." readOnly={readOnly} onTogglePrepared={togglePrepared} onDelete={deleteSpell} />}
        {activeTab === 'prepared' && <SpellList spells={prepared} emptyMsg="Prépare des sorts depuis l'onglet Connus." readOnly={readOnly} onTogglePrepared={togglePrepared} onDelete={deleteSpell} />}
        {activeTab === 'known' && <SpellList spells={known} emptyMsg="Aucun sort connu non préparé." readOnly={readOnly} onTogglePrepared={togglePrepared} onDelete={deleteSpell} />}
      </div>
    </div>
  );
}
