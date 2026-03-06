import type { ReactNode } from 'react';
import { GiDeathSkull, GiHearts, GiShield, GiSundial } from 'react-icons/gi';
import type { CombatParticipant } from './types';

interface ActiveParticipantCardProps {
  participant: CombatParticipant;
  idx: number;
  safeIdx: number;
  currentTurnIdx: number;
  hpFlash: 'damage' | 'heal' | undefined;
  typeIcon: (type: string) => ReactNode;
  onUpdateHp: (id: string, delta: number) => void;
  onUpdateInitiative: (id: string, value: number) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onRemove: (id: string) => void;
}

export function ActiveParticipantCard({
  participant,
  idx,
  safeIdx,
  currentTurnIdx,
  hpFlash,
  typeIcon,
  onUpdateHp,
  onUpdateInitiative,
  onToggleActive,
  onRemove,
}: ActiveParticipantCardProps) {
  const hpPercent = participant.hp_max > 0 ? Math.round((participant.hp_current / participant.hp_max) * 100) : 0;
  const isCurrent = idx === safeIdx && currentTurnIdx >= 0;
  const hpColor = hpPercent > 60 ? 'var(--color-hp)' : hpPercent > 30 ? 'var(--color-warning)' : 'var(--color-error)';

  return (
    <div
      className={`card ${hpFlash === 'damage' ? 'animate-damage' : hpFlash === 'heal' ? 'animate-heal' : ''}`}
      style={{
        borderColor: isCurrent ? 'var(--color-your-turn)' : undefined,
        boxShadow: isCurrent ? 'var(--glow-accent)' : undefined,
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          {typeIcon(participant.participant_type)}
          <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{participant.display_name}</span>
          {isCurrent && (
            <span style={{ fontSize: '0.5rem', color: 'var(--color-your-turn)', textTransform: 'uppercase', fontWeight: 700, backgroundColor: 'rgba(255,200,0,0.15)', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>
              En jeu
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <GiSundial size={12} style={{ color: 'var(--color-warning)' }} />
          <input
            className="input"
            type="number"
            inputMode="numeric"
            value={participant.initiative}
            onChange={(e) => onUpdateInitiative(participant.id, parseInt(e.target.value, 10) || 0)}
            style={{ width: '3rem', textAlign: 'center', padding: '0.125rem', fontSize: '0.75rem' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
        <button className="btn btn--danger" onClick={() => onUpdateHp(participant.id, -5)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minWidth: '2.5rem' }}>-5</button>
        <button className="btn btn--danger" onClick={() => onUpdateHp(participant.id, -1)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minWidth: '2.5rem' }}>-1</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flex: 1, justifyContent: 'center' }}>
          <GiHearts size={14} style={{ color: hpColor }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9375rem', color: hpColor, fontWeight: 700 }}>
            {participant.hp_current}
          </span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>/ {participant.hp_max}</span>
          <GiShield size={12} style={{ color: 'var(--color-armor-class)', marginLeft: '0.5rem' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{participant.armor_class}</span>
        </div>
        <button className="btn btn--primary" onClick={() => onUpdateHp(participant.id, 1)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minWidth: '2.5rem', backgroundColor: 'var(--color-success)' }}>+1</button>
        <button className="btn btn--primary" onClick={() => onUpdateHp(participant.id, 5)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minWidth: '2.5rem', backgroundColor: 'var(--color-success)' }}>+5</button>
      </div>

      <div className="hp-bar">
        <div className="hp-bar__fill" style={{ width: `${Math.min(100, hpPercent)}%`, backgroundColor: hpColor, transition: 'width 0.4s ease, background-color 0.4s ease' }} />
      </div>

      <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.375rem', justifyContent: 'flex-end' }}>
        <button className="btn btn--ghost" onClick={() => onToggleActive(participant.id, participant.is_active)} style={{ fontSize: '0.6875rem', color: 'var(--color-warning)', padding: '0.25rem 0.5rem' }}>
          <GiDeathSkull size={14} /> KO
        </button>
        <button className="btn btn--ghost" onClick={() => onRemove(participant.id)} style={{ fontSize: '0.6875rem', color: 'var(--color-error)', padding: '0.25rem 0.5rem' }}>
          x
        </button>
      </div>
    </div>
  );
}
