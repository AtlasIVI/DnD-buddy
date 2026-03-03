import type { AppTheme } from './theme.types';
import medievalGrimoire from './medieval-grimoire';

/**
 * Theme Registry
 * To add a new theme:
 * 1. Create a new file in /themes/ following the AppTheme interface
 * 2. Import it here
 * 3. Add it to the registry
 */
export const themeRegistry: Record<string, AppTheme> = {
  'medieval-grimoire': medievalGrimoire,
  // Future themes:
  // 'dark-arcane': darkArcane,
  // 'high-fantasy': highFantasy,
  // 'cyberpunk-quest': cyberpunkQuest,
};

export const defaultThemeName = 'medieval-grimoire';

export function getTheme(name: string): AppTheme {
  return themeRegistry[name] ?? themeRegistry[defaultThemeName];
}

export function getAvailableThemes(): Array<{ name: string; displayName: string; description: string }> {
  return Object.values(themeRegistry).map((t) => ({
    name: t.name,
    displayName: t.displayName,
    description: t.description,
  }));
}
