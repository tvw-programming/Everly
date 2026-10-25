import type { ThemeMode } from './types';

/**
 * Design-system tokens. Names mirror the spec's intent groups
 * (surface / ink / brand / status / glass) so a screen can be read
 * against the system without translating.
 */

export type SurfaceTokens = {
  base: string;
  raised: string;
  overlay: string;
  hover: string;
};

export type InkTokens = {
  primary: string;
  secondary: string;
  disabled: string;
};

export type StatusTokens = {
  info: string;
  infoBg: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  error: string;
  errorBg: string;
};

export type GlassTokens = {
  tint: string;
  border: string;
  sheen: string;
};

export const SURFACE: Record<ThemeMode, SurfaceTokens> = {
  light: {
    base: '#FFFFFF',
    raised: '#FAFAFA',
    overlay: '#FFFFFF',
    hover: 'rgba(0,0,0,0.04)',
  },
  dark: {
    base: '#121212',
    raised: '#1E1E1E',
    overlay: '#242424',
    hover: 'rgba(255,255,255,0.08)',
  },
};

export const INK: Record<ThemeMode, InkTokens> = {
  light: {
    primary: 'rgba(0,0,0,0.87)',
    secondary: 'rgba(0,0,0,0.60)',
    disabled: 'rgba(0,0,0,0.38)',
  },
  dark: {
    primary: 'rgba(255,255,255,0.92)',
    secondary: 'rgba(255,255,255,0.70)',
    disabled: 'rgba(255,255,255,0.50)',
  },
};

export const STATUS: Record<ThemeMode, StatusTokens> = {
  light: {
    info: '#0288D1',
    infoBg: '#E5F6FD',
    success: '#2E7D32',
    successBg: '#EDF7ED',
    warning: '#ED6C02',
    warningBg: '#FFF4E5',
    error: '#D32F2F',
    errorBg: '#FDEDED',
  },
  dark: {
    info: '#29B6F6',
    infoBg: '#071318',
    success: '#66BB6A',
    successBg: '#0C130D',
    warning: '#FFA726',
    warningBg: '#191207',
    error: '#F44336',
    errorBg: '#160B0B',
  },
};

export const GLASS: Record<ThemeMode, GlassTokens> = {
  light: {
    tint: 'rgba(255,255,255,0.62)',
    border: 'rgba(255,255,255,0.72)',
    sheen: 'rgba(255,255,255,0.85)',
  },
  dark: {
    tint: 'rgba(30,30,30,0.62)',
    border: 'rgba(255,255,255,0.18)',
    sheen: 'rgba(255,255,255,0.22)',
  },
};

/** Brand defaults per mode — dark shifts to the deep indigo + amber pair. */
export const BRAND_DEFAULTS: Record<ThemeMode, { primary: string; secondary: string }> = {
  light: { primary: '#1976D2', secondary: '#DC004E' },
  dark: { primary: '#4527A0', secondary: '#F9A825' },
};

/** 8-pixel grid. */
export const SPACE = {
  half: 4,
  1: 8,
  2: 16,
  3: 24,
  4: 32,
  5: 40,
  6: 48,
} as const;

export const RADIUS = {
  /** Buttons, inputs, inline code */
  sm: 4,
  /** Cards, alerts, dialogs */
  md: 8,
  /** Theme settings only */
  lg: 16,
  pill: 999,
} as const;

/**
 * Neutral card fill for reference rows (the Settings category legend), where
 * the category hue belongs on the border and dot rather than the whole card.
 */
export const LEGEND_SURFACE: Record<ThemeMode, string> = {
  light: '#F0F0FC',
  dark: '#222222',
};

/** Blur strength per glass style, per the spec's 14 / 18 px backdrop filters. */
export const GLASS_BLUR = { gradient: 14, glass3d: 18 } as const;
