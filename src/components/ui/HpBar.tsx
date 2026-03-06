import React from 'react';

interface HpBarProps {
  current: number;
  max: number;
  size?: 'sm' | 'lg';
  showLabel?: boolean;
}

export const HpBar: React.FC<HpBarProps> = ({ 
  current, 
  max, 
  size = 'sm', 
  showLabel = false 
}) => {
  const percentage = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  
  const getColor = () => {
    if (percentage > 60) return 'var(--color-hp)';
    if (percentage > 30) return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  return (
    <div className={`hp-bar ${size === 'lg' ? 'hp-bar--large' : ''}`}>
      <div 
        className="hp-bar__fill" 
        style={{ 
          width: `${percentage}%`, 
          backgroundColor: getColor(),
          transition: 'width 0.4s ease, background-color 0.4s ease' 
        }} 
      />
      {showLabel && (
        <span className="hp-bar__label" style={{ 
          position: 'absolute', 
          left: '50%', 
          transform: 'translateX(-50%)',
          fontSize: '0.625rem',
          fontFamily: 'var(--font-mono)',
          color: 'var(--color-text-primary)',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)'
        }}>
          {current}/{max}
        </span>
      )}
    </div>
  );
};