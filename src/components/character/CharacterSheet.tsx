import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Tables, Enums } from '../../types/database';
import { GiHearts, GiShield, GiLeatherBoot, GiBroadsword, GiMuscleUp, GiRunningNinja, GiBrain, GiPrayer, GiChatBubble, GiSparkles, GiScrollUnfurled, GiQuillInk } from 'react-icons/gi';

interface CharacterSheetProps {
  campaignId: string;
  readOnly?: boolean;
  characterId?: string;
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

/** Calcule le modificateur D&D5e à partir d'une valeur de caractéristique */
function modifier(value: number): string {
  const mod = Math.floor((value - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export default function CharacterSheet({ campaignId, readOnly, characterId }: CharacterSheetProps) {
  const { user } = useAuth();
  const [char,      setChar]      = useState<Tables<'characters'> | null>(null);
  const [effects,   setEffects]   = useState<Tables<'effects'>[]>([]);
  const [skills,    setSkills]    = useState<Tables<'skills'>[]>([]);
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
      const { data } = await supabase.from('characters').select('*').eq('campaign_id', campaignId).eq('user_id', user.id).single();
      if (data) { setChar(data); setLocalChar(data); }
    }
    setLoading(false);
  }, [campaignId, user, characterId]);

  const fetchEffects = useCallback(async (cid: string) => {
    const { data } = await supabase.from('effects').select('*').eq('character_id', cid).order('created_at');
    if (data) setEffects(data);
  }, []);

  /** Charger les compétences passives avec bonus sur stat */
  const fetchPassiveSkillBonuses = useCallback(async (cid: string) => {
    const { data } = await supabase
      .from('skills').select('stat_bonus_ability, stat_bonus_value')
      .eq('character_id', cid)
      .eq('is_active', false)
      .eq('is_hidden', false)
      .not('stat_bonus_ability', 'is', null)
      .not('stat_bonus_value',   'is', null);
    if (data) setSkills(data as Tables<'skills'>[]);
  }, []);

  useEffect(() => { fetchChar(); }, [fetchChar]);
  useEffect(() => {
    if (char) {
      fetchEffects(char.id);
      fetchPassiveSkillBonuses(char.id);
    }
  }, [char?.id, fetchEffects, fetchPassiveSkillBonuses]);

  useEffect(() => {
    if (!char) return;
    const channel = supabase.channel('char-' + char.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'characters', filter: 'id=eq.' + char.id }, (p: any) => {
        if (readOnly && p.new) { setChar(p.new); setLocalChar(p.new); }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'effects', filter: 'character_id=eq.' + char.id }, () => {
        fetchEffects(char.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'skills', filter: 'character_id=eq.' + char.id }, () => {
        fetchPassiveSkillBonuses(char.id);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [char?.id, fetchEffects, fetchPassiveSkillBonuses, readOnly]);

  useEffect(() => {
    return () => { Object.values(saveTimers.current).forEach(clearTimeout); };
  }, []);

  async function createCharacter() {
    if (!user) return;
    setSaving(true);
    const { data } = await supabase.from('characters').insert({ campaign_id: campaignId, user_id: user.id, name: 'Nouveau Personnage' }).select().single();
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

  /** Calcule le total des bonus passifs pour une caractéristique donnée */
  function passiveBonusFor(abilityKey: SkillAbility): number {
    return skills
      .filter(s => s.stat_bonus_ability === abilityKey && s.stat_bonus_value !== null)
      .reduce((sum, s) => sum + (s.stat_bonus_value ?? 0), 0);
  }

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Chargement...</p>;

  if (!localChar) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <GiBroadsword size={32} style={{ color: 'var(--color-accent)', marginBottom: '0.75rem' }} />
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Pas encore de personnage</p>
        <button className="btn btn--primary" onClick={createCharacter} disabled={saving}>{saving ? '...' : 'Créer mon personnage'}</button>
      </div>
    );
  }

  const hpPercent = localChar.hp_max > 0 ? Math.round((localChar.hp_current / localChar.hp_max) * 100) : 0;
  const hpColor   = hpPercent > 60 ? 'var(--color-hp)' : hpPercent > 30 ? 'var(--color-warning)' : 'var(--color-error)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

      {/* ── Identité ── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <GiScrollUnfurled size={18} style={{ color: 'var(--color-accent)' }} />
          <h2 style={{ fontSize: '1.125rem' }}>Identité</h2>
          {saving && <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>sauvegarde...</span>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <input className="input" value={localChar.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Nom" readOnly={readOnly} />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input className="input" value={localChar.race}  onChange={(e) => updateField('race',  e.target.value)} placeholder="Race"   style={{ flex: 1 }} readOnly={readOnly} />
            <input className="input" value={localChar.class} onChange={(e) => updateField('class', e.target.value)} placeholder="Classe" style={{ flex: 1 }} readOnly={readOnly} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <GiSparkles size={14} style={{ color: 'var(--color-xp)' }} />
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Niv.</label>
              <input className="input" type="number" inputMode="numeric" min={1} max={20}
                value={localChar.level} onChange={(e) => updateField('level', parseInt(e.target.value) || 1)}
                style={{ width: '4rem', textAlign: 'center' }} readOnly={readOnly} />
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <GiSparkles size={14} style={{ color: 'var(--color-xp)' }} />
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>XP</label>
              <input className="input" type="number" inputMode="numeric" min={0}
                value={localChar.xp} onChange={(e) => updateField('xp', parseInt(e.target.value) || 0)}
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
            {[-10, -5, -1].map(delta => (
              <button key={delta} className="btn btn--danger"
                style={{ flex: 1, fontSize: '0.875rem', padding: '0.5rem', fontWeight: 700 }}
                onClick={() => updateField('hp_current', Math.max(0, localChar.hp_current + delta))}
              >{delta}</button>
            ))}
            {[1, 5, 10].map(delta => (
              <button key={delta} className="btn btn--primary"
                style={{ flex: 1, fontSize: '0.875rem', padding: '0.5rem', fontWeight: 700, backgroundColor: 'var(--color-success)' }}
                onClick={() => updateField('hp_current', Math.min(localChar.hp_max, localChar.hp_current + delta))}
              >+{delta}</button>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
          <input className="input" type="number" inputMode="numeric" min={0}
            value={localChar.hp_current}
            onChange={(e) => updateField('hp_current', Math.max(0, parseInt(e.target.value) || 0))}
            style={{ width: '4.5rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '1.25rem', color: hpColor }}
            readOnly={readOnly} />
          <span style={{ color: 'var(--color-text-muted)' }}>/</span>
          <input className="input" type="number" inputMode="numeric" min={0}
            value={localChar.hp_max}
            onChange={(e) => updateField('hp_max', Math.max(0, parseInt(e.target.value) || 0))}
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
              value={localChar.armor_class}
              onChange={(e) => updateField('armor_class', parseInt(e.target.value) || 0)}
              style={{ width: '4rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}
              readOnly={readOnly} />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <GiLeatherBoot size={16} style={{ color: 'var(--color-info)' }} />
            <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Vit.</label>
            <input className="input" type="number" inputMode="numeric" min={0}
              value={localChar.speed}
              onChange={(e) => updateField('speed', parseInt(e.target.value) || 0)}
              style={{ width: '4rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }}
              readOnly={readOnly} />
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
            const val        = (localChar as any)[key] as number;
            const bonus      = passiveBonusFor(abilityKey);
            const effectiveVal = val + bonus;
            const hasBonus   = bonus !== 0;
            const bonusColor = bonus > 0 ? 'var(--color-success)' : 'var(--color-error)';

            return (
              <div key={key} className="stat-block" style={{ backgroundColor: 'var(--color-background-alt)', borderRadius: 'var(--button-radius)', padding: '0.5rem', gap: '0.125rem', position: 'relative' }}>
                <Icon size={14} style={{ color: 'var(--color-text-muted)' }} />
                <span className="stat-block__label">{label}</span>
                <input
                  className="input"
                  type="number"
                  inputMode="numeric"
                  min={1} max={30}
                  value={val}
                  onChange={(e) => updateField(key, parseInt(e.target.value) || 10)}
                  style={{ width: '3.5rem', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '1.125rem', fontWeight: 700, padding: '0.25rem' }}
                  readOnly={readOnly}
                />
                {/* Modificateur D&D5e — utilise la valeur effective (avec bonus passifs) */}
                <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', fontWeight: 700 }}>
                  {modifier(effectiveVal)}
                </span>
                {/* Bonus passif en petit entre parenthèses */}
                {hasBonus && (
                  <span style={{
                    fontSize: '0.5625rem', fontFamily: 'var(--font-mono)',
                    color: bonusColor, fontWeight: 700,
                    position: 'absolute', bottom: '0.2rem', right: '0.3rem',
                    lineHeight: 1,
                  }}>
                    ({bonus > 0 ? `+${bonus}` : bonus})
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
            <input className="input" placeholder="Nom de l'effet" value={newEffect.name} onChange={(e) => setNewEffect({ ...newEffect, name: e.target.value })} />
            <input className="input" placeholder="Description" value={newEffect.description} onChange={(e) => setNewEffect({ ...newEffect, description: e.target.value })} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input className="input" placeholder="Source" value={newEffect.source} onChange={(e) => setNewEffect({ ...newEffect, source: e.target.value })} style={{ flex: 1 }} />
              <button
                className={newEffect.is_positive ? 'btn btn--primary' : 'btn btn--danger'}
                onClick={() => setNewEffect({ ...newEffect, is_positive: !newEffect.is_positive })}
                style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}
              >{newEffect.is_positive ? '✨ Positif' : '💀 Négatif'}</button>
            </div>
            <button className="btn btn--primary" onClick={addEffect} disabled={!newEffect.name.trim()} style={{ fontSize: '0.8125rem' }}>Ajouter</button>
          </div>
        )}
        {effects.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>Aucun effet actif</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {effects.map(e => (
              <div key={e.id} className="animate-pop-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.375rem 0.5rem', backgroundColor: 'var(--color-background-alt)', borderRadius: 'var(--button-radius)', borderLeft: `3px solid ${e.is_positive ? 'var(--color-success)' : 'var(--color-error)'}` }}>
                <div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{e.name}</span>
                  {e.description && <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>{e.description}</span>}
                  {e.source && <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', display: 'block' }}>Source: {e.source}</span>}
                </div>
                {!readOnly && (
                  <button className="btn btn--ghost" onClick={() => removeEffect(e.id)} style={{ fontSize: '0.75rem', color: 'var(--color-error)', padding: '0.25rem 0.5rem', minWidth: '2.5rem' }}>✕</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Notes ── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <GiQuillInk size={18} style={{ color: 'var(--color-accent)' }} />
          <h3 style={{ fontSize: '1rem' }}>Notes</h3>
        </div>
        <textarea className="input" rows={4} value={localChar.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder="Notes personnelles..." readOnly={readOnly} style={{ resize: 'vertical' }} />
      </div>
    </div>
  );
}