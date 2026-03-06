import type { ReactNode } from 'react';
import { GiAura, GiSundial } from 'react-icons/gi';
import type { CombatParticipant } from './types';

interface CombatTurnPanelProps {
  activeParts: CombatParticipant[];
  currentParticipant: CombatParticipant | null;
  currentTurnIdx: number;
  safeIdx: number;
  typeIcon: (type: string) => ReactNode;
  onNextTurn: () => void;
  onUpdateHp: (id: string, delta: number) => void;
}

export function CombatTurnPanel({
  activeParts,
  currentParticipant,
  currentTurnIdx,
  safeIdx,
  typeIcon,
  onNextTurn,
  onUpdateHp,
}: CombatTurnPanelProps) {
  if (currentTurnIdx === -1 && activeParts.length > 0) {
    return (
      <button className="btn btn--primary" onClick={onNextTurn} style={{ width: '100%' }}>
        <GiSundial size={16} /> Demarrer les tours
      </button>
    );
  }

  if (!currentParticipant) return null;

  return (
    <div className="card card--accent animate-pulse-turn" style={{ textAlign: 'center', padding: '0.75rem' }}>
      <p
        style={{
          fontSize: '0.625rem',
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '0.25rem',
        }}
      >
        <GiSundial size={12} style={{ marginRight: '0.25rem' }} />
        Tour {safeIdx + 1}/{activeParts.length}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        {typeIcon(currentParticipant.participant_type)}
        <h3 style={{ fontSize: '1.25rem', color: 'var(--color-your-turn)', margin: 0 }}>
          {currentParticipant.display_name}
        </h3>
      </div>

      <div
        style={{
          backgroundColor: 'var(--color-background-alt)',
          borderRadius: '0.5rem',
          padding: '0.75rem',
          marginTop: '0.75rem',
          marginBottom: '0.75rem',
        }}
      >
        <span
          style={{
            fontSize: '0.6875rem',
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: '0.5rem',
          }}
        >
          Actions rapides MJ
        </span>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
          <button className="btn btn--danger" onClick={() => onUpdateHp(currentParticipant.id, -5)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>-5 PV</button>
          <button className="btn btn--danger" onClick={() => onUpdateHp(currentParticipant.id, -1)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>-1 PV</button>
          <div style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem', fontWeight: 'bold', minWidth: '3rem', fontFamily: 'var(--font-mono)' }}>
            {currentParticipant.hp_current}
          </div>
          <button className="btn btn--primary" onClick={() => onUpdateHp(currentParticipant.id, 1)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: 'var(--color-success)' }}>+1 PV</button>
          <button className="btn btn--primary" onClick={() => onUpdateHp(currentParticipant.id, 5)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', backgroundColor: 'var(--color-success)' }}>+5 PV</button>
        </div>
        <button
          className="btn btn--ghost"
          onClick={() => alert('Effets temporaires - prochaine feature !')}
          style={{ fontSize: '0.75rem', width: '100%', marginTop: '0.5rem' }}
        >
          <GiAura size={14} style={{ marginRight: '0.375rem' }} /> Appliquer un Effet Temporaire
        </button>
      </div>

      <button className="btn btn--primary" onClick={onNextTurn} style={{ width: '100%' }}>
        Fin du tour {'>'}
      </button>
    </div>
  );
}
