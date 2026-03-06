import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { GiScrollUnfurled, GiSkills, GiBroadsword, GiSparkles } from 'react-icons/gi';
import { Tooltip } from '../ui/Tooltip';
import SkillForm from './skills/SkillForm';
import ActiveSkillRow from './skills/ActiveSkillRow';
import PassiveSkillRow from './skills/PassiveSkillRow';
import { type Skill, type CharStats, type NewSkillForm, EMPTY_FORM } from './skills/types';

export interface SkillsListProps {
  characterId: string;
  canEdit: boolean;
  charStats?: CharStats;
}

export default function SkillsList({ characterId, canEdit, charStats }: SkillsListProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewSkillForm>(EMPTY_FORM);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchSkills = useCallback(async () => {
    const { data } = await supabase.from('skills').select('*').eq('character_id', characterId).order('sort_order');
    if (data) setSkills(data);
    setLoading(false);
  }, [characterId]);

  useEffect(() => { fetchSkills(); }, [fetchSkills]);

  useEffect(() => {
    const ch = supabase.channel('skills-' + characterId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'skills', filter: 'character_id=eq.' + characterId }, fetchSkills)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [characterId, fetchSkills]);

  async function addSkill() {
    if (!form.name.trim()) return;
    const maxOrder = skills.length > 0 ? Math.max(...skills.map(s => s.sort_order)) + 1 : 0;
    await supabase.from('skills').insert({
      character_id: characterId,
      name: form.name.trim(),
      description: form.description,
      modifier: form.modifier,
      is_hidden: form.is_hidden,
      is_active: form.is_active,
      ability: form.ability || null,
      proficiency: form.proficiency,
      action_cost: form.action_cost || null,
      uses_max: form.uses_max ? parseInt(form.uses_max) : null,
      uses_remaining: form.uses_max ? parseInt(form.uses_max) : null,
      rest_reset: form.rest_reset || null,
      stat_bonus_ability: form.stat_bonus_ability || null,
      stat_bonus_value: form.stat_bonus_value ? parseInt(form.stat_bonus_value) : null,
      sort_order: maxOrder,
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
    fetchSkills();
  }

  async function removeSkill(id: string) {
    await supabase.from('skills').delete().eq('id', id);
    setSkills(s => s.filter(x => x.id !== id));
  }

  async function toggleHidden(skill: Skill) {
    await supabase.from('skills').update({ is_hidden: !skill.is_hidden }).eq('id', skill.id);
    fetchSkills();
  }

  async function useCharge(skill: Skill) {
    if (skill.uses_remaining === null || skill.uses_remaining <= 0) return;
    await supabase.from('skills').update({ uses_remaining: skill.uses_remaining - 1 }).eq('id', skill.id);
    fetchSkills();
  }

  async function resetCharges(skill: Skill) {
    if (skill.uses_max === null) return;
    await supabase.from('skills').update({ uses_remaining: skill.uses_max }).eq('id', skill.id);
    fetchSkills();
  }

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Chargement...</p>;

  const actives = skills.filter(s => s.is_active);
  const passives = skills.filter(s => !s.is_active);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GiSkills size={20} style={{ color: 'var(--color-accent)' }} />
          <h2 style={{ fontSize: '1.25rem' }}>Compétences ({skills.length})</h2>
        </div>
        {canEdit && <button className="btn btn--ghost" onClick={() => setShowForm(!showForm)} style={{ fontSize: '0.75rem' }}>{showForm ? 'Annuler' : '+ Compétence'}</button>}
      </div>

      {showForm && canEdit && <SkillForm form={form} setForm={setForm} onAdd={addSkill} />}

      {actives.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-error)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <GiBroadsword size={11} /> Actifs ({actives.length})
            </p>
            <Tooltip text="Compétences à déclencher manuellement (attaques, capacités de classe, sorts...)." />
          </div>
          {actives.map(s => (
            <ActiveSkillRow key={s.id} skill={s} canEdit={canEdit} charStats={charStats} expanded={expanded === s.id} onExpand={() => setExpanded(expanded === s.id ? null : s.id)} onHide={toggleHidden} onDelete={removeSkill} onUse={useCharge} onReset={resetCharges} />
          ))}
        </div>
      )}

      {passives.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <p style={{ fontSize: '0.6875rem', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <GiSparkles size={11} /> Passifs ({passives.length})
            </p>
            <Tooltip text="Bonus permanents appliqués automatiquement." />
          </div>
          {passives.map(s => (
            <PassiveSkillRow key={s.id} skill={s} canEdit={canEdit} charStats={charStats} expanded={expanded === s.id} onExpand={() => setExpanded(expanded === s.id ? null : s.id)} onHide={toggleHidden} onDelete={removeSkill} />
          ))}
        </div>
      )}

      {skills.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <GiScrollUnfurled size={24} style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>Aucune compétence</p>
          {canEdit && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', opacity: 0.7 }}>Clique sur "+ Compétence" pour en ajouter une</p>}
        </div>
      )}
    </div>
  );
}