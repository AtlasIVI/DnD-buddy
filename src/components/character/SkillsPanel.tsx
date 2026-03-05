import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import type { Tables, Enums } from '../../types/database';
import {
  GiScrollUnfurled, GiEyeTarget, GiSkills, GiBroadsword,
  GiSundial, GiMuscleUp, GiRunningNinja, GiShield,
  GiBrain, GiPrayer, GiChatBubble, GiSparkles, GiHearts,
} from 'react-icons/gi';

// ─── Types ────────────────────────────────────────────────────────────────────

type Skill = Tables<'skills'>
type SkillAbility   = Enums<'skill_ability'>
type ActionCost     = Enums<'skill_action_cost'>
type Proficiency    = Enums<'skill_proficiency'>
type RestType       = Enums<'rest_type'>

interface SkillsListProps {
  characterId: string;
  canEdit: boolean;
  /** Stats du personnage pour calculer les modificateurs auto */
  charStats?: { str: number; dex: number; con: number; int: number; wis: number; cha: number; level: number }
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const ABILITY_LABELS: Record<SkillAbility, string> = {
  STR: 'FOR', DEX: 'DEX', CON: 'CON', INT: 'INT', WIS: 'SAG', CHA: 'CHA',
}

const ABILITY_ICONS: Record<SkillAbility, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  STR: GiMuscleUp, DEX: GiRunningNinja, CON: GiShield,
  INT: GiBrain,    WIS: GiPrayer,       CHA: GiChatBubble,
}

const ACTION_LABELS: Record<ActionCost, string> = {
  action: 'Action', bonus_action: 'Bonus', reaction: 'Réaction', free: 'Gratuit',
}

const ACTION_COLORS: Record<ActionCost, string> = {
  action:       'var(--color-accent)',
  bonus_action: 'var(--color-info)',
  reaction:     'var(--color-warning)',
  free:         'var(--color-success)',
}

/** Bonus de maîtrise D&D5e selon le niveau */
function proficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1
}

/** Modificateur de caractéristique D&D5e */
function abilityMod(val: number): number {
  return Math.floor((val - 10) / 2)
}

/**
 * Calcule le modificateur final d'une compétence.
 * Si ability est défini → calcul auto : mod_carac + bonus_maîtrise
 * Sinon → modifier textuel brut
 */
function computeModifier(skill: Skill, stats?: SkillsListProps['charStats']): string {
  if (!skill.ability || !stats) return skill.modifier || '—'

  const statKey = skill.ability.toLowerCase() as keyof typeof stats
  const base = abilityMod(stats[statKey] as number)
  const pb   = proficiencyBonus(stats.level)

  let total = base
  if (skill.proficiency === 'proficient') total += pb
  if (skill.proficiency === 'expertise')  total += pb * 2

  return total >= 0 ? `+${total}` : `${total}`
}

// ─── Formulaire d'ajout ───────────────────────────────────────────────────────

interface NewSkillForm {
  name: string
  description: string
  modifier: string
  is_hidden: boolean
  is_active: boolean
  ability: SkillAbility | ''
  proficiency: Proficiency
  action_cost: ActionCost | ''
  uses_max: string
  rest_reset: RestType | ''
  stat_bonus_ability: SkillAbility | ''
  stat_bonus_value: string
}

