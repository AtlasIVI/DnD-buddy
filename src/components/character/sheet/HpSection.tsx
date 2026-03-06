import React from 'react';
import { GiHearts, GiShield, GiLeatherBoot } from 'react-icons/gi';
import { HpBar } from '../../ui/HpBar';
import { HpControls } from '../../ui/HpControls';
import type { Tables } from '../../../types/database';

type Character = Tables<'characters'>;

interface HpSectionProps {
  character: Character;
  readOnly?: boolean;
  onUpdate: (field: string, value: any) => void;
}

export const HpSection: React.FC<HpSectionProps> = ({ 
  character, 
  readOnly = false, 
  onUpdate 
}) => {
  const hpPct = character.hp_max > 0 
    ? Math.round((character.hp_current / character.hp_max) * 100) 
    : 0;
  
  const hpColor = hpPct > 60 
    ? 'var(--color-hp)' 
    : hpPct > 30 
    ? 'var(--color-warning)' 
    : 'var(--color-error)';

  const handleHpDelta = (delta: number) => {
    if (delta < 0) {
      onUpdate('hp_current', Math.max(0, character.hp_current + delta));
    } else {
      onUpdate('hp_current', Math.min(character.hp_max, character.hp_current + delta));
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <GiHearts size={18} style={{ color: hpColor }} />
        <h3 style={{ fontSize: '1rem' }}>PV</h3>
        <span style={{ 
          marginLeft: 'auto', 
          fontSize: '0.75rem', 
          fontFamily: 'var(--font-mono)', 
          color: hpColor, 
          fontWeight: 700 
        }}>
          {hpPct}%
        </span>
      </div>
      
      {!readOnly && (
        <div style={{ marginBottom: '0.5rem' }}>
          <HpControls onDelta={handleHpDelta} />
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
        <input 
          className="input" 
          type="number" 
          inputMode="numeric" 
          min={0}
          value={character.hp_current} 
          onChange={e => onUpdate('hp_current', Math.max(0, parseInt(e.target.value) || 0))}
          style={{ 
            width: '4rem', 
            textAlign: 'center', 
            fontFamily: 'var(--font-mono)', 
            fontSize: '1.25rem', 
            color: hpColor 
          }} 
          readOnly={readOnly} 
        />
        <span style={{ color: 'var(--color-text-muted)' }}>/</span>
        <input 
          className="input" 
          type="number" 
          inputMode="numeric" 
          min={0}
          value={character.hp_max} 
          onChange={e => onUpdate('hp_max', Math.max(0, parseInt(e.target.value) || 0))}
          style={{ width: '4rem', textAlign: 'center', fontFamily: 'var(--font-mono)' }} 
          readOnly={readOnly} 
        />
        {!readOnly && (
          <button 
            className="btn btn--ghost" 
            style={{ fontSize: '0.6875rem', marginLeft: 'auto' }}
            onClick={() => onUpdate('hp_current', character.hp_max)}
          >
            ↺ Full
          </button>
        )}
      </div>
      
      <HpBar current={character.hp_current} max={character.hp_max} size="lg" />
      
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.625rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <GiShield size={14} style={{ color: 'var(--color-armor-class)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>CA</span>
          <input 
            className="input" 
            type="number" 
            inputMode="numeric" 
            min={0}
            value={character.armor_class} 
            onChange={e => onUpdate('armor_class', parseInt(e.target.value) || 0)}
            style={{ 
              width: '3.5rem', 
              textAlign: 'center', 
              fontFamily: 'var(--font-mono)', 
              fontSize: '0.9rem' 
            }} 
            readOnly={readOnly} 
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <GiLeatherBoot size={14} style={{ color: 'var(--color-info)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Vit.</span>
          <input 
            className="input" 
            type="number" 
            inputMode="numeric" 
            min={0}
            value={character.speed} 
            onChange={e => onUpdate('speed', parseInt(e.target.value) || 0)}
            style={{ 
              width: '3.5rem', 
              textAlign: 'center', 
              fontFamily: 'var(--font-mono)', 
              fontSize: '0.9rem' 
            }} 
            readOnly={readOnly} 
          />
        </div>
      </div>
    </div>
  );
};