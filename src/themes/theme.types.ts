/**
 * Theme Type Definitions
 * Every theme file must export an object conforming to AppTheme.
 * To create a new theme: copy an existing theme file, rename it, and adjust values.
 * Then register it in theme-registry.ts.
 */

export interface ThemeColors {
  // Base
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceHover: string;
  border: string;
  borderAccent: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Brand / Accent
  accent: string;
  accentHover: string;
  accentText: string;

  // Semantic
  hp: string;
  hpBackground: string;
  damage: string;
  healing: string;
  xp: string;
  armorClass: string;
  mana: string;

  // Status
  success: string;
  warning: string;
  error: string;
  info: string;

  // Combat specific
  initiativeActive: string;
  initiativeBg: string;
  yourTurn: string;

  // Participant types
  playerColor: string;
  monsterColor: string;
  npcColor: string;

  // Hidden elements
  hiddenBadge: string;
  hiddenBadgeText: string;
}

export interface ThemeTypography {
  fontDisplay: string; // For titles, headers (medieval / thematic)
  fontBody: string; // For body text (readable)
  fontMono: string; // For numbers, stats
}

export interface ThemeSpacing {
  cardPadding: string;
  cardRadius: string;
  cardBorderWidth: string;
  buttonRadius: string;
  inputRadius: string;
}

export interface ThemeEffects {
  cardShadow: string;
  cardShadowHover: string;
  glowAccent: string;
  transition: string;
  transitionSlow: string;
}

export interface ThemeTextures {
  backgroundImage?: string; // CSS background-image for body
  surfaceImage?: string; // CSS background-image for cards
  borderImage?: string; // CSS border-image for ornate borders
}

export interface ThemeModeOverrides {
  colors: Partial<ThemeColors>;
  textures?: Partial<ThemeTextures>;
}

export interface AppTheme {
  name: string;
  displayName: string;
  description: string;

  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  effects: ThemeEffects;
  textures: ThemeTextures;

  // Mode-specific overrides (combat vs exploration)
  combatOverrides: ThemeModeOverrides;
  explorationOverrides: ThemeModeOverrides;
}
