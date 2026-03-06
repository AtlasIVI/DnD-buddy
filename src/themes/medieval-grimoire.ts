import type { AppTheme } from './theme.types';
import medievalGrimoireBg from '../img/MedievalGrimoireBg.png';

/**
 * MEDIEVAL GRIMOIRE — Default theme
 * Dark parchment, ornate gold borders, warm tones for exploration, cold steel for combat.
 * Fonts: MedievalSharp for display, Crimson Text for body, Fira Code for stats.
 */
const medievalGrimoire: AppTheme = {
  name: 'medieval-grimoire',
  displayName: 'Grimoire Médiéval',
  description: 'Parchemin sombre, dorures, bordures ornées — ambiance donjon et taverne.',

  colors: {
    background: '#1a1410',
    backgroundAlt: '#231e17',
    surface: '#2a2318',
    surfaceHover: '#342c1f',
    border: '#4a3f2f',
    borderAccent: '#c9a84c',

    textPrimary: '#e8dcc8',
    textSecondary: '#b8a88a',
    textMuted: '#7a6e5a',
    textInverse: '#1a1410',

    accent: '#c9a84c',
    accentHover: '#d4b85e',
    accentText: '#1a1410',

    hp: '#c0392b',
    hpBackground: '#3d1a16',
    damage: '#e74c3c',
    healing: '#27ae60',
    xp: '#f39c12',
    armorClass: '#7f8c8d',
    mana: '#3498db',

    success: '#27ae60',
    warning: '#f39c12',
    error: '#e74c3c',
    info: '#3498db',

    initiativeActive: '#c9a84c',
    initiativeBg: '#2a2318',
    yourTurn: '#c9a84c',

    playerColor: '#3498db',
    monsterColor: '#e74c3c',
    npcColor: '#27ae60',

    hiddenBadge: '#4a3f2f',
    hiddenBadgeText: '#7a6e5a',
  },

  typography: {
    fontDisplay: "'MedievalSharp', 'Cinzel', serif",
    fontBody: "'Crimson Text', 'Georgia', serif",
    fontMono: "'Fira Code', 'Courier New', monospace",
  },

  spacing: {
    cardPadding: '1rem',
    cardRadius: '0.5rem',
    cardBorderWidth: '2px',
    buttonRadius: '0.375rem',
    inputRadius: '0.375rem',
  },

  effects: {
    cardShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
    cardShadowHover: '0 4px 16px rgba(0, 0, 0, 0.6)',
    glowAccent: '0 0 12px rgba(201, 168, 76, 0.3)',
    transition: 'all 0.2s ease',
    transitionSlow: 'all 0.6s ease',
  },

  textures: {
    backgroundImage: `linear-gradient(rgba(26, 20, 16, 0.45), rgba(26, 20, 16, 0.65)), url(${medievalGrimoireBg})`,
    surfaceImage: 'linear-gradient(135deg, rgba(201,168,76,0.03) 0%, transparent 50%)',
  },

  combatOverrides: {
    colors: {
      background: '#12101a',
      backgroundAlt: '#1a1725',
      surface: '#201c2e',
      surfaceHover: '#2a2540',
      border: '#3a3450',
      borderAccent: '#8b4545',
      accent: '#c0392b',
      accentHover: '#d44637',
      accentText: '#ffffff',
      initiativeActive: '#e74c3c',
      yourTurn: '#f39c12',
    },
    textures: {
      backgroundImage: `linear-gradient(rgba(18, 16, 26, 0.5), rgba(139, 69, 69, 0.35)), url(${medievalGrimoireBg})`,
    },
  },

  explorationOverrides: {
    colors: {},
  },
};

export default medievalGrimoire;
