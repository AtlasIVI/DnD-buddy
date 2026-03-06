import { GiBroadsword, GiCrossedSwords } from 'react-icons/gi';

interface CombatEmptyStateProps {
  combatName: string;
  onNameChange: (value: string) => void;
  onCreateCombat: () => void;
}

export function CombatEmptyState({ combatName, onNameChange, onCreateCombat }: CombatEmptyStateProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <GiCrossedSwords size={20} style={{ color: 'var(--color-accent)' }} />
        <h2 style={{ fontSize: '1.25rem' }}>Combat</h2>
      </div>
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <GiBroadsword size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem' }} />
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Aucun combat actif</p>
        <input
          className="input"
          value={combatName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Nom du combat"
          style={{ marginBottom: '0.5rem', textAlign: 'center' }}
        />
        <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
          Tous les joueurs de la campagne seront automatiquement ajoutes.
        </p>
        <button className="btn btn--primary" onClick={onCreateCombat} style={{ width: '100%' }}>
          <GiBroadsword size={16} /> Lancer le combat
        </button>
      </div>
    </div>
  );
}