const EMPTY_FORM: NewSkillForm = {
  name: '', description: '', modifier: '', is_hidden: false,
  is_active: false, ability: '', proficiency: 'none',
  action_cost: '', uses_max: '', rest_reset: '',
  stat_bonus_ability: '', stat_bonus_value: '',
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function SkillsList({ characterId, canEdit, charStats }: SkillsListProps) {
  const [skills,   setSkills]   = useState<Skill[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form,     setForm]     = useState<NewSkillForm>(EMPTY_FORM)
  const [expanded, setExpanded] = useState<string | null>(null)

  const fetchSkills = useCallback(async () => {
    const { data } = await supabase
      .from('skills').select('*')
      .eq('character_id', characterId)
      .order('sort_order')
    if (data) setSkills(data)
    setLoading(false)
  }, [characterId])

  useEffect(() => { fetchSkills() }, [fetchSkills])

  useEffect(() => {
    const ch = supabase.channel('skills-' + characterId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'skills', filter: 'character_id=eq.' + characterId }, () => fetchSkills())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [characterId, fetchSkills])

  async function addSkill() {
    if (!form.name.trim()) return
    const maxOrder = skills.length > 0 ? Math.max(...skills.map(s => s.sort_order)) + 1 : 0
    await supabase.from('skills').insert({
      character_id:      characterId,
      name:              form.name.trim(),
      description:       form.description,
      modifier:          form.modifier,
      is_hidden:         form.is_hidden,
      is_active:         form.is_active,
      ability:           form.ability      || null,
      proficiency:       form.proficiency,
      action_cost:       form.action_cost  || null,
      uses_max:          form.uses_max     ? parseInt(form.uses_max)      : null,
      uses_remaining:    form.uses_max     ? parseInt(form.uses_max)      : null,
      rest_reset:        form.rest_reset   || null,
      stat_bonus_ability: form.stat_bonus_ability || null,
      stat_bonus_value:  form.stat_bonus_value ? parseInt(form.stat_bonus_value) : null,
      sort_order:        maxOrder,
    })
    setForm(EMPTY_FORM)
    setShowForm(false)
    fetchSkills()
  }

  async function removeSkill(id: string) {
    await supabase.from('skills').delete().eq('id', id)
    setSkills(s => s.filter(x => x.id !== id))
  }

  async function toggleHidden(skill: Skill) {
    await supabase.from('skills').update({ is_hidden: !skill.is_hidden }).eq('id', skill.id)
    fetchSkills()
  }

  async function useCharge(skill: Skill) {
    if (skill.uses_remaining === null || skill.uses_remaining <= 0) return
    await supabase.from('skills').update({ uses_remaining: skill.uses_remaining - 1 }).eq('id', skill.id)
    fetchSkills()
  }

  async function resetCharges(skill: Skill) {
    if (skill.uses_max === null) return
    await supabase.from('skills').update({ uses_remaining: skill.uses_max }).eq('id', skill.id)
    fetchSkills()
  }

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Chargement...</p>

  // Séparer actifs et passifs
  const actives  = skills.filter(s => s.is_active)
  const passives = skills.filter(s => !s.is_active)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

      {/* ── En-tête ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GiSkills size={20} style={{ color: 'var(--color-accent)' }} />
          <h2 style={{ fontSize: '1.25rem' }}>Compétences ({skills.length})</h2>
        </div>
        {canEdit && (
          <button className="btn btn--ghost" onClick={() => setShowForm(!showForm)} style={{ fontSize: '0.75rem' }}>
            {showForm ? 'Annuler' : '+ Compétence'}
          </button>
        )}
      </div>

      {/* ── Formulaire d'ajout ── */}
      {showForm && canEdit && (
        <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

          <input className="input" placeholder="Nom de la compétence *" value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })} />

          <input className="input" placeholder="Description (optionnel)" value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })} />

          {/* Actif / Passif */}
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <button
              className={!form.is_active ? 'btn btn--primary' : 'btn btn--ghost'}
              onClick={() => setForm({ ...form, is_active: false, action_cost: '' })}
              style={{ flex: 1, fontSize: '0.75rem' }}
            >
              <GiSparkles size={13} /> Passif
            </button>
            <button
              className={form.is_active ? 'btn btn--primary' : 'btn btn--ghost'}
              onClick={() => setForm({ ...form, is_active: true })}
              style={{ flex: 1, fontSize: '0.75rem' }}
            >
              <GiBroadsword size={13} /> Actif
            </button>
          </div>

          {/* Coût d'action (uniquement si actif) */}
          {form.is_active && (
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              {(['action', 'bonus_action', 'reaction', 'free'] as ActionCost[]).map(ac => (
                <button key={ac}
                  className={form.action_cost === ac ? 'btn btn--primary' : 'btn btn--ghost'}
                  onClick={() => setForm({ ...form, action_cost: ac })}
                  style={{ flex: 1, fontSize: '0.625rem', padding: '0.25rem 0.125rem', color: ACTION_COLORS[ac] }}
                >
                  {ACTION_LABELS[ac]}
                </button>
              ))}
            </div>
          )}

          {/* Caractéristique liée */}
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
            <button
              className={!form.ability ? 'btn btn--primary' : 'btn btn--ghost'}
              onClick={() => setForm({ ...form, ability: '' })}
              style={{ fontSize: '0.6875rem', padding: '0.25rem 0.5rem' }}
            >Manuel</button>
            {(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as SkillAbility[]).map(ab => (
              <button key={ab}
                className={form.ability === ab ? 'btn btn--primary' : 'btn btn--ghost'}
                onClick={() => setForm({ ...form, ability: ab })}
                style={{ fontSize: '0.6875rem', padding: '0.25rem 0.5rem' }}
              >{ABILITY_LABELS[ab]}</button>
            ))}
          </div>

          {/* Modificateur manuel (si pas de caractéristique) */}
          {!form.ability && (
            <input className="input" placeholder="Modificateur (+3, -1...)" value={form.modifier}
              onChange={e => setForm({ ...form, modifier: e.target.value })} />
          )}

          {/* Maîtrise (si caractéristique liée) */}
          {form.ability && (
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              {(['none', 'proficient', 'expertise'] as Proficiency[]).map(p => (
                <button key={p}
                  className={form.proficiency === p ? 'btn btn--primary' : 'btn btn--ghost'}
                  onClick={() => setForm({ ...form, proficiency: p })}
                  style={{ flex: 1, fontSize: '0.6875rem' }}
                >
                  {p === 'none' ? 'Aucune' : p === 'proficient' ? 'Maîtrise' : 'Expertise'}
                </button>
              ))}
            </div>
          )}

          {/* Uses per rest */}
          <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
            <input className="input" type="number" min={1} placeholder="Utilisations max (vide = ∞)"
              value={form.uses_max} onChange={e => setForm({ ...form, uses_max: e.target.value })}
              style={{ flex: 1 }} />
            {form.uses_max && (
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {(['short', 'long'] as RestType[]).map(r => (
                  <button key={r}
                    className={form.rest_reset === r ? 'btn btn--primary' : 'btn btn--ghost'}
                    onClick={() => setForm({ ...form, rest_reset: r })}
                    style={{ fontSize: '0.6875rem', padding: '0.25rem 0.5rem' }}
                  >{r === 'short' ? 'Repos court' : 'Repos long'}</button>
                ))}
              </div>
            )}
          </div>

          {/* Bonus passif sur stat (uniquement si passif) */}
          {!form.is_active && (
            <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
              <select className="input" style={{ flex: 1, fontSize: '0.75rem' }}
                value={form.stat_bonus_ability}
                onChange={e => setForm({ ...form, stat_bonus_ability: e.target.value as SkillAbility | '' })}
              >
                <option value="">Bonus passif sur stat (optionnel)</option>
                {(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as SkillAbility[]).map(ab => (
                  <option key={ab} value={ab}>{ABILITY_LABELS[ab]}</option>
                ))}
              </select>
              {form.stat_bonus_ability && (
                <input className="input" type="number" placeholder="+2 ou -1"
                  value={form.stat_bonus_value}
                  onChange={e => setForm({ ...form, stat_bonus_value: e.target.value })}
                  style={{ width: '4.5rem', textAlign: 'center' }} />
              )}
            </div>
          )}

          {/* Options supplémentaires */}
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <button className={form.is_hidden ? 'btn btn--secondary' : 'btn btn--ghost'}
              onClick={() => setForm({ ...form, is_hidden: !form.is_hidden })}
              style={{ flex: 1, fontSize: '0.75rem' }}>
              <GiEyeTarget size={13} /> {form.is_hidden ? 'Caché' : 'Visible'}
            </button>
          </div>

          <button className="btn btn--primary" onClick={addSkill} disabled={!form.name.trim()}>
            Ajouter
          </button>
        </div>
      )}

      {/* ── Section Actifs ── */}
      {actives.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-error)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <GiBroadsword size={11} /> Actifs
          </p>
          {actives.map(s => (
            <ActiveSkillRow key={s.id} skill={s} canEdit={canEdit} charStats={charStats}
              expanded={expanded === s.id}
              onExpand={() => setExpanded(expanded === s.id ? null : s.id)}
              onHide={toggleHidden} onDelete={removeSkill}
              onUse={useCharge} onReset={resetCharges}
            />
          ))}
        </div>
      )}

      {/* ── Section Passifs ── */}
      {passives.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <GiSparkles size={11} /> Passifs
          </p>
          {passives.map(s => (
            <PassiveSkillRow key={s.id} skill={s} canEdit={canEdit} charStats={charStats}
              expanded={expanded === s.id}
              onExpand={() => setExpanded(expanded === s.id ? null : s.id)}
              onHide={toggleHidden} onDelete={removeSkill}
            />
          ))}
        </div>
      )}

      {/* ── Vide ── */}
      {skills.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <GiScrollUnfurled size={24} style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }} />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>Aucune compétence</p>
        </div>
      )}
    </div>
  )
}

