import type { Tables, Enums } from '../../../types/database';
import { GiMuscleUp, GiRunningNinja, GiShield, GiBrain, GiPrayer, GiChatBubble } from 'react-icons/gi';

export type Skill = Tables<'skills'>;
export type SkillAbility = Enums<'skill_ability'>;
export type ActionCost = Enums<'skill_action_cost'>;
export type Proficiency = Enums<'skill_proficiency'>;
export type RestType = Enums<'rest_type'>;

export type CharStats = {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
  level: number;
};

export interface NewSkillForm {
  name: string;
  description: string;
  modifier: string;
  is_hidden: boolean;
  is_active: boolean;
  ability: SkillAbility | '';
  proficiency: Proficiency;
  action_cost: ActionCost | '';
  uses_max: string;
  rest_reset: RestType | '';
  stat_bonus_ability: SkillAbility | '';
  stat_bonus_value: string;
}

export const EMPTY_FORM: NewSkillForm = {
  name: '',
  description: '',
  modifier: '',
  is_hidden: false,
  is_active: false,
  ability: '',
  proficiency: 'none',
  action_cost: '',
  uses_max: '',
  rest_reset: '',
  stat_bonus_ability: '',
  stat_bonus_value: '',
};

export const ABILITY_LABELS: Record<SkillAbility, string> = {
  STR: 'FOR',
  DEX: 'DEX',
  CON: 'CON',
  INT: 'INT',
  WIS: 'SAG',
  CHA: 'CHA',
};

export const ABILITY_ICONS: Record<SkillAbility, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  STR: GiMuscleUp,
  DEX: GiRunningNinja,
  CON: GiShield,
  INT: GiBrain,
  WIS: GiPrayer,
  CHA: GiChatBubble,
};

export const ACTION_LABELS: Record<ActionCost, string> = {
  action: 'Action',
  bonus_action: 'Bonus',
  reaction: 'Réaction',
  free: 'Gratuit',
};

export const ACTION_COLORS: Record<ActionCost, string> = {
  action: 'var(--color-accent)',
  bonus_action: 'var(--color-info)',
  reaction: 'var(--color-warning)',
  free: 'var(--color-success)',
};

function proficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

function abilityMod(val: number): number {
  return Math.floor((val - 10) / 2);
}

export function computeModifier(skill: Skill, stats?: CharStats): string {
  if (!skill.ability || !stats) return skill.modifier || '—';
  const statKey = skill.ability.toLowerCase() as keyof CharStats;
  const base = abilityMod(stats[statKey] as number);
  const pb = proficiencyBonus(stats.level);
  let total = base;
  if (skill.proficiency === 'proficient') total += pb;
  if (skill.proficiency === 'expertise') total += pb * 2;
  return total >= 0 ? `+${total}` : `${total}`;
}
