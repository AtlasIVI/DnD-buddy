import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { type ViewMode } from '../components/ui/ViewToggle';
import { CampaignHeader } from '../components/campaign/CampaignHeader';
import CampaignBottomNav from '../components/campaign/CampaignBottomNav';
import { GmView, PlayerView, type CharStats, type GmTab, type PlayerTab } from '../components/campaign/CampaignViews';
import { useCampaignData } from '../hooks/useCampaignData';
import { useCombatState } from '../hooks/useCombatState';


interface CampaignPageProps {
  campaignId: string;
  role: 'gm' | 'player';
  onBack: () => void;
}

export default function CampaignPage({ campaignId, role, onBack }: CampaignPageProps) {
  const { user } = useAuth();

  const [viewMode,    setViewMode]    = useState<ViewMode>(role === 'gm' ? 'gm' : 'player');
  const [gmTab,       setGmTab]       = useState<GmTab>('players');
  const [playerTab,   setPlayerTab]   = useState<PlayerTab>('sheet');
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [charStats,   setCharStats]   = useState<CharStats | undefined>(undefined);

  // Use the new hooks for campaign and combat state
  const { campaign } = useCampaignData(campaignId);
  const { playerInCombat } = useCombatState(campaignId, characterId);

  // Fetch character data (still needed for characterId and stats)
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

  useEffect(() => {
    fetchCharacter();
  }, [fetchCharacter]);

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

  const isGm     = role === 'gm';
  const inCombat = campaign?.mode === 'combat';

  return (
    <div className="app-shell app-shell--with-nav">

      {/* ── Top bar using CampaignHeader component ── */}
      <CampaignHeader
        campaign={campaign}
        inCombat={inCombat ?? false}
        isGm={isGm}
        viewMode={viewMode}
        onViewModeChange={isGm ? setViewMode : undefined}
        onBack={onBack}
      />

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

      <CampaignBottomNav
        viewMode={viewMode}
        gmTab={gmTab}
        playerTab={playerTab}
        inCombat={!!inCombat}
        playerInCombat={playerInCombat}
        onGmTabChange={setGmTab}
        onPlayerTabChange={setPlayerTab}
      />
    </div>
  );
}
