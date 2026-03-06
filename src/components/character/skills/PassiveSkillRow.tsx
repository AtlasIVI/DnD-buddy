import { GiEyeTarget } from 'react-icons/gi';
import type { CharStats, Skill } from './types';
import { ABILITY_LABELS, ABILITY_ICONS, computeModifier } from './types';

interface PassiveSkillRowProps {
  skill: Skill;
  canEdit: boolean;
  charStats?: CharStats;
  expanded: boolean;
  onExpand: () => void;
  onHide: (s: Skill) => void;
  onDelete: (id: string) => void;
}

export default function PassiveSkillRow({ skill, canEdit, charStats, expanded, onExpand, onHide, onDelete }: PassiveSkillRowProps) {
  const modStr = computeModifier(skill, charStats);
  const hasBonus = skill.stat_bonus_ability !== null && skill.stat_bonus_value !== null;
  const bonusVal = skill.stat_bonus_value ?? 0;
  const bonusColor = bonusVal >= 0 ? 'var(--color-success)' : 'var(--color-error)';

  return (
    <div className="card" style={{ padding: '0.5rem 0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onExpand} style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{skill.name}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-accent)', backgroundColor: 'rgba(var(--color-accent-rgb), 0.12)', padding: '0.05rem 0.35rem', borderRadius: '999px' }}>{modStr}</span>
            {hasBonus && skill.stat_bonus_ability && <span style={{ fontSize: '0.625rem', color: bonusColor, fontFamily: 'var(--font-mono)', fontWeight: 700, backgroundColor: bonusVal >= 0 ? 'rgba(39,174,96,0.12)' : 'rgba(231,76,60,0.12)', padding: '0.05rem 0.3rem', borderRadius: '999px' }}>{ABILITY_LABELS[skill.stat_bonus_ability]} {bonusVal >= 0 ? `+${bonusVal}` : bonusVal}</span>}
            {skill.ability && (() => { const Icon = ABILITY_ICONS[skill.ability]; return <Icon size={11} style={{ color: 'var(--color-text-muted)' }} />; })()}
            {skill.is_hidden && <span className="badge badge--hidden" style={{ fontSize: '0.5rem' }}>caché</span>}
          </div>
        </button>

        <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
          {canEdit && <button className="btn btn--ghost" onClick={() => onHide(skill)} title={skill.is_hidden ? 'Rendre visible' : 'Cacher au MJ'} style={{ padding: '0.125rem 0.25rem', minHeight: 'unset' }}><GiEyeTarget size={13} /></button>}
          {canEdit && <button className="btn btn--ghost" onClick={() => onDelete(skill.id)} style={{ padding: '0.125rem 0.25rem', minHeight: 'unset', color: 'var(--color-error)' }}>✕</button>}
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {skill.description && <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{skill.description}</p>}
          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.6875rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
            {skill.ability && <span>Modificateur basé sur : <strong style={{ color: 'var(--color-text-secondary)' }}>{ABILITY_LABELS[skill.ability]}</strong></span>}
            {skill.proficiency !== 'none' && <span>Maîtrise : <strong style={{ color: 'var(--color-text-secondary)' }}>{skill.proficiency === 'proficient' ? 'Oui' : 'Expertise'}</strong></span>}
            {!skill.ability && skill.modifier && <span>Modificateur manuel : <strong style={{ color: 'var(--color-text-secondary)' }}>{skill.modifier}</strong></span>}
            {hasBonus && skill.stat_bonus_ability && <span>Modifie la stat <strong style={{ color: bonusColor }}>{ABILITY_LABELS[skill.stat_bonus_ability]}</strong> de <strong style={{ color: bonusColor }}>{bonusVal >= 0 ? `+${bonusVal}` : bonusVal}</strong> — visible sur la feuille de perso</span>}
          </div>
        </div>
      )}
    </div>
  );
}
