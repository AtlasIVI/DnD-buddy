import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Tables } from '../types/database';
import { useAutoSave } from './useAutoSave';

type Character = Tables<'characters'>;
type Effect = Tables<'effects'>;
type Skill = Tables<'skills'>;

/**
 * Hook for fetching and managing character data with auto-save.
 */
export function useCharacterData(campaignId: string, characterId?: string): {
  character: Character | null;
  localCharacter: Character | null;
  effects: Effect[];
  passiveSkills: Skill[];
  loading: boolean;
  updateField: (field: string, value: any) => void;
  saving: boolean;
  refetch: () => Promise<void>;
} {
  const { user } = useAuth();
  const [character, setCharacter] = useState<Character | null>(null);
  const [effects, setEffects] = useState<Effect[]>([]);
  const [passiveSkills, setPassiveSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  const onSave = useCallback(async (field: string, value: any) => {
    if (!character) return;
    await supabase.from('characters').update({ [field]: value }).eq('id', character.id);
    setCharacter(prev => prev ? { ...prev, [field]: value } : prev);
  }, [character]);

  const { localData: localCharacter, setLocalData: setLocalCharacter, updateField, saving } = useAutoSave<Character>(
    character,
    onSave as any,
    600
  );

  const fetchCharacter = useCallback(async () => {
    if (characterId) {
      const { data } = await supabase.from('characters').select('*').eq('id', characterId).single();
      if (data) setCharacter(data);
    } else if (user) {
      const { data } = await supabase.from('characters').select('*').eq('campaign_id', campaignId).eq('user_id', user.id).single();
      if (data) setCharacter(data);
    }
    setLoading(false);
  }, [campaignId, user, characterId]);

  const fetchEffects = useCallback(async (charId: string) => {
    const { data } = await supabase.from('effects').select('*').eq('character_id', charId).order('created_at');
    if (data) setEffects(data);
  }, []);

  const fetchPassiveSkills = useCallback(async (charId: string) => {
    const { data } = await supabase.from('skills').select('stat_bonus_ability, stat_bonus_value, name')
      .eq('character_id', charId).eq('is_active', false)
      .not('stat_bonus_ability', 'is', null).not('stat_bonus_value', 'is', null);
    if (data) setPassiveSkills(data as Skill[]);
  }, []);

  useEffect(() => {
    fetchCharacter();
  }, [fetchCharacter]);

  useEffect(() => {
    if (character) {
      fetchEffects(character.id);
      fetchPassiveSkills(character.id);
    }
  }, [character?.id, fetchEffects, fetchPassiveSkills]);

  // Realtime subscription for character updates
  useEffect(() => {
    if (!character) return;
    const channel = supabase.channel('char-data-' + character.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'effects', filter: `character_id=eq.${character.id}` }, () => fetchEffects(character.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'skills', filter: `character_id=eq.${character.id}` }, () => fetchPassiveSkills(character.id))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [character?.id, fetchEffects, fetchPassiveSkills]);

  // Sync localCharacter when character changes
  useEffect(() => {
    setLocalCharacter(character);
  }, [character, setLocalCharacter]);

  return { 
    character, 
    localCharacter, 
    effects, 
    passiveSkills, 
    loading, 
    updateField: updateField as (field: string, value: any) => void, 
    saving,
    refetch: fetchCharacter 
  };
}