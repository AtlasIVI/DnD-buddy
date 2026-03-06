import { useState } from 'react';
import { GiBroadsword, GiConcentrationOrb, GiSundial, GiArrowScope, GiSpiralArrow } from 'react-icons/gi';
import type { Spell, SpellSlot } from './types';
import { ORDINAL } from './types';

interface SpellCombatCardProps {
  spell: Spell;
  slots: SpellSlot[];
  onCast: (spellLevel: number) => void;
}

export default function SpellCombatCard({ spell, slots, onCast }: SpellCombatCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isCantrip = spell.level === 0;
  const availableSlots = isCantrip ? [] : slots.filter(s => s.slot_level >= spell.level && (s.slots_total - s.slots_used) > 0);
  const canCast = isCantrip || availableSlots.length > 0;

  const actionColor = spell.casting_time === '1 action' ? 'var(--color-accent)'
    : spell.casting_time === '1 action bonus' ? 'var(--color-info)'
    : spell.casting_time === '1 réaction' ? 'var(--color-warning)'
    : 'var(--color-success)';

  return (
    <div style={{ backgroundColor: 'var(--color-background-alt)', borderRadius: 'var(--button-radius)', border: `1px solid ${canCast ? 'var(--color-accent)' : 'var(--color-border)'}`, opacity: canCast ? 1 : 0.5, overflow: 'hidden', transition: 'all 0.2s', borderLeft: `3px solid ${actionColor}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.4rem 0.5rem' }}>
        <button onClick={() => setExpanded(x => !x)} style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{spell.name}</span>
            {spell.concentration && <GiConcentrationOrb size={11} style={{ color: 'var(--color-warning)' }} />}
            {spell.damage_dice && <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.625rem', color: 'var(--color-error)', fontWeight: 700, backgroundColor: 'rgba(231,76,60,0.1)', padding: '0.05rem 0.3rem', borderRadius: '999px' }}>{spell.damage_dice}</span>}
            {!isCantrip && <span style={{ fontSize: '0.5rem', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>niv.{spell.level}</span>}
          </div>
        </button>

        {isCantrip ? (
          <button className="btn btn--primary" onClick={() => onCast(0)} style={{ fontSize: '0.625rem', padding: '0.2rem 0.5rem', minHeight: 'unset', whiteSpace: 'nowrap' }}><GiBroadsword size={11} /> Lancer</button>
        ) : availableSlots.length === 1 ? (
          <button className="btn btn--primary" onClick={() => onCast(availableSlots[0].slot_level)} disabled={!canCast} style={{ fontSize: '0.625rem', padding: '0.2rem 0.5rem', minHeight: 'unset', whiteSpace: 'nowrap' }}><GiBroadsword size={11} /> {ORDINAL[availableSlots[0].slot_level]}</button>
        ) : availableSlots.length > 1 ? (
          <select className="input" style={{ fontSize: '0.625rem', padding: '0.15rem 0.25rem', width: 'auto', cursor: 'pointer' }} onChange={e => { if (e.target.value) onCast(parseInt(e.target.value)); e.target.value = ''; }} defaultValue="">
            <option value="" disabled>Lancer...</option>
            {availableSlots.map(s => <option key={s.slot_level} value={s.slot_level}>{ORDINAL[s.slot_level]} ({s.slots_total - s.slots_used} dispo)</option>)}
          </select>
        ) : (
          <span style={{ fontSize: '0.625rem', color: 'var(--color-error)', fontWeight: 600 }}>Épuisé</span>
        )}
      </div>

      {expanded && (
        <div style={{ padding: '0 0.5rem 0.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }} className="animate-fade-in">
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.25rem', fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>
            {spell.casting_time && <span><GiSundial size={11} /> {spell.casting_time}</span>}
            {spell.range && <span><GiArrowScope size={11} /> {spell.range}</span>}
            {spell.duration && <span><GiSpiralArrow size={11} /> {spell.duration}</span>}
          </div>
          {spell.description && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>{spell.description}</p>}
        </div>
      )}
    </div>
  );
}
