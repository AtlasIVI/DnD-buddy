import type { Tables } from '../../../types/database';

export interface AddParticipantForm {
  display_name: string;
  participant_type: 'player' | 'monster' | 'npc';
  hp_max: number;
  hp_current: number;
  armor_class: number;
  initiative: number;
}

export interface AvailableNpc {
  id: string;
  name: string;
  hp_current: number;
  hp_max: number;
  armor_class: number;
}

export type CombatParticipant = Tables<'combat_participants'>;
