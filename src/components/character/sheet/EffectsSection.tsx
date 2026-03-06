import React, { useState } from 'react';
import { GiSparkles } from 'react-icons/gi';
import type { Tables } from '../../../types/database';

type Effect = Tables<'effects'>;

interface NewEffect {
  name: string;
  description: string;
  source: string;
  is_positive: boolean;
}

interface EffectsSectionProps {
  effects: Effect[];
  readOnly?: boolean;
  onAdd: (effect: NewEffect) => void;
  onRemove: (id: string) => void;
}

const EMPTY_EFFECT: NewEffect = {
  name: '',
  description: '',
  source: '',
  is_positive: true,
};

export const EffectsSection: React.FC<EffectsSectionProps> = ({
  effects,
  readOnly = false,
  onAdd,
  onRemove,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [newEffect, setNewEffect] = useState<NewEffect>(EMPTY_EFFECT);

  const handleAdd = () => {
    if (!newEffect.name.trim()) return;
    onAdd(newEffect);
    setNewEffect(EMPTY_EFFECT);
    setShowForm(false);
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GiSparkles size={16} style={{ color: 'var(--color-warning)' }} />
          <h3 style={{ fontSize: '0.9375rem' }}>Effets ({effects.length})</h3>
        </div>
        {!readOnly && (
          <button 
            className="btn btn--ghost btn--add-toggle" 
            onClick={() => setShowForm(!showForm)} 
            style={{ fontSize: '0.75rem' }}
          >
            {showForm ? 'Annuler' : '+ Effet'}
          </button>
        )}
      </div>

      {showForm && !readOnly && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.375rem', 
          marginBottom: '0.625rem', 
          padding: '0.5rem', 
          backgroundColor: 'var(--color-background-alt)', 
          borderRadius: 'var(--button-radius)' 
        }}>
          <input 
            className="input" 
            placeholder="Nom de l'effet" 
            value={newEffect.name} 
            onChange={e => setNewEffect({ ...newEffect, name: e.target.value })} 
          />
          <input 
            className="input" 
            placeholder="Description" 
            value={newEffect.description} 
            onChange={e => setNewEffect({ ...newEffect, description: e.target.value })} 
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              className="input" 
              placeholder="Source" 
              value={newEffect.source} 
              onChange={e => setNewEffect({ ...newEffect, source: e.target.value })} 
              style={{ flex: 1 }} 
            />
            <button 
              className={newEffect.is_positive ? 'btn btn--primary' : 'btn btn--danger'}
              onClick={() => setNewEffect({ ...newEffect, is_positive: !newEffect.is_positive })}
              style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}
            >
              {newEffect.is_positive ? '✨ Positif' : '💀 Négatif'}
            </button>
          </div>
          <button 
            className="btn btn--primary" 
            onClick={handleAdd} 
            disabled={!newEffect.name.trim()}
          >
            Ajouter
          </button>
        </div>
      )}

      {effects.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
          Aucun effet actif
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {effects.map(e => (
            <EffectItem 
              key={e.id} 
              effect={e} 
              readOnly={readOnly} 
              onRemove={onRemove} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Memoized effect item
const EffectItem = React.memo<{ 
  effect: Effect; 
  readOnly: boolean; 
  onRemove: (id: string) => void;
}>(({ effect, readOnly, onRemove }) => (
  <div 
    className="animate-pop-in" 
    style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '0.3rem 0.5rem', 
      backgroundColor: 'var(--color-background-alt)', 
      borderRadius: 'var(--button-radius)', 
      borderLeft: `3px solid ${effect.is_positive ? 'var(--color-success)' : 'var(--color-error)'}` 
    }}
  >
    <div>
      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{effect.name}</span>
      {effect.description && (
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>
          {effect.description}
        </span>
      )}
      {effect.source && (
        <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', display: 'block' }}>
          Source: {effect.source}
        </span>
      )}
    </div>
    {!readOnly && (
      <button 
        className="btn btn--ghost" 
        onClick={() => onRemove(effect.id)} 
        style={{ fontSize: '0.75rem', color: 'var(--color-error)', padding: '0.25rem 0.5rem' }}
      >
        ✕
      </button>
    )}
  </div>
));