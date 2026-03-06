import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

const PADDING_MAP = {
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
};

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  padding = 'md',
  style 
}) => {
  return (
    <div 
      className={`card ${className}`}
      style={{ padding: PADDING_MAP[padding], ...style }}
    >
      {children}
    </div>
  );
};