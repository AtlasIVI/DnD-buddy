import { GiCharacter, GiHearts, GiShield, GiSundial, GiWolfHead } from 'react-icons/gi';
import type { AddParticipantForm, AvailableNpc } from './types';

interface AddParticipantPanelProps {
  show: boolean;
  form: AddParticipantForm;
  npcsNotIn: AvailableNpc[];
  onToggleShow: () => void;
  onFormChange: (next: AddParticipantForm) => void;
  onAddParticipant: () => void;
  onAddExistingNpc: (npc: AvailableNpc) => void;
}

export function AddParticipantPanel({
  show,
  form,
  npcsNotIn,
  onToggleShow,
  onFormChange,
  onAddParticipant,
  onAddExistingNpc,
}: AddParticipantPanelProps) {
  return (
    <>
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn--ghost" onClick={onToggleShow} style={{ fontSize: '0.75rem' }}>
          {show ? 'Annuler' : '+ Monstre / PNJ'}
        </button>
        {npcsNotIn.map((npc) => (
          <button
            key={npc.id}
            className="btn btn--ghost"
            onClick={() => onAddExistingNpc(npc)}
            style={{ fontSize: '0.6875rem', color: 'var(--color-npc-color)' }}
          >
            <GiCharacter size={12} /> {npc.name}
          </button>
        ))}
      </div>

      {show && (
        <div className="card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <input
            className="input"
            placeholder="Nom"
            value={form.display_name}
            onChange={(e) => onFormChange({ ...form, display_name: e.target.value })}
          />
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            {(['monster', 'npc'] as const).map((type) => (
              <button
                key={type}
                className={form.participant_type === type ? 'btn btn--primary' : 'btn btn--ghost'}
                onClick={() => onFormChange({ ...form, participant_type: type })}
                style={{ flex: 1, fontSize: '0.75rem' }}
              >
                {type === 'monster' ? <><GiWolfHead size={14} /> Monstre</> : <><GiCharacter size={14} /> PNJ</>}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.125rem' }}>
                <GiHearts size={10} /> PV
              </label>
              <input
                className="input"
                type="number"
                inputMode="numeric"
                min={0}
                value={form.hp_max}
                onChange={(e) => {
                  const hp = Math.max(0, parseInt(e.target.value, 10) || 0);
                  onFormChange({ ...form, hp_max: hp, hp_current: hp });
                }}
                style={{ textAlign: 'center' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.125rem' }}>
                <GiShield size={10} /> CA
              </label>
              <input
                className="input"
                type="number"
                inputMode="numeric"
                min={0}
                value={form.armor_class}
                onChange={(e) => onFormChange({ ...form, armor_class: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                style={{ textAlign: 'center' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.125rem' }}>
                <GiSundial size={10} /> Init.
              </label>
              <input
                className="input"
                type="number"
                inputMode="numeric"
                value={form.initiative}
                onChange={(e) => onFormChange({ ...form, initiative: parseInt(e.target.value, 10) || 0 })}
                style={{ textAlign: 'center' }}
              />
            </div>
          </div>

          <button className="btn btn--primary" onClick={onAddParticipant} disabled={!form.display_name.trim()}>
            Ajouter
          </button>
        </div>
      )}
    </>
  );
}
