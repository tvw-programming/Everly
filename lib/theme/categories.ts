import type { ThemeMode } from './types';

export type CategoryKey = 'personal' | 'social' | 'professional' | 'financial';

export const CATEGORY_KEYS: CategoryKey[] = ['personal', 'social', 'professional', 'financial'];

export type CategoryColors = {
  /** Line, dot and label colour */
  accent: string;
  /** Tinted fill behind content in this category */
  container: string;
};

/**
 * Category identity, per mode. Personal reads warm and individual, Social
 * friendly and connected, Professional trustworthy and neutral, Financial
 * growth and positive status.
 *
 * The four hues are spread around the wheel — red, magenta, blue, green — so
 * no two categories can be mistaken for each other at a glance.
 */
const CATEGORY_COLORS: Record<CategoryKey, Record<ThemeMode, CategoryColors>> = {
  personal: {
    light: { accent: '#DC2626', container: '#FEE2E2' },
    dark: { accent: '#FCA5A5', container: '#450A0A' },
  },
  social: {
    light: { accent: '#C026D3', container: '#FAE8FF' },
    dark: { accent: '#F0ABFC', container: '#4A044E' },
  },
  professional: {
    light: { accent: '#2563EB', container: '#DBEAFE' },
    dark: { accent: '#93C5FD', container: '#172554' },
  },
  financial: {
    light: { accent: '#16A34A', container: '#DCFCE7' },
    dark: { accent: '#86EFAC', container: '#052E16' },
  },
};

/** The manifestation deck calls its money pillar "economical". */
const ALIASES: Record<string, CategoryKey> = { economical: 'financial', money: 'financial' };

export function toCategoryKey(value: string): CategoryKey {
  if (CATEGORY_KEYS.includes(value as CategoryKey)) return value as CategoryKey;
  return ALIASES[value] ?? 'personal';
}

export function categoryColors(category: string, mode: ThemeMode): CategoryColors {
  return CATEGORY_COLORS[toCategoryKey(category)][mode];
}

/** Accent only — for call sites that just need the line colour. */
export function categoryAccentFor(category: string, mode: ThemeMode): string {
  return categoryColors(category, mode).accent;
}
