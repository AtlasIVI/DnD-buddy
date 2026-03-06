import { GiDiceSixFacesSix } from 'react-icons/gi';
import type { Spell } from './types';
import SpellCard from './SpellCard';

interface SpellListProps {
  spells: Spell[];
  emptyMsg: string;
  readOnly?: boolean;
  onTogglePrepared: (s: Spell) => void;
  onDelete: (id: string) => void;
}

export default function SpellList({ spells, emptyMsg, readOnly, onTogglePrepared, onDelete }: SpellListProps) {
  if (spells.length === 0) {
    return <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem', textAlign: 'center', padding: '0.75rem 0' }}>{emptyMsg}</p>;
  }

  const byLevel: Record<number, Spell[]> = {};
  for (const s of spells) {
    if (!byLevel[s.level]) byLevel[s.level] = [];
    byLevel[s.level].push(s);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      {Object.entries(byLevel).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([lvl, group]) => (
        <div key={lvl}>
          {spells.some(s => s.level > 0) && (
            <p style={{ fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <GiDiceSixFacesSix size={10} />{parseInt(lvl) === 0 ? 'Cantrips' : `Niveau ${lvl}`}
            </p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {group.map(spell => (
              <SpellCard key={spell.id} spell={spell} readOnly={readOnly} onTogglePrepared={() => onTogglePrepared(spell)} onDelete={() => onDelete(spell.id)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
