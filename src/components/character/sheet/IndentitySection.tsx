import React from 'react';
import { GiScrollUnfurled, GiSparkles } from 'react-icons/gi';
import type { Tables } from '../../../types/database';

type Character = Tables<'characters'>;

interface IdentitySectionProps {
  character: Character;
  readOnly?: boolean;
  onUpdate: (field: string, value: any) => void;
  saving?: boolean;
  compact?: boolean;
}

export const IdentitySection: React.FC<IdentitySectionProps> = ({
  character,
  readOnly = false,
  onUpdate,
  saving = false,
  compact = false,
}) => {
  // Compact mode for combat view
  if (compact) {
    return (
      <div className="card" style={{ padding: '0.5rem 0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{character.name}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {character.class} niv.{character.level}
          </span>
          {saving && <span style={{ fontSize: '0.5625rem', color: 'var(--color-text-muted)' }}>💾</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <GiScrollUnfurled size={18} style={{ color: 'var(--color-accent)' }} />
        <h2 style={{ fontSize: '1.125rem' }}>Identité</h2>
        {saving && (
          <span style={{ 
            fontSize: '0.625rem', 
            color: 'var(--color-text-muted)', 
            marginLeft: 'auto' 
          }}>
            sauvegarde...
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <input 
          className="input" 
          value={character.name} 
          onChange={e => onUpdate('name', e.target.value)} 
          placeholder="Nom" 
          readOnly={readOnly} 
        />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            className="input" 
            value={character.race} 
            onChange={e => onUpdate('race', e.target.value)} 
            placeholder="Race" 
            style={{ flex: 1 }} 
            readOnly={readOnly} 
          />
          <input 
            className="input" 
            value={character.class} 
            onChange={e => onUpdate('class', e.target.value)} 
            placeholder="Classe" 
            style={{ flex: 1 }} 
            readOnly={readOnly} 
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <GiSparkles size={14} style={{ color: 'var(--color-xp)' }} />
            <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Niv.</label>
            <input 
              className="input" 
              type="number" 
              inputMode="numeric" 
              min={1} 
              max={20}
              value={character.level} 
              onChange={e => onUpdate('level', parseInt(e.target.value) || 1)}
              style={{ width: '4rem', textAlign: 'center' }} 
              readOnly={readOnly} 
            />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <GiSparkles size={14} style={{ color: 'var(--color-xp)' }} />
            <label style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>XP</label>
            <input 
              className="input" 
              type="number" 
              inputMode="numeric" 
              min={0}
              value={character.xp} 
              onChange={e => onUpdate('xp', parseInt(e.target.value) || 0)}
              style={{ flex: 1, textAlign: 'center' }} 
              readOnly={readOnly} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};