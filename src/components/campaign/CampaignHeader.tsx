import React from 'react';
import { GiCrossedSwords, GiCompass } from 'react-icons/gi';
import ViewToggle, { type ViewMode } from '../ui/ViewToggle';
import type { Tables } from '../../types/database';

type Campaign = Tables<'campaigns'>;

interface CampaignHeaderProps {
  campaign: Campaign | null;
  inCombat: boolean;
  isGm: boolean;
  viewMode: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  onBack: () => void;
}

export const CampaignHeader: React.FC<CampaignHeaderProps> = ({
  campaign,
  inCombat,
  isGm,
  viewMode,
  onViewModeChange,
  onBack,
}) => {
  return (
    <header style={{
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      zIndex: 200, 
      height: '3rem',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      padding: '0 1rem',
      backgroundColor: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      backdropFilter: 'blur(10px)', 
      WebkitBackdropFilter: 'blur(10px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <button 
          className="btn btn--ghost" 
          onClick={onBack}
          style={{ padding: '0.25rem 0.5rem', minHeight: 'unset', fontSize: '0.8125rem' }}
        >
          <svg 
            width="14" 
            height="14" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }}
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Accueil
        </button>
        <span style={{ color: 'var(--color-border)' }}>│</span>
        <span style={{ 
          fontSize: '0.9375rem', 
          fontWeight: 600, 
          color: 'var(--color-text-primary)', 
          maxWidth: '10rem', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap' 
        }}>
          {campaign?.name ?? '…'}
        </span>
        <CampaignModeBadge inCombat={inCombat} />
      </div>
      {isGm && onViewModeChange && (
        <ViewToggle current={viewMode} onChange={onViewModeChange} />
      )}
    </header>
  );
};

// Memoized badge component
const CampaignModeBadge = React.memo<{ inCombat: boolean }>(({ inCombat }) => (
  <span style={{
    fontSize: '0.5625rem', 
    fontWeight: 700, 
    textTransform: 'uppercase',
    padding: '0.1rem 0.45rem', 
    borderRadius: '999px',
    backgroundColor: inCombat ? 'rgba(231,76,60,0.15)' : 'rgba(39,174,96,0.12)',
    color: inCombat ? 'var(--color-error)' : 'var(--color-success)',
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.2rem',
  }}>
    {inCombat ? <GiCrossedSwords size={10} /> : <GiCompass size={10} />}
    {inCombat ? 'Combat' : 'Exploration'}
  </span>
));

export default CampaignHeader;