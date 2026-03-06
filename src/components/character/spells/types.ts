import type { Tables } from '../../../types/database';

export type Spell = Tables<'spells'>;
export type SpellSlot = Tables<'spell_slots'>;

export const SLOT_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
export const ORDINAL = ['', '1er', '2e', '3e', '4e', '5e', '6e', '7e', '8e', '9e'];
export const CASTING_TIMES = ['1 action', '1 action bonus', '1 réaction', '1 minute', '10 minutes', '1 heure'];

export function emptySpell(characterId: string): Omit<Spell, 'id' | 'created_at'> {
  return {
    character_id: characterId,
    name: '',
    level: 0,
    casting_time: '1 action',
    range: '',
    duration: '',
    concentration: false,
    damage_dice: '',
    description: '',
    is_prepared: false,
    is_hidden: false,
    sort_order: 0,
  };
}
