import type { Tables } from '../../types/database';
import GmPanel from '../gm/GmPanel';
import GmPlayersPanel from '../gm/GmPlayersPanel';
import MonsterLibrary from '../gm/MonsterLibrary';
import NpcPanel from '../gm/NpcPanel';
import CombatTracker from '../combat/CombatTracker';

import CharacterSheet from '../character/CharacterSheet';
import SpellsPanel from '../character/SpellsPanel';
import InventoryPanel from '../character/InventoryPanel';
import SkillsList from '../character/SkillsPanel';

import { GiMagicSwirl, GiWarlockEye } from 'react-icons/gi';

export type GmTab = 'players' | 'combat' | 'npcs' | 'monsters' | 'config';
export type PlayerTab = 'sheet' | 'spells' | 'skills' | 'inventory';

export type CharStats = {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  level: number;
};

export function GmView({ campaignId, campaign, tab, onBack }: {
  campaignId: string;
  campaign: Tables<'campaigns'> | null;
  tab: GmTab;
  onBack: () => void;
}) {
  return (
    <>
      {tab === 'players' && <GmPlayersPanel campaignId={campaignId} gmSeeHidden={campaign?.gm_see_hidden ?? false} />}
      {tab === 'combat' && <CombatTracker campaignId={campaignId} />}
      {tab === 'npcs' && <NpcPanel campaignId={campaignId} />}
      {tab === 'monsters' && <MonsterLibrary />}
      {tab === 'config' && <GmPanel campaignId={campaignId} onBack={onBack} />}
    </>
  );
}

export function PlayerView({ campaignId, characterId, charStats, tab, isGmPreview, inCombat }: {
  campaignId: string;
  characterId: string | null;
  charStats: CharStats | undefined;
  tab: PlayerTab;
  isGmPreview?: boolean;
  inCombat?: boolean;
}) {
  const canEdit = !isGmPreview;

  if (inCombat) {
    return <CharacterSheet campaignId={campaignId} readOnly={isGmPreview} inCombat />;
  }

  return (
    <>
      {isGmPreview && (
        <div style={{ marginBottom: '0.75rem', padding: '0.375rem 0.75rem', backgroundColor: 'rgba(255,200,0,0.08)', border: '1px solid rgba(255,200,0,0.3)', borderRadius: 'var(--button-radius)', fontSize: '0.6875rem', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <GiWarlockEye size={12} /> Prévisualisation vue joueur — lecture seule
        </div>
      )}

      {tab === 'sheet' && <CharacterSheet campaignId={campaignId} readOnly={isGmPreview} />}
      {tab === 'spells' && (
        characterId ? <SpellsPanel characterId={characterId} readOnly={isGmPreview} /> : <NoCharCard message="Crée d'abord un personnage dans l'onglet Perso." />
      )}
      {tab === 'skills' && (
        characterId ? <SkillsList characterId={characterId} canEdit={canEdit} charStats={charStats} /> : <NoCharCard message="Crée d'abord un personnage dans l'onglet Perso." />
      )}
      {tab === 'inventory' && (
        characterId ? <InventoryPanel characterId={characterId} canEdit={canEdit} /> : <NoCharCard message="Crée d'abord un personnage dans l'onglet Perso." />
      )}
    </>
  );
}

function NoCharCard({ message }: { message: string }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
      <GiMagicSwirl size={32} style={{ color: 'var(--color-text-muted)', marginBottom: '0.75rem' }} />
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{message}</p>
    </div>
  );
}
