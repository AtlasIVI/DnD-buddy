import { GiCrossedSwords, GiDeathSkull, GiTrashCan, GiTrophy } from 'react-icons/gi';
import type { ConfirmAction } from './types';

interface ConfirmActionDialogProps {
  action: ConfirmAction;
  busy: boolean;
  onClose: () => void;
  onKick: (userId: string) => void;
  onDeleteCampaign: () => void;
  onEndCampaign: (outcome: string) => void;
}

export function ConfirmActionDialog({
  action,
  busy,
  onClose,
  onKick,
  onDeleteCampaign,
  onEndCampaign,
}: ConfirmActionDialogProps) {
  return (
    <div className="confirm-overlay" onClick={onClose}>
      <div className="confirm-dialog animate-fade-in" onClick={(e) => e.stopPropagation()}>
        {action.type === 'kick' && (
          <>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.75rem', color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <GiCrossedSwords /> Exclure un joueur
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
              Exclure <strong>{action.userName}</strong> ? Son personnage sera supprime.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn--secondary" onClick={onClose} style={{ flex: 1 }}>Annuler</button>
              <button className="btn btn--danger" onClick={() => onKick(action.userId || '')} disabled={busy} style={{ flex: 1 }}>
                {busy ? '...' : 'Exclure'}
              </button>
            </div>
          </>
        )}

        {action.type === 'delete' && (
          <>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.75rem', color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <GiTrashCan /> Supprimer
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
              Toutes les donnees seront perdues definitivement.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn--secondary" onClick={onClose} style={{ flex: 1 }}>Annuler</button>
              <button className="btn btn--danger" onClick={onDeleteCampaign} disabled={busy} style={{ flex: 1 }}>
                {busy ? '...' : 'Supprimer'}
              </button>
            </div>
          </>
        )}

        {action.type === 'end' && (
          <>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.75rem', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <GiTrophy /> Fin de campagne
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
              Comment se termine cette aventure ?
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn--secondary" onClick={onClose} style={{ flex: 1 }}>Annuler</button>
              <button className="btn" onClick={() => onEndCampaign('victory')} disabled={busy} style={{ flex: 1, backgroundColor: 'var(--color-success)', color: '#fff' }}>
                <GiTrophy size={14} /> {busy ? '...' : 'Victoire'}
              </button>
              <button className="btn btn--danger" onClick={() => onEndCampaign('defeat')} disabled={busy} style={{ flex: 1 }}>
                <GiDeathSkull size={14} /> {busy ? '...' : 'Defaite'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
