import { GiEyeTarget, GiSundial } from 'react-icons/gi';
import type { CharStats, Skill } from './types';
import { ABILITY_LABELS, ABILITY_ICONS, ACTION_COLORS, ACTION_LABELS, computeModifier } from './types';

interface ActiveSkillRowProps {
  skill: Skill;
  canEdit: boolean;
  charStats?: CharStats;
  expanded: boolean;
  onExpand: () => void;
  onHide: (s: Skill) => void;
  onDelete: (id: string) => void;
  onUse: (s: Skill) => void;
  onReset: (s: Skill) => void;
}

export default function ActiveSkillRow({ skill, canEdit, charStats, expanded, onExpand, onHide, onDelete, onUse, onReset }: ActiveSkillRowProps) {
  const modStr = computeModifier(skill, charStats);
  const hasUses = skill.uses_max !== null;
  const usesLeft = skill.uses_remaining ?? 0;
  const usesTotal = skill.uses_max ?? 0;
  const depleted = hasUses && usesLeft <= 0;
  const ac = skill.action_cost;

  return (
    <div className="card" style={{ padding: '0.5rem 0.75rem', opacity: depleted ? 0.55 : 1, borderLeft: ac ? `3px solid ${ACTION_COLORS[ac]}` : undefined }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onExpand} style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{skill.name}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-accent)', backgroundColor: 'rgba(var(--color-accent-rgb), 0.12)', padding: '0.05rem 0.35rem', borderRadius: '999px' }}>{modStr}</span>
            {ac && <span style={{ fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: ACTION_COLORS[ac], backgroundColor: 'rgba(0,0,0,0.2)', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>{ACTION_LABELS[ac]}</span>}
            {skill.ability && (() => { const Icon = ABILITY_ICONS[skill.ability]; return <Icon size={11} style={{ color: 'var(--color-text-muted)' }} />; })()}
            {skill.is_hidden && <span className="badge badge--hidden" style={{ fontSize: '0.5rem' }}>caché</span>}
          </div>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginLeft: '0.5rem' }}>
          {hasUses && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              {Array.from({ length: Math.min(usesTotal, 8) }).map((_, i) => <div key={i} style={{ width: '0.5rem', height: '0.5rem', borderRadius: '50%', backgroundColor: i < usesLeft ? 'var(--color-accent)' : 'var(--color-border)', transition: 'background-color 0.2s' }} />)}
              {usesTotal > 8 && <span style={{ fontSize: '0.5625rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>{usesLeft}/{usesTotal}</span>}
            </div>
          )}

          {canEdit && <button className={depleted ? 'btn btn--ghost' : 'btn btn--primary'} onClick={() => onUse(skill)} disabled={depleted} style={{ fontSize: '0.6875rem', padding: '0.25rem 0.5rem', minHeight: 'unset' }}>{depleted ? 'Épuisé' : 'Utiliser'}</button>}
          {canEdit && hasUses && <button className="btn btn--ghost" onClick={() => onReset(skill)} title={`Recharger (${skill.rest_reset === 'short' ? 'repos court' : 'repos long'})`} style={{ padding: '0.25rem 0.375rem', minHeight: 'unset' }}><GiSundial size={13} /></button>}
          {canEdit && <button className="btn btn--ghost" onClick={() => onHide(skill)} title={skill.is_hidden ? 'Rendre visible' : 'Cacher au MJ'} style={{ padding: '0.125rem 0.25rem', minHeight: 'unset' }}><GiEyeTarget size={13} /></button>}
          {canEdit && <button className="btn btn--ghost" onClick={() => onDelete(skill.id)} style={{ padding: '0.125rem 0.25rem', minHeight: 'unset', color: 'var(--color-error)' }}>✕</button>}
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {skill.description && <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{skill.description}</p>}
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.6875rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
            {skill.ability && <span>Stat : <strong style={{ color: 'var(--color-text-secondary)' }}>{ABILITY_LABELS[skill.ability]}</strong></span>}
            {skill.proficiency !== 'none' && <span>Maîtrise : <strong style={{ color: 'var(--color-text-secondary)' }}>{skill.proficiency === 'proficient' ? 'Oui' : 'Expertise'}</strong></span>}
            {hasUses && <span>Charges : <strong style={{ color: 'var(--color-text-secondary)' }}>{usesLeft}/{usesTotal}</strong>{skill.rest_reset && ` — reset au ${skill.rest_reset === 'short' ? 'repos court' : 'repos long'}`}</span>}
            {!skill.ability && skill.modifier && <span>Modificateur manuel : <strong style={{ color: 'var(--color-text-secondary)' }}>{skill.modifier}</strong></span>}
          </div>
        </div>
      )}
    </div>
  );
}