// ─── Ligne — Compétence Active ─────────────────────────────────────────────────

function ActiveSkillRow({ skill, canEdit, charStats, expanded, onExpand, onHide, onDelete, onUse, onReset }: {
  skill: Skill; canEdit: boolean; charStats?: SkillsListProps['charStats']
  expanded: boolean; onExpand: () => void
  onHide: (s: Skill) => void; onDelete: (id: string) => void
  onUse: (s: Skill) => void; onReset: (s: Skill) => void
}) {
  const modStr     = computeModifier(skill, charStats)
  const hasUses    = skill.uses_max !== null
  const usesLeft   = skill.uses_remaining ?? 0
  const usesTotal  = skill.uses_max ?? 0
  const depleted   = hasUses && usesLeft <= 0
  const actionCost = skill.action_cost

  return (
    <div className="card" style={{
      padding: '0.5rem 0.75rem',
      opacity: depleted ? 0.55 : 1,
      borderLeft: actionCost ? `3px solid ${ACTION_COLORS[actionCost]}` : undefined,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

        {/* Gauche — nom + badges */}
        <button onClick={onExpand} style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{skill.name}</span>

            {/* Modificateur */}
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700,
              color: 'var(--color-accent)',
              backgroundColor: 'rgba(var(--color-accent-rgb), 0.12)',
              padding: '0.05rem 0.35rem', borderRadius: '999px',
            }}>{modStr}</span>

            {/* Coût d'action */}
            {actionCost && (
              <span style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: ACTION_COLORS[actionCost], backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>
                {ACTION_LABELS[actionCost]}
              </span>
            )}

            {/* Caractéristique liée */}
            {skill.ability && (() => {
              const Icon = ABILITY_ICONS[skill.ability]
              return <Icon size={11} style={{ color: 'var(--color-text-muted)' }} />
            })()}

            {skill.is_hidden && <span className="badge badge--hidden" style={{ fontSize: '0.5rem' }}>caché</span>}
          </div>
        </button>

        {/* Droite — uses + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginLeft: '0.5rem' }}>

          {/* Uses */}
          {hasUses && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {Array.from({ length: usesTotal }).map((_, i) => (
                <div key={i} style={{
                  width: '0.5rem', height: '0.5rem', borderRadius: '50%',
                  backgroundColor: i < usesLeft ? 'var(--color-accent)' : 'var(--color-border)',
                  transition: 'background-color 0.2s',
                }} />
              ))}
            </div>
          )}

          {/* Bouton Utiliser */}
          {canEdit && (
            <button
              className={depleted ? 'btn btn--ghost' : 'btn btn--primary'}
              onClick={() => onUse(skill)}
              disabled={depleted}
              style={{ fontSize: '0.6875rem', padding: '0.25rem 0.5rem', minHeight: 'unset' }}
            >
              {hasUses ? (depleted ? '✕' : 'Utiliser') : 'Utiliser'}
            </button>
          )}

          {canEdit && hasUses && (
            <button className="btn btn--ghost" onClick={() => onReset(skill)}
              style={{ fontSize: '0.6875rem', padding: '0.25rem 0.375rem', minHeight: 'unset' }}
              title={`Reset (${skill.rest_reset === 'short' ? 'repos court' : 'repos long'})`}
            >
              <GiSundial size={13} />
            </button>
          )}

          {canEdit && (
            <button className="btn btn--ghost" onClick={() => onHide(skill)}
              style={{ padding: '0.125rem 0.25rem', minHeight: 'unset' }}>
              <GiEyeTarget size={13} />
            </button>
          )}
          {canEdit && (
            <button className="btn btn--ghost" onClick={() => onDelete(skill.id)}
              style={{ padding: '0.125rem 0.25rem', minHeight: 'unset', color: 'var(--color-error)' }}>✕</button>
          )}
        </div>
      </div>

      {/* Détails expandés */}
      {expanded && (
        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {skill.description && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{skill.description}</p>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.6875rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
            {skill.ability && (
              <span>Stat : <strong style={{ color: 'var(--color-text-secondary)' }}>{ABILITY_LABELS[skill.ability]}</strong></span>
            )}
            {skill.proficiency !== 'none' && (
              <span>Maîtrise : <strong style={{ color: 'var(--color-text-secondary)' }}>
                {skill.proficiency === 'proficient' ? 'Oui' : 'Expertise'}
              </strong></span>
            )}
            {hasUses && (
              <span>Charges : <strong style={{ color: 'var(--color-text-secondary)' }}>{usesLeft}/{usesTotal}</strong>{skill.rest_reset && ` (reset ${skill.rest_reset === 'short' ? 'repos court' : 'repos long'})`}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Ligne — Compétence Passive ────────────────────────────────────────────────

function PassiveSkillRow({ skill, canEdit, charStats, expanded, onExpand, onHide, onDelete }: {
  skill: Skill; canEdit: boolean; charStats?: SkillsListProps['charStats']
  expanded: boolean; onExpand: () => void
  onHide: (s: Skill) => void; onDelete: (id: string) => void
}) {
  const modStr     = computeModifier(skill, charStats)
  const hasBonus   = skill.stat_bonus_ability !== null && skill.stat_bonus_value !== null
  const bonusVal   = skill.stat_bonus_value ?? 0
  const bonusColor = bonusVal >= 0 ? 'var(--color-success)' : 'var(--color-error)'

  return (
    <div className="card" style={{ padding: '0.5rem 0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

        <button onClick={onExpand} style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{skill.name}</span>

            {/* Modificateur */}
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700,
              color: 'var(--color-accent)',
              backgroundColor: 'rgba(var(--color-accent-rgb), 0.12)',
              padding: '0.05rem 0.35rem', borderRadius: '999px',
            }}>{modStr}</span>

            {/* Bonus passif sur stat — affiché en petit entre parenthèses */}
            {hasBonus && skill.stat_bonus_ability && (
              <span style={{ fontSize: '0.625rem', color: bonusColor, fontFamily: 'var(--font-mono)' }}>
                ({ABILITY_LABELS[skill.stat_bonus_ability]} {bonusVal >= 0 ? `+${bonusVal}` : bonusVal})
              </span>
            )}

            {/* Caractéristique liée */}
            {skill.ability && (() => {
              const Icon = ABILITY_ICONS[skill.ability]
              return <Icon size={11} style={{ color: 'var(--color-text-muted)' }} />
            })()}

            {skill.is_hidden && <span className="badge badge--hidden" style={{ fontSize: '0.5rem' }}>caché</span>}
          </div>
        </button>

        <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
          {canEdit && (
            <button className="btn btn--ghost" onClick={() => onHide(skill)}
              style={{ padding: '0.125rem 0.25rem', minHeight: 'unset' }}>
              <GiEyeTarget size={13} />
            </button>
          )}
          {canEdit && (
            <button className="btn btn--ghost" onClick={() => onDelete(skill.id)}
              style={{ padding: '0.125rem 0.25rem', minHeight: 'unset', color: 'var(--color-error)' }}>✕</button>
          )}
        </div>
      </div>

      {/* Détails expandés */}
      {expanded && (
        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {skill.description && (
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{skill.description}</p>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.6875rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
            {skill.ability && (
              <span>Stat : <strong style={{ color: 'var(--color-text-secondary)' }}>{ABILITY_LABELS[skill.ability]}</strong></span>
            )}
            {skill.proficiency !== 'none' && (
              <span>Maîtrise : <strong style={{ color: 'var(--color-text-secondary)' }}>
                {skill.proficiency === 'proficient' ? 'Oui' : 'Expertise'}
              </strong></span>
            )}
            {hasBonus && skill.stat_bonus_ability && (
              <span>Bonus sur <strong style={{ color: bonusColor }}>{ABILITY_LABELS[skill.stat_bonus_ability]} {bonusVal >= 0 ? `+${bonusVal}` : bonusVal}</strong></span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}