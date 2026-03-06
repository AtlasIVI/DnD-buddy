import React, { useMemo } from 'react';
import { 
  GiMuscleUp, GiRunningNinja, GiShield, 
  GiBrain, GiPrayer, GiChatBubble 
} from 'react-icons/gi';
import { StatBlock } from '../../ui/StatBlock';
import type { Tables, Enums } from '../../../types/database';

type Character = Tables<'characters'>;
type Skill = Tables<'skills'>;
type SkillAbility = Enums<'skill_ability'>;

interface AbilitiesGridProps {
  character: Character;
  passiveSkills: Skill[];
  readOnly?: boolean;
  onUpdate: (field: string, value: any) => void;
}

const ABILITIES: { 
  key: keyof Pick<Character, 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'>; 
  label: string; 
  abilityKey: SkillAbility; 
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
}[] = [
  { key: 'str', label: 'FOR', abilityKey: 'STR', icon: GiMuscleUp },
  { key: 'dex', label: 'DEX', abilityKey: 'DEX', icon: GiRunningNinja },
  { key: 'con', label: 'CON', abilityKey: 'CON', icon: GiShield },
  { key: 'int', label: 'INT', abilityKey: 'INT', icon: GiBrain },
  { key: 'wis', label: 'SAG', abilityKey: 'WIS', icon: GiPrayer },
  { key: 'cha', label: 'CHA', abilityKey: 'CHA', icon: GiChatBubble },
];

function modStr(v: number): string { 
  const m = Math.floor((v - 10) / 2); 
  return m >= 0 ? `+${m}` : `${m}`; 
}

export const AbilitiesGrid: React.FC<AbilitiesGridProps> = ({
  character,
  passiveSkills,
  readOnly = false,
  onUpdate,
}) => {
  // Memoize passive bonuses calculation
  const passiveBonuses = useMemo(() => {
    const bonuses: Record<SkillAbility, { value: number; sources: string }> = {
      STR: { value: 0, sources: '' },
      DEX: { value: 0, sources: '' },
      CON: { value: 0, sources: '' },
      INT: { value: 0, sources: '' },
      WIS: { value: 0, sources: '' },
      CHA: { value: 0, sources: '' },
    };

    for (const skill of passiveSkills) {
      if (skill.stat_bonus_ability && skill.stat_bonus_value !== null) {
        const ab = skill.stat_bonus_ability as SkillAbility;
        bonuses[ab].value += skill.stat_bonus_value;
        const sign = skill.stat_bonus_value >= 0 ? '+' : '';
        const src = `${skill.name} (${sign}${skill.stat_bonus_value})`;
        bonuses[ab].sources = bonuses[ab].sources 
          ? `${bonuses[ab].sources}, ${src}` 
          : src;
      }
    }

    return bonuses;
  }, [passiveSkills]);

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.625rem' }}>
        <GiMuscleUp size={18} style={{ color: 'var(--color-accent)' }} />
        <h3 style={{ fontSize: '1rem' }}>Caractéristiques</h3>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.375rem' }}>
        {ABILITIES.map(({ key, label, abilityKey, icon }) => {
          const baseVal = character[key];
          const bonus = passiveBonuses[abilityKey].value;
          const effectiveVal = baseVal + bonus;

          return (
            <StatBlock
              key={key}
              label={label}
              value={baseVal}
              modifier={modStr(effectiveVal)}
              icon={icon}
              bonus={bonus}
              bonusSource={passiveBonuses[abilityKey].sources}
              readOnly={readOnly}
              onChange={readOnly ? undefined : (val) => onUpdate(key, val)}
            />
          );
        })}
      </div>
    </div>
  );
};