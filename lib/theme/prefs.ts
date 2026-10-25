import type { ThemePrefs } from './types';
import { DEFAULT_PREFS, isHexColor, isThemeMode, isThemeStyle } from './types';

/** v1 stored a bare theme id; map each onto the mode + style model. */
const V1_MAP: Record<string, Pick<ThemePrefs, 'mode' | 'style'>> = {
  light: { mode: 'light', style: 'plain' },
  dark: { mode: 'dark', style: 'plain' },
  glass: { mode: 'dark', style: 'glass3d' },
};

/** Resolve stored preferences, tolerating corruption and the v1 format. */
export function parsePrefs(v2Raw: string | null, v1Raw: string | null): ThemePrefs {
  if (v2Raw) {
    try {
      const parsed = JSON.parse(v2Raw) as Partial<ThemePrefs>;
      return {
        mode: isThemeMode(parsed?.mode) ? parsed.mode : DEFAULT_PREFS.mode,
        style: isThemeStyle(parsed?.style) ? parsed.style : DEFAULT_PREFS.style,
        primary: isHexColor(parsed?.primary) ? parsed.primary : DEFAULT_PREFS.primary,
        secondary: isHexColor(parsed?.secondary) ? parsed.secondary : DEFAULT_PREFS.secondary,
      };
    } catch {
      return DEFAULT_PREFS;
    }
  }

  const legacy = v1Raw ? V1_MAP[v1Raw] : undefined;
  return legacy ? { ...DEFAULT_PREFS, ...legacy } : DEFAULT_PREFS;
}
