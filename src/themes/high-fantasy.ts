import type { AppTheme } from './theme.types';
import highFantasyBg from '../img/HighfantasyBg.png';

/**
 * HIGH FANTASY — Light Medieval Theme
 * Parchemin clair, encre sombre, accents bleu royal pour l'exploration, et rouge sang pour le combat.
 * Garde les mêmes polices médiévales mais offre une meilleure lisibilité diurne.
 */
const highFantasy: AppTheme = {
  name: 'high-fantasy',
  displayName: 'Haute Fantasy',
  description: 'Parchemin lumineux, encre de chine et enluminures — ambiance guilde et bibliothèque.',

  colors: {
    // Fonds clairs (parchemin)
    background: '#f4ecd8',
    backgroundAlt: '#e8dec3',
    surface: '#fdfbf7',
    surfaceHover: '#f0e5cc',
    
    // Bordures encre/cuir
    border: '#8c7355',
    borderAccent: '#c5a059', // Or vieilli

    // Texte sombre pour le contraste (encre)
    textPrimary: '#2c241b',
    textSecondary: '#594a3d',
    textMuted: '#8b7765',
    textInverse: '#fdfbf7',

    // Accentuation (Bleu royal classique pour la noblesse/magie)
    accent: '#2952a3',
    accentHover: '#1c3a75',
    accentText: '#ffffff',

    // Sémantique (légèrement ajustée pour la lisibilité sur fond clair)
    hp: '#c0392b',
    hpBackground: '#fadbd8',
    damage: '#e74c3c',
    healing: '#219653',
    xp: '#d68910',
    armorClass: '#5d6d7e', // Acier plus clair
    mana: '#2980b9',

    // Statuts
    success: '#27ae60',
    warning: '#d68910',
    error: '#c0392b',
    info: '#2980b9',

    // Initiative
    initiativeActive: '#c5a059',
    initiativeBg: '#fdfbf7',
    yourTurn: '#2952a3',

    // Participants
    playerColor: '#2980b9',
    monsterColor: '#c0392b',
    npcColor: '#27ae60',

    // Badges
    hiddenBadge: '#d5c3aa',
    hiddenBadgeText: '#594a3d',
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
    // Ombres plus douces adaptées aux fonds clairs
    cardShadow: '0 2px 8px rgba(44, 36, 27, 0.12)',
    cardShadowHover: '0 4px 16px rgba(44, 36, 27, 0.2)',
    glowAccent: '0 0 12px rgba(41, 82, 163, 0.3)',
    transition: 'all 0.2s ease',
    transitionSlow: 'all 0.6s ease',
  },

  textures: {
    // Image + voile léger pour conserver la lisibilité
    backgroundImage: `linear-gradient(rgba(244, 236, 216, 0.45), rgba(232, 222, 195, 0.65)), url(${highFantasyBg})`,
    surfaceImage: 'linear-gradient(135deg, rgba(197,160,89,0.05) 0%, transparent 50%)',
  },

  combatOverrides: {
    colors: {
      // Tons plus froids, poussiéreux et dramatiques pour le combat
      background: '#dcd2c6',
      backgroundAlt: '#cfc4b6',
      surface: '#ece5dc',
      surfaceHover: '#dfd6c9',
      border: '#7a6a5a',
      borderAccent: '#8b0000', // Bordures couleur sang
      accent: '#a12b2b',
      accentHover: '#7a1f1f',
      accentText: '#ffffff',
      initiativeActive: '#a12b2b',
      yourTurn: '#c5a059',
    },
    textures: {
      backgroundImage: `linear-gradient(rgba(220, 210, 198, 0.5), rgba(196, 185, 170, 0.7)), url(${highFantasyBg})`,
    },
  },

  explorationOverrides: {
    colors: {},
  },
};

export default highFantasy;
