/** Executive dashboard palette — white canvas, ink type, neon-adjacent category accents (no purple). */
const ink = '#1C1C1E';
const muted = '#8E8E93';
const soft = '#F2F2F7';
const white = '#FFFFFF';
const accent = '#0EA5A8';
const accentDark = '#0B7C7E';

export const palette = {
  ink,
  muted,
  soft,
  white,
  accent,
  accentDark,
  danger: '#FF3B30',
  border: '#E5E5EA',
  card: white,
  shadow: 'rgba(28, 28, 30, 0.10)',
  personal: '#FF5A5F',
  social: '#2F80ED',
  professional: '#F5A623',
  // legacy aliases
  health: '#FF5A5F',
  daily: '#F5A623',
  communication: '#2F80ED',
  teal: accent,
  tealDark: accentDark,
  mist: soft,
  paper: white,
};

export const categoryAccent = {
  personal: palette.personal,
  social: palette.social,
  professional: palette.professional,
} as const;

export default {
  light: {
    text: ink,
    background: white,
    tint: accent,
    tabIconDefault: '#C7C7CC',
    tabIconSelected: accent,
  },
  dark: {
    text: '#F5F5F7',
    background: '#0F0F10',
    tint: '#5EEAD4',
    tabIconDefault: '#636366',
    tabIconSelected: '#5EEAD4',
  },
};
