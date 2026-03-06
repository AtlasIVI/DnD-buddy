import { GiCharacter, GiCrestedHelmet, GiCrossedSwords, GiWolfHead } from 'react-icons/gi';
import { CombatEmptyState } from './tracker/CombatEmptyState';
import { CombatTurnPanel } from './tracker/CombatTurnPanel';
import { AddParticipantPanel } from './tracker/AddParticipantPanel';
import { ActiveParticipantCard } from './tracker/ActiveParticipantCard';
import { DownParticipantRow, DownParticipantsHeader } from './tracker/DownParticipantRow';
import { useCombatTracker } from '../../hooks/useCombatTracker';

interface CombatTrackerProps { campaignId: string; }

export default function CombatTracker({ campaignId }: CombatTrackerProps) {
  const {
    combat,
    participants,
    loading,
    combatName,
    showAdd,
    addForm,
    availableNpcs,
    hpFlash,
    round,
    setCombatName,
    setShowAdd,
    setAddForm,
    createCombat,
    addParticipant,
    addExistingNpc,
    updateParticipantHp,
    updateInitiative,
    removeParticipant,
    toggleActive,
    nextTurn,
    endCombat,
  } = useCombatTracker({ campaignId });

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Chargement...</p>;

  if (!combat) {
    return <CombatEmptyState combatName={combatName} onNameChange={setCombatName} onCreateCombat={createCombat} />;
  }

  const activeParts = participants.filter(p => p.is_active).sort((a, b) => b.initiative - a.initiative);
  const downParts = participants.filter(p => !p.is_active);
  const currentTurnIdx = combat.current_turn_index ?? -1;
  const safeIdx = activeParts.length > 0
    ? ((currentTurnIdx % activeParts.length) + activeParts.length) % activeParts.length
    : -1;
  const currentParticipant = currentTurnIdx >= 0 && activeParts.length > 0 ? activeParts[safeIdx] : null;

  const typeIcon = (type: string) => {
    if (type === 'player')  return <GiCrestedHelmet size={12} style={{ color: 'var(--color-player-color)' }} />;
    if (type === 'monster') return <GiWolfHead size={12} style={{ color: 'var(--color-monster-color)' }} />;
    return <GiCharacter size={12} style={{ color: 'var(--color-npc-color)' }} />;
  };

  const npcsNotIn = availableNpcs.filter(n => !participants.some(x => x.npc_id === n.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GiCrossedSwords size={20} style={{ color: 'var(--color-error)' }} />
          <h2 style={{ fontSize: '1.25rem' }}>{combat.name}</h2>
          <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', backgroundColor: 'var(--color-background-alt)', padding: '0.125rem 0.5rem', borderRadius: '999px' }}>
            Round {round}
          </span>
        </div>
        <button className="btn btn--danger" onClick={endCombat} style={{ fontSize: '0.75rem' }}>Fin du combat</button>
      </div>

      <CombatTurnPanel
        activeParts={activeParts}
        currentParticipant={currentParticipant}
        currentTurnIdx={currentTurnIdx}
        safeIdx={safeIdx}
        typeIcon={typeIcon}
        onNextTurn={nextTurn}
        onUpdateHp={updateParticipantHp}
      />

      <AddParticipantPanel
        show={showAdd}
        form={addForm}
        npcsNotIn={npcsNotIn}
        onToggleShow={() => setShowAdd((prev) => !prev)}
        onFormChange={setAddForm}
        onAddParticipant={addParticipant}
        onAddExistingNpc={addExistingNpc}
      />

      {activeParts.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Aucun participant actif.</p>
        </div>
      )}

      {activeParts.map((participant, idx) => (
        <ActiveParticipantCard
          key={participant.id}
          participant={participant}
          idx={idx}
          safeIdx={safeIdx}
          currentTurnIdx={currentTurnIdx}
          hpFlash={hpFlash[participant.id]}
          typeIcon={typeIcon}
          onUpdateHp={updateParticipantHp}
          onUpdateInitiative={updateInitiative}
          onToggleActive={toggleActive}
          onRemove={removeParticipant}
        />
      ))}

      {downParts.length > 0 && (
        <>
          <DownParticipantsHeader count={downParts.length} />
          {downParts.map((participant) => (
            <DownParticipantRow
              key={participant.id}
              participant={participant}
              typeIcon={typeIcon}
              onToggleActive={toggleActive}
              onRemove={removeParticipant}
            />
          ))}
        </>
      )}
    </div>
  );
}