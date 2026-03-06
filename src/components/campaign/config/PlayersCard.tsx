import { GiCharacter, GiCrossedSwords } from 'react-icons/gi';
import type { CampaignMember } from './types';

interface PlayersCardProps {
  players: CampaignMember[];
  onKick: (player: CampaignMember) => void;
}

export function PlayersCard({ players, onKick }: PlayersCardProps) {
  return (
    <div className="card">
      <h3 style={{ fontSize: '0.9375rem', marginBottom: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
        <GiCrossedSwords size={16} /> Joueurs ({players.length})
      </h3>
      {players.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>Aucun joueur</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {players.map((member) => (
            <div
              key={member.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.375rem 0.5rem',
                backgroundColor: 'var(--color-background-alt)',
                borderRadius: 'var(--button-radius)',
              }}
            >
              <span style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <GiCharacter size={14} /> {member.profile?.display_name || 'Joueur'}
              </span>
              <button
                className="btn btn--ghost"
                onClick={() => onKick(member)}
                style={{ fontSize: '0.6875rem', color: 'var(--color-error)', padding: '0.125rem 0.375rem' }}
              >
                <GiCrossedSwords size={12} /> Exclure
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
