import { ReactNode, useState, useEffect, useRef } from "react";
import { GiInfo } from 'react-icons/gi';

interface TooltipProps {
  text: string;
  children?: ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setVisible(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [visible]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        onClick={() => setVisible(v => !v)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '0 0.15rem',
          color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center',
          opacity: 0.7,
        }}
        aria-label="Help"
      >
        {children || <GiInfo size={13} />}
      </button>
      {visible && (
        <div style={{
          position: 'absolute', zIndex: 300,
          bottom: 'calc(100% + 0.375rem)', left: '50%', transform: 'translateX(-50%)',
          width: '14rem', padding: '0.5rem 0.625rem',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--button-radius)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          fontSize: '0.6875rem', color: 'var(--color-text-secondary)',
          lineHeight: 1.5, textAlign: 'left',
        }}>
          {text}
          <div style={{
            position: 'absolute', bottom: '-0.3rem', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid var(--color-border)',
          }} />
        </div>
      )}
    </div>
  );
};