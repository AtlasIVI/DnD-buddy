import type { ReactNode } from 'react';
import { GiCharacter, GiDeathSkull } from 'react-icons/gi';
import type { CombatParticipant } from './types';

interface DownParticipantRowProps {
  participant: CombatParticipant;
  typeIcon: (type: string) => ReactNode;
  onToggleActive: (id: string, isActive: boolean) => void;
  onRemove: (id: string) => void;
}

export function DownParticipantRow({ participant, typeIcon, onToggleActive, onRemove }: DownParticipantRowProps) {
  return (
    <div className="card" style={{ opacity: 0.5, padding: '0.375rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem' }}>
        {typeIcon(participant.participant_type)}
        <span style={{ textDecoration: 'line-through' }}>{participant.display_name}</span>
      </span>
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        <button className="btn btn--ghost" onClick={() => onToggleActive(participant.id, participant.is_active)} style={{ fontSize: '0.6875rem', color: 'var(--color-success)', padding: '0.25rem 0.5rem' }}>
          <GiCharacter size={14} /> Relever
        </button>
        <button className="btn btn--ghost" onClick={() => onRemove(participant.id)} style={{ fontSize: '0.6875rem', color: 'var(--color-error)', padding: '0.25rem 0.5rem' }}>
          x
        </button>
      </div>
    </div>
  );
}

export function DownParticipantsHeader({ count }: { count: number }) {
  return (
    <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
      <GiDeathSkull size={12} /> Hors combat ({count})
    </p>
  );
}
