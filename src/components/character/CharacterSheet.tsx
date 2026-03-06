import { useCallback } from 'react';
import { GiBroadsword, GiCrossedSwords, GiQuillInk } from 'react-icons/gi';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useCharacterData } from '../../hooks/useCharacterData';
import SpellsPanel from './SpellsPanel';
import SkillsList from './SkillsPanel';
import {
  IdentitySection,
  HpSection,
  AbilitiesGrid,
  EffectsSection,
} from './sheet';

interface CharacterSheetProps {
  campaignId: string;
  readOnly?: boolean;
  characterId?: string;
  inCombat?: boolean;
}

export default function CharacterSheet({ campaignId, readOnly, characterId, inCombat }: CharacterSheetProps) {
  const { user } = useAuth();
  const {
    character,
    localCharacter,
    effects,
    passiveSkills,
    loading,
    updateField,
    saving,
    refetch,
  } = useCharacterData(campaignId, characterId);

  async function createCharacter() {
    if (!user) return;
    await supabase
      .from('characters')
      .insert({ campaign_id: campaignId, user_id: user.id, name: 'Nouveau Personnage' });
    await refetch();
  }

  const handleUpdateField = useCallback((field: string, value: any) => {
    if (readOnly || !localCharacter) return;
    updateField(field, value);
  }, [readOnly, localCharacter, updateField]);

  async function addEffect(effect: { name: string; description: string; source: string; is_positive: boolean }) {
    if (!character || !effect.name.trim()) return;
    await supabase.from('effects').insert({ character_id: character.id, ...effect });
    await refetch();
  }

  async function removeEffect(id: string) {
    await supabase.from('effects').delete().eq('id', id);
    await refetch();
  }

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Chargement...</p>;
  if (!localCharacter) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
        <GiBroadsword size={32} style={{ color: 'var(--color-accent)', marginBottom: '0.75rem' }} />
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Pas encore de personnage</p>
        <button className="btn btn--primary" onClick={createCharacter} disabled={saving}>{saving ? '...' : 'Créer mon personnage'}</button>
      </div>
    );
  }

  const charStatsForSkills = {
    str: localCharacter.str,
    dex: localCharacter.dex,
    con: localCharacter.con,
    int: localCharacter.int,
    wis: localCharacter.wis,
    cha: localCharacter.cha,
    level: localCharacter.level,
  };

  if (inCombat) {
    return (
      <div className="combat-sheet-grid">
        <div className="combat-sheet-left">
          <IdentitySection
            character={localCharacter}
            readOnly={readOnly}
            onUpdate={handleUpdateField}
            saving={saving}
            compact
          />
          <HpSection character={localCharacter} readOnly={readOnly} onUpdate={handleUpdateField} />
          <AbilitiesGrid
            character={localCharacter}
            passiveSkills={passiveSkills}
            readOnly={readOnly}
            onUpdate={handleUpdateField}
          />
          <EffectsSection effects={effects} readOnly={readOnly} onAdd={addEffect} onRemove={removeEffect} />
        </div>

        <div className="combat-sheet-right">
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.375rem 0.75rem', marginBottom: '0.25rem',
            backgroundColor: 'rgba(231,76,60,0.1)',
            border: '1px solid rgba(231,76,60,0.25)',
            borderRadius: 'var(--button-radius)',
            fontSize: '0.6875rem', color: 'var(--color-error)', fontWeight: 600,
          }}>
            <GiCrossedSwords size={13} /> Mode Combat — Actions disponibles
          </div>

          <div className="combat-actions-grid">
            <div>
              <SkillsList characterId={localCharacter.id} canEdit={false} charStats={charStatsForSkills} />
            </div>
            <div>
              <SpellsPanel characterId={localCharacter.id} readOnly={false} combatMode={true} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <IdentitySection
        character={localCharacter}
        readOnly={readOnly}
        onUpdate={handleUpdateField}
        saving={saving}
      />
      <HpSection character={localCharacter} readOnly={readOnly} onUpdate={handleUpdateField} />
      <AbilitiesGrid
        character={localCharacter}
        passiveSkills={passiveSkills}
        readOnly={readOnly}
        onUpdate={handleUpdateField}
      />
      <EffectsSection effects={effects} readOnly={readOnly} onAdd={addEffect} onRemove={removeEffect} />

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <GiQuillInk size={18} style={{ color: 'var(--color-accent)' }} />
          <h3 style={{ fontSize: '1rem' }}>Notes</h3>
        </div>
        <textarea
          className="input"
          rows={4}
          value={localCharacter.notes}
          onChange={e => handleUpdateField('notes', e.target.value)}
          placeholder="Notes personnelles..."
          readOnly={readOnly}
          style={{ resize: 'vertical' }}
        />
      </div>
    </div>
  );
}