import React from 'react';

interface StatBlockProps {
  label: string;
  value: number;
  modifier: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  bonus?: number;
  bonusSource?: string;
  readOnly?: boolean;
  onChange?: (value: number) => void;
}

export const StatBlock: React.FC<StatBlockProps> = ({
  label,
  value,
  modifier,
  icon: Icon,
  bonus = 0,
  bonusSource,
  readOnly = false,
  onChange,
}) => {
  const hasBonus = bonus !== 0;
  const effectiveVal = value + bonus;
  const bonusColor = bonus > 0 ? 'var(--color-success)' : 'var(--color-error)';

  return (
    <div
      title={hasBonus ? `Passive bonus: ${bonusSource}` : undefined}
      className="stat-block"
      style={{
        backgroundColor: hasBonus 
          ? (bonus > 0 ? 'rgba(39,174,96,0.1)' : 'rgba(231,76,60,0.1)') 
          : 'var(--color-background-alt)',
        border: hasBonus ? `1px solid ${bonusColor}` : '1px solid transparent',
        borderRadius: 'var(--button-radius)', 
        padding: '0.4rem 0.25rem',
        gap: '0.1rem', 
        position: 'relative', 
        transition: 'background-color 0.3s',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Icon size={12} style={{ color: hasBonus ? bonusColor : 'var(--color-text-muted)' }} />
      <span style={{ color: hasBonus ? bonusColor : undefined, fontSize: '0.5625rem' }}>{label}</span>

      {!readOnly && onChange ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.05rem' }}>
          <button 
            className="btn btn--ghost"
            onClick={() => onChange(Math.max(1, value - 1))}
            style={{ padding: '0.1rem 0.2rem', minHeight: 'unset', fontSize: '0.7rem', lineHeight: 1 }}
          >
            −
          </button>
          <span style={{ 
            fontFamily: 'var(--font-mono)', 
            fontSize: '1rem', 
            fontWeight: 700, 
            minWidth: '1.5rem', 
            textAlign: 'center', 
            color: hasBonus ? bonusColor : 'var(--color-text-primary)' 
          }}>
            {effectiveVal}
          </span>
          <button 
            className="btn btn--ghost"
            onClick={() => onChange(Math.min(30, value + 1))}
            style={{ padding: '0.1rem 0.2rem', minHeight: 'unset', fontSize: '0.7rem', lineHeight: 1 }}
          >
            +
          </button>
        </div>
      ) : (
        <span style={{ 
          fontFamily: 'var(--font-mono)', 
          fontSize: '1rem', 
          fontWeight: 700, 
          color: hasBonus ? bonusColor : 'var(--color-text-primary)' 
        }}>
          {effectiveVal}
        </span>
      )}

      <span style={{ 
        fontSize: '0.625rem', 
        fontFamily: 'var(--font-mono)', 
        fontWeight: 700, 
        color: hasBonus ? bonusColor : 'var(--color-accent)' 
      }}>
        {modifier}
      </span>
      
      {hasBonus && (
        <span style={{ 
          position: 'absolute', 
          top: '0.15rem', 
          right: '0.2rem', 
          fontSize: '0.45rem', 
          fontFamily: 'var(--font-mono)', 
          color: 'var(--color-text-muted)', 
          lineHeight: 1 
        }}>
          base {value}
        </span>
      )}
    </div>
  );
};