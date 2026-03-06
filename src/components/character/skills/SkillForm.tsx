import { GiEyeTarget, GiBroadsword, GiSparkles } from 'react-icons/gi';
import { Tooltip } from '../../ui/Tooltip';
import { type ActionCost, type NewSkillForm, type Proficiency, type RestType, type SkillAbility, ACTION_COLORS, ACTION_LABELS, ABILITY_LABELS } from './types';

function FormLabel({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginBottom: '-0.125rem' }}>
      <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
        {label}
      </span>
      <Tooltip text={tooltip} />
    </div>
  );
}

interface SkillFormProps {
  form: NewSkillForm;
  setForm: (form: NewSkillForm) => void;
  onAdd: () => void;
}

export default function SkillForm({ form, setForm, onAdd }: SkillFormProps) {
  return (
    <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      <input className="input" placeholder="Nom de la compétence *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      <input className="input" placeholder="Description (optionnel)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

      <div>
        <FormLabel label="Type" tooltip="Actif: déclenché manuellement. Passif: bonus permanent." />
        <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.375rem' }}>
          <button className={!form.is_active ? 'btn btn--primary' : 'btn btn--ghost'} onClick={() => setForm({ ...form, is_active: false, action_cost: '' })} style={{ flex: 1, fontSize: '0.75rem' }}><GiSparkles size={13} /> Passif</button>
          <button className={form.is_active ? 'btn btn--primary' : 'btn btn--ghost'} onClick={() => setForm({ ...form, is_active: true })} style={{ flex: 1, fontSize: '0.75rem' }}><GiBroadsword size={13} /> Actif</button>
        </div>
      </div>

      {form.is_active && (
        <div>
          <FormLabel label="Coût d'action" tooltip="Action, Bonus, Réaction ou Gratuit." />
          <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.375rem' }}>
            {(['action', 'bonus_action', 'reaction', 'free'] as ActionCost[]).map(ac => (
              <button key={ac} className={form.action_cost === ac ? 'btn btn--primary' : 'btn btn--ghost'} onClick={() => setForm({ ...form, action_cost: ac })} style={{ flex: 1, fontSize: '0.625rem', padding: '0.25rem 0.125rem', color: ACTION_COLORS[ac] }}>
                {ACTION_LABELS[ac]}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <FormLabel label="Modificateur" tooltip="Stat automatique ou valeur manuelle." />
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', marginTop: '0.375rem' }}>
          <button className={!form.ability ? 'btn btn--primary' : 'btn btn--ghost'} onClick={() => setForm({ ...form, ability: '' })} style={{ fontSize: '0.6875rem', padding: '0.25rem 0.5rem' }}>Manuel</button>
          {(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as SkillAbility[]).map(ab => (
            <button key={ab} className={form.ability === ab ? 'btn btn--primary' : 'btn btn--ghost'} onClick={() => setForm({ ...form, ability: ab })} style={{ fontSize: '0.6875rem', padding: '0.25rem 0.5rem' }}>{ABILITY_LABELS[ab]}</button>
          ))}
        </div>
      </div>

      {!form.ability && <input className="input" placeholder="Valeur fixe (+3, -1...)" value={form.modifier} onChange={e => setForm({ ...form, modifier: e.target.value })} />}

      {form.ability && (
        <div>
          <FormLabel label="Maîtrise" tooltip="Aucune, Maîtrise ou Expertise." />
          <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.375rem' }}>
            {(['none', 'proficient', 'expertise'] as Proficiency[]).map(p => (
              <button key={p} className={form.proficiency === p ? 'btn btn--primary' : 'btn btn--ghost'} onClick={() => setForm({ ...form, proficiency: p })} style={{ flex: 1, fontSize: '0.6875rem' }}>
                {p === 'none' ? 'Aucune' : p === 'proficient' ? 'Maîtrise' : 'Expertise'}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <FormLabel label="Utilisations" tooltip="Vide pour illimité, sinon nombre + type de repos." />
        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', marginTop: '0.375rem' }}>
          <input className="input" type="number" min={1} placeholder="Illimitées (vide)" value={form.uses_max} onChange={e => setForm({ ...form, uses_max: e.target.value })} style={{ flex: 1 }} />
          {form.uses_max && (
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              {(['short', 'long'] as RestType[]).map(r => (
                <button key={r} className={form.rest_reset === r ? 'btn btn--primary' : 'btn btn--ghost'} onClick={() => setForm({ ...form, rest_reset: r })} style={{ fontSize: '0.6875rem', padding: '0.25rem 0.5rem' }}>
                  {r === 'short' ? 'Repos court' : 'Repos long'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {!form.is_active && (
        <div>
          <FormLabel label="Bonus sur une caractéristique" tooltip="Applique un bonus permanent sur FOR/DEX/etc." />
          <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', marginTop: '0.375rem' }}>
            <select className="input" style={{ flex: 1, fontSize: '0.75rem' }} value={form.stat_bonus_ability} onChange={e => setForm({ ...form, stat_bonus_ability: e.target.value as SkillAbility | '' })}>
              <option value="">Aucun effet sur les stats</option>
              {(['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as SkillAbility[]).map(ab => (
                <option key={ab} value={ab}>{ABILITY_LABELS[ab]}</option>
              ))}
            </select>
            {form.stat_bonus_ability && <input className="input" type="number" placeholder="+2 ou -1" value={form.stat_bonus_value} onChange={e => setForm({ ...form, stat_bonus_value: e.target.value })} style={{ width: '4.5rem', textAlign: 'center' }} />}
          </div>
        </div>
      )}

      <button className={form.is_hidden ? 'btn btn--secondary' : 'btn btn--ghost'} onClick={() => setForm({ ...form, is_hidden: !form.is_hidden })} style={{ fontSize: '0.75rem' }}>
        <GiEyeTarget size={13} /> {form.is_hidden ? 'Caché au MJ' : 'Visible par le MJ'}
      </button>

      <button className="btn btn--primary" onClick={onAdd} disabled={!form.name.trim()}>Ajouter</button>
    </div>
  );
}
