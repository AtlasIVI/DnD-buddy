import { useState } from 'react';
import { GiCrystalBall, GiConcentrationOrb, GiSundial, GiArrowScope, GiSpiralArrow } from 'react-icons/gi';
import type { Spell } from './types';

interface SpellCardProps {
  spell: Spell;
  readOnly?: boolean;
  onTogglePrepared: () => void;
  onDelete: () => void;
}

export default function SpellCard({ spell, readOnly, onTogglePrepared, onDelete }: SpellCardProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ backgroundColor: 'var(--color-background-alt)', borderRadius: 'var(--button-radius)', border: `1px solid ${spell.is_prepared ? 'var(--color-accent)' : 'var(--color-border)'}`, overflow: 'hidden', transition: 'border-color 0.2s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.625rem', cursor: 'pointer' }} onClick={() => setExpanded(x => !x)}>
        {!readOnly && spell.level > 0 && (
          <button className="btn btn--ghost" onClick={e => { e.stopPropagation(); onTogglePrepared(); }} title={spell.is_prepared ? 'Déprépararer' : 'Préparer'} style={{ padding: '0.125rem', minHeight: 'unset', width: '1.5rem', height: '1.5rem', color: spell.is_prepared ? 'var(--color-accent)' : 'var(--color-text-muted)' }}>
            <GiCrystalBall size={14} />
          </button>
        )}
        <span style={{ fontWeight: 600, fontSize: '0.9rem', flex: 1, color: spell.is_prepared || spell.level === 0 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>{spell.name || <em style={{ color: 'var(--color-text-muted)' }}>Sans nom</em>}</span>
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexShrink: 0 }}>
          {spell.concentration && <span title="Concentration" style={{ color: 'var(--color-warning)', fontSize: '0.75rem' }}><GiConcentrationOrb size={14} /></span>}
          {spell.damage_dice && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--color-error)', fontWeight: 700, backgroundColor: 'rgba(231,76,60,0.1)', padding: '0.1rem 0.35rem', borderRadius: '999px' }}>{spell.damage_dice}</span>}
          <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '0 0.625rem 0.625rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.375rem' }} className="animate-fade-in">
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            {spell.casting_time && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><GiSundial size={12} /> {spell.casting_time}</span>}
            {spell.range && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><GiArrowScope size={12} /> {spell.range}</span>}
            {spell.duration && <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><GiSpiralArrow size={12} /> {spell.duration}</span>}
          </div>
          {spell.description && <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{spell.description}</p>}
          {!readOnly && <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button className="btn btn--ghost" onClick={onDelete} style={{ fontSize: '0.6875rem', color: 'var(--color-error)', padding: '0.25rem 0.5rem', minHeight: 'unset' }}>Supprimer</button></div>}
        </div>
      )}
    </div>
  );
}
