import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';

import { CATEGORY_KEYS, categoryColors } from './categories';
import { ensureReadableFill, mix, pickOnColor, withAlpha } from './color';
import { GLASS, GLASS_BLUR, INK, RADIUS, STATUS, SURFACE } from './tokens';
import { roles } from './tones';
import type { ThemePrefs, ThemeTokens } from './types';
import { STYLE_LABELS } from './types';

export type EverlyTheme = ThemeTokens & { paper: MD3Theme };

export function buildTheme(prefs: ThemePrefs): EverlyTheme {
  const { mode, style, primary, secondary } = prefs;
  const light = mode === 'light';
  const glassy = style !== 'plain';

  const surfaces = SURFACE[mode];
  const inks = INK[mode];
  const status = STATUS[mode];
  const glass = GLASS[mode];

  const accent = ensureReadableFill(roles(primary, mode).base);
  const accentSecondary = ensureReadableFill(roles(secondary, mode).base);
  const p = { ...roles(primary, mode), base: accent, on: pickOnColor(accent) };
  const s = { ...roles(secondary, mode), base: accentSecondary, on: pickOnColor(accentSecondary) };

  // Glass never applies to surface-base, so the canvas stays a plain surface and
  // only picks up a brand wash in the gradient styles.
  const canvasColors: [string, string, ...string[]] = !glassy
    ? [surfaces.base, surfaces.base]
    : [
        mix(primary, surfaces.base, light ? 0.94 : 0.9),
        surfaces.base,
        mix(secondary, surfaces.base, light ? 0.95 : 0.91),
      ];

  const paper: MD3Theme = {
    ...(light ? MD3LightTheme : MD3DarkTheme),
    roundness: RADIUS.sm,
    colors: {
      ...(light ? MD3LightTheme : MD3DarkTheme).colors,
      primary: p.base,
      onPrimary: p.on,
      primaryContainer: p.container,
      onPrimaryContainer: p.onContainer,
      secondary: s.base,
      onSecondary: s.on,
      secondaryContainer: s.container,
      onSecondaryContainer: s.onContainer,
      tertiary: s.base,
      onTertiary: s.on,
      tertiaryContainer: s.container,
      onTertiaryContainer: s.onContainer,
      error: status.error,
      errorContainer: status.errorBg,
      background: surfaces.base,
      onBackground: inks.primary,
      surface: surfaces.raised,
      onSurface: inks.primary,
      surfaceVariant: surfaces.hover,
      onSurfaceVariant: inks.secondary,
      onSurfaceDisabled: inks.disabled,
      outline: light ? 'rgba(0,0,0,0.23)' : 'rgba(255,255,255,0.23)',
      outlineVariant: light ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)',
      inversePrimary: mix(p.base, light ? '#FFFFFF' : '#000000', 0.4),
      elevation: {
        ...(light ? MD3LightTheme : MD3DarkTheme).colors.elevation,
        level0: 'transparent',
        level1: surfaces.raised,
        level2: surfaces.overlay,
      },
    },
  };

  return {
    paper,
    mode,
    style,
    label: STYLE_LABELS[style],
    surfaces,
    inks,
    status,
    glass,
    categories: Object.fromEntries(
      CATEGORY_KEYS.map((key) => [key, categoryColors(key, mode)])
    ) as EverlyTheme['categories'],
    blur: style === 'plain' ? 0 : GLASS_BLUR[style],
    primary,
    secondary,
    primaryRole: p,
    secondaryRole: s,
    canvas: surfaces.base,
    canvasColors,
    stage: light ? '#E8E8ED' : '#0A0A0A',
    // surface-raised and above; glass tints these, never the canvas
    surface: glassy ? glass.tint : surfaces.raised,
    surfaceElevated: glassy ? glass.tint : surfaces.overlay,
    ink: inks.primary,
    muted: inks.secondary,
    inverseSurface: light ? '#303030' : '#E6E6E6',
    onInverseSurface: light ? '#FFFFFF' : '#121212',
    onInverseMuted: light ? 'rgba(255,255,255,0.70)' : 'rgba(0,0,0,0.60)',
    soft: surfaces.hover,
    border: light ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)',
    accent,
    accentDark: mix(accent, '#000000', 0.25),
    onAccent: p.on,
    accentSecondary,
    onAccentSecondary: s.on,
    danger: status.error,
    headerColors: [accent, style === 'plain' ? accent : accentSecondary],
    headerText: p.on,
    headerSub: withAlpha(p.on, 0.88),
    navBg: glassy ? glass.tint : surfaces.raised,
    cardBg: glassy ? glass.tint : surfaces.raised,
    cardBorder: glassy ? glass.border : light ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)',
    glassBorder: glass.border,
    glassHighlight: style === 'glass3d' ? glass.sheen : 'transparent',
    shadow: light ? 'rgba(0,0,0,0.20)' : 'rgba(0,0,0,0.60)',
    orbColors:
      style === 'glass3d'
        ? [
            withAlpha(accent, light ? 0.22 : 0.34),
            withAlpha(accentSecondary, light ? 0.18 : 0.28),
            withAlpha(mix(accent, accentSecondary, 0.5), light ? 0.16 : 0.24),
          ]
        : [],
    glassTint: mode,
    statusBar: pickOnColor(accent) === '#FFFFFF' ? 'light' : 'dark',
  };
}
