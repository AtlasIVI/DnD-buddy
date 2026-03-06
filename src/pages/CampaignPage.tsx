import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Tables } from '../types/database';
import ViewToggle, { type ViewMode } from '../components/ui/ViewToggle';

import GmPanel        from '../components/gm/GmPanel';
import GmPlayersPanel from '../components/gm/GmPlayersPanel';
import MonsterLibrary from '../components/gm/MonsterLibrary';
import NpcPanel       from '../components/gm/NpcPanel';
import CombatTracker  from '../components/combat/CombatTracker';

import CharacterSheet from '../components/character/CharacterSheet';
import SpellsPanel    from '../components/character/SpellsPanel';
import InventoryPanel from '../components/character/InventoryPanel';
import SkillsList     from '../components/character/SkillsPanel';

import {
  GiSwordman, GiBroadsword, GiScrollUnfurled, GiBackpack,
  GiMagicSwirl, GiCharacter, GiWarlockEye, GiCrestedHelmet,
  GiCrossedSwords, GiCompass,
} from 'react-icons/gi';

type GmTab     = 'players' | 'combat' | 'npcs' | 'monsters' | 'config';
type PlayerTab = 'sheet' | 'spells' | 'skills' | 'inventory';

interface CampaignPageProps {
  campaignId: string;
  role: 'gm' | 'player';
  onBack: () => void;
}

type CharStats = {
  str: number; dex: number; con: number; int: number; wis: number; cha: number; level: number;
}

