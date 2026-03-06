import React from 'react';

interface HpControlsProps {
  onDelta: (delta: number) => void;
  compact?: boolean;
}

const DAMAGE_DELTAS = [-10, -5, -1];
const HEAL_DELTAS = [1, 5, 10];

export const HpControls: React.FC<HpControlsProps> = ({ onDelta, compact = false }) => {
  const buttonStyle: React.CSSProperties = compact 
    ? { flex: 1, fontSize: '0.75rem', padding: '0.25rem' }
    : { flex: 1, fontSize: '0.875rem', padding: '0.5rem', fontWeight: 700 };

  return (
    <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
      {DAMAGE_DELTAS.map(d => (
        <button 
          key={d} 
          className="btn btn--danger" 
          style={buttonStyle}
          onClick={() => onDelta(d)}
        >
          {d}
        </button>
      ))}
      {HEAL_DELTAS.map(d => (
        <button 
          key={d} 
          className="btn btn--primary" 
          style={{ ...buttonStyle, backgroundColor: 'var(--color-success)' }}
          onClick={() => onDelta(d)}
        >
          +{d}
        </button>
      ))}
    </div>
  );
};