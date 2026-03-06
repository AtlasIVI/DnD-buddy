import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for tracking combat state for a player.
 */
export function useCombatState(campaignId: string, characterId: string | null): {
  playerInCombat: boolean;
  activeCombatId: string | null;
} {
  const [playerInCombat, setPlayerInCombat] = useState(false);
  const [activeCombatId, setActiveCombatId] = useState<string | null>(null);

  const checkPlayerInCombat = useCallback(async (charId: string, combatId: string | null) => {
    if (!combatId || !charId) { 
      setPlayerInCombat(false); 
      return; 
    }
    const { data } = await supabase
      .from('combat_participants')
      .select('id, hp_current, is_active')
      .eq('combat_id', combatId)
      .eq('character_id', charId)
      .single();
    // In combat if: exists in table AND hp > 0
    setPlayerInCombat(!!data && data.hp_current > 0);
  }, []);

  // Fetch initial campaign state
  useEffect(() => {
    async function fetchCampaignCombat() {
      const { data } = await supabase
        .from('campaigns')
        .select('active_combat_id')
        .eq('id', campaignId)
        .single();
      if (data) {
        setActiveCombatId(data.active_combat_id);
        if (characterId && data.active_combat_id) {
          checkPlayerInCombat(characterId, data.active_combat_id);
        }
      }
    }
    fetchCampaignCombat();
  }, [campaignId, characterId, checkPlayerInCombat]);

  // Subscribe to campaign updates for combat state
  useEffect(() => {
    const channel = supabase.channel('combat-state-' + campaignId)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'campaigns', 
        filter: `id=eq.${campaignId}` 
      }, (payload: any) => {
        if (payload.new) {
          const newCombatId = payload.new.active_combat_id ?? null;
          setActiveCombatId(newCombatId);
          if (characterId) {
            checkPlayerInCombat(characterId, newCombatId);
          }
        }
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [campaignId, characterId, checkPlayerInCombat]);

  // Subscribe to combat_participants for real-time KO/death detection
  useEffect(() => {
    if (!characterId || !activeCombatId) return;
    
    const channel = supabase.channel('combat-participants-' + activeCombatId)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'combat_participants', 
        filter: `combat_id=eq.${activeCombatId}` 
      }, () => {
        checkPlayerInCombat(characterId, activeCombatId);
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [characterId, activeCombatId, checkPlayerInCombat]);

  return { playerInCombat, activeCombatId };
}