export default function CampaignPage({ campaignId, role, onBack }: CampaignPageProps) {
  const { user } = useAuth();

  const [viewMode,    setViewMode]    = useState<ViewMode>(role === 'gm' ? 'gm' : 'player');
  const [gmTab,       setGmTab]       = useState<GmTab>('players');
  const [playerTab,   setPlayerTab]   = useState<PlayerTab>('sheet');
  const [campaign,    setCampaign]    = useState<Tables<'campaigns'> | null>(null);
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [charStats,   setCharStats]   = useState<CharStats | undefined>(undefined);
  // true si le perso du joueur est dans le combat actif ET hp > 0
  const [playerInCombat, setPlayerInCombat] = useState(false);

  const fetchCampaign = useCallback(async () => {
    const { data } = await supabase.from('campaigns').select('*').eq('id', campaignId).single();
    if (data) setCampaign(data);
  }, [campaignId]);

  const fetchCharacter = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('characters')
      .select('id, str, dex, con, int, wis, cha, level')
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)
      .single();
    if (data) {
      setCharacterId(data.id);
      setCharStats({ str: data.str, dex: data.dex, con: data.con, int: data.int, wis: data.wis, cha: data.cha, level: data.level });
    }
  }, [campaignId, user]);

  /**
   * Vérifie si le perso est dans le combat actif ET a hp > 0.
   * Un joueur KO (is_active=false) ou mort (hp=0) repasse en vue exploration.
   */
  const checkPlayerInCombat = useCallback(async (charId: string, activeCombatId: string | null) => {
    if (!activeCombatId || !charId) { setPlayerInCombat(false); return; }
    const { data } = await supabase
      .from('combat_participants')
      .select('id, hp_current, is_active')
      .eq('combat_id', activeCombatId)
      .eq('character_id', charId)
      .single();
    // En combat si : existe dans la table ET hp > 0
    setPlayerInCombat(!!data && data.hp_current > 0);
  }, []);

  useEffect(() => {
    fetchCampaign();
    fetchCharacter();
  }, [fetchCampaign, fetchCharacter]);

  // Quand campaign ou characterId change → re-vérifier si le joueur est en combat
  useEffect(() => {
    if (characterId && campaign) {
      checkPlayerInCombat(characterId, campaign.active_combat_id ?? null);
    }
  }, [characterId, campaign?.active_combat_id, checkPlayerInCombat]);

  // Realtime — campagne
  useEffect(() => {
    const ch = supabase.channel('campaign-page-' + campaignId)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'campaigns', filter: `id=eq.${campaignId}` }, (p: any) => {
        if (p.new) {
          setCampaign(p.new);
          if (characterId) checkPlayerInCombat(characterId, p.new.active_combat_id ?? null);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [campaignId, characterId, checkPlayerInCombat]);

  // Realtime — stats du personnage
  useEffect(() => {
    if (!characterId) return;
    const ch = supabase.channel('campaign-page-char-' + characterId)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'characters', filter: `id=eq.${characterId}` }, (p: any) => {
        if (p.new) setCharStats({ str: p.new.str, dex: p.new.dex, con: p.new.con, int: p.new.int, wis: p.new.wis, cha: p.new.cha, level: p.new.level });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [characterId]);

  // Realtime — combat_participants (pour détecter KO / mort en temps réel)
  useEffect(() => {
    if (!characterId || !campaign?.active_combat_id) return;
    const combatId = campaign.active_combat_id;
    const ch = supabase.channel('campaign-page-cp-' + combatId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'combat_participants', filter: `combat_id=eq.${combatId}` }, () => {
        checkPlayerInCombat(characterId, combatId);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [characterId, campaign?.active_combat_id, checkPlayerInCombat]);

  const isGm     = role === 'gm';
  const inCombat = campaign?.mode === 'combat';

  return (
    <div className="app-shell app-shell--with-nav">

      {/* ── Top bar ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, height: '3rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1rem',
        backgroundColor: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <button className="btn btn--ghost" onClick={onBack}
            style={{ padding: '0.25rem 0.5rem', minHeight: 'unset', fontSize: '0.8125rem' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }}>
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Accueil
          </button>
          <span style={{ color: 'var(--color-border)' }}>│</span>
          <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)', maxWidth: '10rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {campaign?.name ?? '…'}
          </span>
          <span style={{
            fontSize: '0.5625rem', fontWeight: 700, textTransform: 'uppercase',
            padding: '0.1rem 0.45rem', borderRadius: '999px',
            backgroundColor: inCombat ? 'rgba(231,76,60,0.15)' : 'rgba(39,174,96,0.12)',
            color: inCombat ? 'var(--color-error)' : 'var(--color-success)',
            display: 'flex', alignItems: 'center', gap: '0.2rem',
          }}>
            {inCombat ? <GiCrossedSwords size={10} /> : <GiCompass size={10} />}
            {inCombat ? 'Combat' : 'Exploration'}
          </span>
        </div>
        {isGm && <ViewToggle current={viewMode} onChange={setViewMode} />}
      </header>

      {/* ── Contenu ── */}
      <div className="app-content" style={{ paddingTop: '4rem' }}>
        {viewMode === 'gm' ? (
          <GmView campaignId={campaignId} campaign={campaign} tab={gmTab} onBack={onBack} />
        ) : (
          <PlayerView
            campaignId={campaignId}
            characterId={characterId}
            charStats={charStats}
            tab={playerTab}
            isGmPreview={isGm && viewMode === 'player'}
            // On passe inCombat=true seulement si la campagne est en combat ET le joueur y participe (hp > 0)
            inCombat={inCombat && playerInCombat}
          />
        )}
      </div>

      {/* ── Nav basse ── */}
      <nav className="bottom-nav">
        {viewMode === 'gm' ? (
          <>
            <NavItem icon={GiSwordman}       label="Joueurs"  active={gmTab === 'players'}  onClick={() => setGmTab('players')}  />
            <NavItem icon={GiBroadsword}     label="Combat"   active={gmTab === 'combat'}   onClick={() => setGmTab('combat')}   />
            <NavItem icon={GiCrestedHelmet}  label="PNJs"     active={gmTab === 'npcs'}     onClick={() => setGmTab('npcs')}     />
            <NavItem icon={GiScrollUnfurled} label="Monstres" active={gmTab === 'monsters'} onClick={() => setGmTab('monsters')} />
            <NavItem icon={GiCharacter}      label="Config"   active={gmTab === 'config'}   onClick={() => setGmTab('config')}   />
          </>
        ) : (
          // En mode combat joueur : la nav onglets disparaît (tout est dans le layout 2 colonnes)
          // En exploration : nav normale
          inCombat && playerInCombat ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '0.5rem', fontSize: '0.6875rem', color: 'var(--color-error)', fontWeight: 600 }}>
              <GiCrossedSwords size={14} /> En combat — toutes vos actions sont accessibles sur la fiche
            </div>
          ) : (
            <>
              <NavItem icon={GiCharacter}      label="Perso"      active={playerTab === 'sheet'}     onClick={() => setPlayerTab('sheet')}     />
              <NavItem icon={GiMagicSwirl}     label="Magie"      active={playerTab === 'spells'}    onClick={() => setPlayerTab('spells')}    />
              <NavItem icon={GiScrollUnfurled} label="Compét."    active={playerTab === 'skills'}    onClick={() => setPlayerTab('skills')}    />
              <NavItem icon={GiBackpack}       label="Inventaire" active={playerTab === 'inventory'} onClick={() => setPlayerTab('inventory')} />
            </>
          )
        )}
      </nav>
    </div>
  );
}

// ─── Vue MJ ───────────────────────────────────────────────────────────────────

function GmView({ campaignId, campaign, tab, onBack }: {
  campaignId: string; campaign: Tables<'campaigns'> | null; tab: GmTab; onBack: () => void;
}) {
  return (
    <>
      {tab === 'players'  && <GmPlayersPanel campaignId={campaignId} gmSeeHidden={campaign?.gm_see_hidden ?? false} />}
      {tab === 'combat'   && <CombatTracker  campaignId={campaignId} />}
      {tab === 'npcs'     && <NpcPanel       campaignId={campaignId} />}
      {tab === 'monsters' && <MonsterLibrary />}
      {tab === 'config'   && <GmPanel        campaignId={campaignId} onBack={onBack} />}
    </>
  );
}

// ─── Vue Joueur ───────────────────────────────────────────────────────────────

function PlayerView({ campaignId, characterId, charStats, tab, isGmPreview, inCombat }: {
  campaignId: string; characterId: string | null; charStats: CharStats | undefined;
  tab: PlayerTab; isGmPreview?: boolean; inCombat?: boolean;
}) {
  const canEdit = !isGmPreview;

  // En mode combat : on affiche directement CharacterSheet (qui contient le layout 2 colonnes)
  // toutes les autres nav sont ignorées
  if (inCombat) {
    return (
      <CharacterSheet campaignId={campaignId} readOnly={isGmPreview} inCombat={true} />
    );
  }

  return (
    <>
      {isGmPreview && (
        <div style={{ marginBottom: '0.75rem', padding: '0.375rem 0.75rem', backgroundColor: 'rgba(255,200,0,0.08)', border: '1px solid rgba(255,200,0,0.3)', borderRadius: 'var(--button-radius)', fontSize: '0.6875rem', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <GiWarlockEye size={12} /> Prévisualisation vue joueur — lecture seule
        </div>
      )}

      {tab === 'sheet' && (
        <CharacterSheet campaignId={campaignId} readOnly={isGmPreview} />
      )}
      {tab === 'spells' && (
        characterId
          ? <SpellsPanel characterId={characterId} readOnly={isGmPreview} />
          : <NoCharCard message="Crée d'abord un personnage dans l'onglet Perso." />
      )}
      {tab === 'skills' && (
        characterId
          ? <SkillsList characterId={characterId} canEdit={canEdit} charStats={charStats} />
          : <NoCharCard message="Crée d'abord un personnage dans l'onglet Perso." />
      )}
      {tab === 'inventory' && (
        characterId
          ? <InventoryPanel characterId={characterId} canEdit={canEdit} />
          : <NoCharCard message="Crée d'abord un personnage dans l'onglet Perso." />
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

function NavItem({ icon: Icon, label, active, onClick }: {
  icon: React.ComponentType<{ size?: number }>; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button className={`bottom-nav__item${active ? ' bottom-nav__item--active' : ''}`} onClick={onClick}>
      <Icon size={active ? 22 : 20} />
      {label}
    </button>
  );
}