import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { GiWolfHead, GiHearts, GiShield, GiSparkles, GiQuillInk, GiDeathSkull } from 'react-icons/gi';
interface Monster { id: string; name: string; hp_default: number; armor_class: number; notes: string; is_favorite: boolean; }

export default function MonsterLibrary() {
  const { user } = useAuth();
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', hp_default: 10, armor_class: 10, notes: '' });

  const fetchMonsters = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('monster_library').select('id, name, hp_default, armor_class, notes, is_favorite').eq('created_by', user.id).order('is_favorite', { ascending: false }).order('name');
    if (data) setMonsters(data); setLoading(false);
  }, [user]);

  useEffect(() => { fetchMonsters(); }, [fetchMonsters]);

  async function addMonster() {
    if (!user || !form.name.trim()) return;
    await supabase.from('monster_library').insert({ created_by: user.id, name: form.name.trim(), hp_default: form.hp_default, armor_class: form.armor_class, notes: form.notes });
    setForm({ name: '', hp_default: 10, armor_class: 10, notes: '' }); setShowAdd(false); fetchMonsters();
  }

  async function toggleFavorite(m: Monster) {
    await supabase.from('monster_library').update({ is_favorite: !m.is_favorite }).eq('id', m.id); fetchMonsters();
  }

  async function deleteMonster(id: string) {
    await supabase.from('monster_library').delete().eq('id', id); fetchMonsters();
  }

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Chargement...</p>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><GiWolfHead /> Bestiaire ({monsters.length})</h2>
        <button className="btn btn--secondary btn--secondary-active" onClick={() => setShowAdd(!showAdd)} style={{ fontSize: '0.8125rem' }}>Ajouter</button>
      </div>

      {showAdd && (
        <div className="card animate-fade-in" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input className="input" placeholder="Nom du monstre" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ flex: 1 }}><label style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}><GiHearts size={10} /> PV</label><input className="input" type="number" min={0} value={form.hp_default} onChange={e => setForm({ ...form, hp_default: Math.max(0, +e.target.value) })} /></div>
              <div style={{ flex: 1 }}><label style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}><GiShield size={10} /> CA</label><input className="input" type="number" min={0} value={form.armor_class} onChange={e => setForm({ ...form, armor_class: Math.max(0, +e.target.value) })} /></div>
            </div>
            <textarea className="input" placeholder="Notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
            <button className="btn btn--primary" onClick={addMonster} disabled={!form.name.trim()}>Ajouter au bestiaire</button>
          </div>
        </div>
      )}

      {monsters.length === 0 ? (
        <div className="card" style={{ textAlign: 'center' }}><p style={{ color: 'var(--color-text-muted)' }}>Bestiaire vide</p></div>
      ) : (
        <div className="card-grid card-grid--2col">
          {monsters.map(m => (
            <div key={m.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <h3 style={{ fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}><GiWolfHead size={16} /> {m.name}</h3>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button className="btn btn--ghost" onClick={() => toggleFavorite(m)} style={{ padding: '0.125rem 0.25rem', color: m.is_favorite ? 'var(--color-accent)' : 'var(--color-text-muted)' }}><GiSparkles size={14} /></button>
                  <button className="btn btn--ghost" onClick={() => deleteMonster(m.id)} style={{ padding: '0.125rem 0.25rem', color: 'var(--color-error)' }}><GiDeathSkull size={14} /></button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><GiHearts size={12} style={{ color: 'var(--color-hp)' }} /> {m.hp_default} PV</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><GiShield size={12} /> CA {m.armor_class}</span>
              </div>
              {m.notes && <p style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'flex-start', gap: '0.25rem' }}><GiQuillInk size={12} style={{ flexShrink: 0, marginTop: '0.125rem' }} /> {m.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
