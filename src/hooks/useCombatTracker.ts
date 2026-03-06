import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Tables } from '../types/database';
import type { AddParticipantForm, AvailableNpc } from '../components/combat/tracker/types';

interface UseCombatTrackerParams { campaignId: string; }

export function useCombatTracker({ campaignId }: UseCombatTrackerParams) {
  const [combat, setCombat] = useState<Tables<'combats'> | null>(null);
  const [participants, setParticipants] = useState<Tables<'combat_participants'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [combatName, setCombatName] = useState('Nouveau combat');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<AddParticipantForm>({
    display_name: '', participant_type: 'monster', hp_max: 10, hp_current: 10, armor_class: 10, initiative: 0,
  });
  const [availableNpcs, setAvailableNpcs] = useState<AvailableNpc[]>([]);
  const [hpFlash, setHpFlash] = useState<Record<string, 'damage' | 'heal'>>({});
  const [round, setRound] = useState(1);

  const fetchParticipants = useCallback(async (combatId: string) => {
    const { data } = await supabase
      .from('combat_participants').select('*').eq('combat_id', combatId)
      .order('initiative', { ascending: false });
    if (data) setParticipants(data);
  }, []);

  const fetchCombat = useCallback(async () => {
    const { data } = await supabase
      .from('combats').select('*').eq('campaign_id', campaignId).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(1).single();
    if (data) {
      setCombat(data);
      await fetchParticipants(data.id);
    }
    setLoading(false);
  }, [campaignId, fetchParticipants]);

  useEffect(() => { fetchCombat(); }, [fetchCombat]);

  useEffect(() => {
    supabase.from('npcs').select('id, name, hp_current, hp_max, armor_class').eq('campaign_id', campaignId)
      .then(({ data }) => { if (data) setAvailableNpcs(data); });
  }, [campaignId]);

  useEffect(() => {
    if (!combat) return;
    const channel = supabase.channel('combat-gm-' + combat.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'combat_participants', filter: 'combat_id=eq.' + combat.id }, async (payload: any) => {
        if (payload.eventType === 'UPDATE' && payload.old && payload.new) {
          const delta = payload.new.hp_current - payload.old.hp_current;
          if (delta !== 0) {
            setHpFlash((prev) => ({ ...prev, [payload.new.id]: delta < 0 ? 'damage' : 'heal' }));
            setTimeout(() => {
              setHpFlash((prev) => {
                const next = { ...prev };
                delete next[payload.new.id];
                return next;
              });
            }, 500);
          }
        }
        await fetchParticipants(combat.id);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'combats', filter: 'id=eq.' + combat.id }, (payload: any) => {
        if (payload.new) setCombat(payload.new);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [combat?.id, fetchParticipants]);

  const createCombat = async () => {
    const { data: newCombat } = await supabase
      .from('combats').insert({ campaign_id: campaignId, name: combatName }).select().single();
    if (!newCombat) return;
    setCombat(newCombat);
    setRound(1);
    await supabase.from('campaigns').update({ mode: 'combat', active_combat_id: newCombat.id }).eq('id', campaignId);
    const { data: characters } = await supabase
      .from('characters').select('id, name, hp_current, hp_max, armor_class').eq('campaign_id', campaignId);

    if (characters && characters.length > 0) {
      await supabase.from('combat_participants').insert(characters.map((character) => ({
        combat_id: newCombat.id,
        display_name: character.name,
        participant_type: 'player' as const,
        hp_max: character.hp_max,
        hp_current: character.hp_current,
        armor_class: character.armor_class,
        character_id: character.id,
        initiative: 0,
      })));
    }
    await fetchParticipants(newCombat.id);
  };

  const addParticipant = async () => {
    if (!combat || !addForm.display_name.trim()) return;
    await supabase.from('combat_participants').insert({
      combat_id: combat.id,
      display_name: addForm.display_name,
      participant_type: addForm.participant_type,
      hp_max: addForm.hp_max,
      hp_current: addForm.hp_current,
      armor_class: addForm.armor_class,
      initiative: addForm.initiative,
    });
    setAddForm({ display_name: '', participant_type: 'monster', hp_max: 10, hp_current: 10, armor_class: 10, initiative: 0 });
    setShowAdd(false);
  };

  const addExistingNpc = async (npc: AvailableNpc) => {
    if (!combat || participants.some((x) => x.npc_id === npc.id)) return;
    await supabase.from('combat_participants').insert({
      combat_id: combat.id,
      display_name: npc.name,
      participant_type: 'npc',
      hp_max: npc.hp_max,
      hp_current: npc.hp_current,
      armor_class: npc.armor_class,
      npc_id: npc.id,
      initiative: 0,
    });
  };

  const updateParticipantHp = async (id: string, delta: number) => {
    const participant = participants.find((x) => x.id === id);
    if (!participant) return;
    const newHp = Math.max(0, Math.min(participant.hp_max, participant.hp_current + delta));
    setHpFlash((prev) => ({ ...prev, [id]: delta < 0 ? 'damage' : 'heal' }));
    setTimeout(() => {
      setHpFlash((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 500);
    await supabase.from('combat_participants').update({ hp_current: newHp }).eq('id', id);
  };

  const updateInitiative = async (id: string, initiative: number) => {
    await supabase.from('combat_participants').update({ initiative }).eq('id', id);
  };

  const removeParticipant = async (id: string) => {
    await supabase.from('combat_participants').delete().eq('id', id);
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await supabase.from('combat_participants').update({ is_active: !isActive }).eq('id', id);
  };

  const nextTurn = async () => {
    if (!combat) return;
    const activeParts = participants.filter((p) => p.is_active).sort((a, b) => b.initiative - a.initiative);
    if (activeParts.length === 0) return;
    const nextIdx = (combat.current_turn_index ?? -1) + 1;
    if (nextIdx >= activeParts.length) {
      setRound((r) => r + 1);
      await supabase.from('combats').update({ current_turn_index: 0 }).eq('id', combat.id);
      return;
    }
    await supabase.from('combats').update({ current_turn_index: nextIdx }).eq('id', combat.id);
  };

  const endCombat = async () => {
    if (!combat) return;
    await supabase.from('combats').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', combat.id);
    await supabase.from('campaigns').update({ mode: 'exploration', active_combat_id: null }).eq('id', campaignId);
    for (const participant of participants) {
      if (participant.character_id) await supabase.from('characters').update({ hp_current: participant.hp_current }).eq('id', participant.character_id);
      if (participant.npc_id) await supabase.from('npcs').update({ hp_current: participant.hp_current }).eq('id', participant.npc_id);
    }
    setCombat(null);
    setParticipants([]);
    setRound(1);
  };

  return {
    combat, participants, loading, combatName, showAdd, addForm, availableNpcs, hpFlash, round,
    setCombatName, setShowAdd, setAddForm, createCombat, addParticipant, addExistingNpc,
    updateParticipantHp, updateInitiative, removeParticipant, toggleActive, nextTurn, endCombat,
  };
}
