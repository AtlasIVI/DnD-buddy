import type { AppTheme, ThemeColors, ThemeTextures } from './theme.types';
import type { Enums } from '../types/database';

/**
 * Generates CSS custom properties from a theme + current campaign mode.
 * Call this whenever the theme or mode changes, and inject into :root.
 */
export function generateCSSVariables(
  theme: AppTheme,
  mode: Enums<'campaign_mode'> = 'exploration'
): Record<string, string> {
  const overrides = mode === 'combat' ? theme.combatOverrides : theme.explorationOverrides;

  const colors: ThemeColors = { ...theme.colors, ...overrides.colors };
  const textures: ThemeTextures = { ...theme.textures, ...overrides.textures };

  const vars: Record<string, string> = {};

  // Colors
  for (const [key, value] of Object.entries(colors)) {
    const cssKey = `--color-${camelToKebab(key)}`;
    vars[cssKey] = value;
  }

  // Typography
  vars['--font-display'] = theme.typography.fontDisplay;
  vars['--font-body'] = theme.typography.fontBody;
  vars['--font-mono'] = theme.typography.fontMono;

  // Spacing
  vars['--card-padding'] = theme.spacing.cardPadding;
  vars['--card-radius'] = theme.spacing.cardRadius;
  vars['--card-border-width'] = theme.spacing.cardBorderWidth;
  vars['--button-radius'] = theme.spacing.buttonRadius;
  vars['--input-radius'] = theme.spacing.inputRadius;

  // Effects
  vars['--card-shadow'] = theme.effects.cardShadow;
  vars['--card-shadow-hover'] = theme.effects.cardShadowHover;
  vars['--glow-accent'] = theme.effects.glowAccent;
  vars['--transition'] = theme.effects.transition;
  vars['--transition-slow'] = theme.effects.transitionSlow;

  // Textures
  if (textures.backgroundImage) vars['--bg-image'] = textures.backgroundImage;
  if (textures.surfaceImage) vars['--surface-image'] = textures.surfaceImage;
  if (textures.borderImage) vars['--border-image'] = textures.borderImage;

  return vars;
}

/**
 * Apply CSS variables to an HTML element (typically document.documentElement).
 */
export function applyThemeToElement(
  element: HTMLElement,
  theme: AppTheme,
  mode: Enums<'campaign_mode'> = 'exploration'
): void {
  const vars = generateCSSVariables(theme, mode);
  for (const [key, value] of Object.entries(vars)) {
    element.style.setProperty(key, value);
  }
}

function camelToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
