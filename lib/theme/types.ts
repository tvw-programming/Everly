import type { CategoryColors, CategoryKey } from './categories';
import type { ColorRoles } from './tones';
import type { GlassTokens, InkTokens, StatusTokens, SurfaceTokens } from './tokens';

/** Light / dark palette, chosen in Settings. */
export type ThemeMode = 'light' | 'dark';

/** How surfaces are rendered: flat, gradient-tinted glass, or layered 3D glass. */
export type ThemeStyle = 'plain' | 'gradient' | 'glass3d';

export type ThemePrefs = {
  mode: ThemeMode;
  style: ThemeStyle;
  /** Primary brand colour (hex) — headers, active states, FAB */
  primary: string;
  /** Secondary colour (hex) — gradient partner, orbs, highlights */
  secondary: string;
};

export const THEME_MODES: ThemeMode[] = ['light', 'dark'];
export const THEME_STYLES: ThemeStyle[] = ['plain', 'gradient', 'glass3d'];

export const STYLE_LABELS: Record<ThemeStyle, string> = {
  plain: 'Plain',
  gradient: 'Gradient glass',
  glass3d: '3D Gradient Glass',
};

/** Light + Plain + MUI blue/pink are the shipped defaults. */
export const DEFAULT_PREFS: ThemePrefs = {
  mode: 'light',
  style: 'plain',
  primary: '#1976D2',
  secondary: '#DC004E',
};

export type ThemeTokens = {
  mode: ThemeMode;
  style: ThemeStyle;
  label: string;
  /** Root canvas behind content */
  surfaces: SurfaceTokens;
  inks: InkTokens;
  status: StatusTokens;
  glass: GlassTokens;
  /** Per-category accent + container for this mode */
  categories: Record<CategoryKey, CategoryColors>;
  /** Backdrop blur strength for this style (0 when plain) */
  blur: number;
  canvas: string;
  /** Phone shell / stage outside the device frame */
  stage: string;
  surface: string;
  surfaceElevated: string;
  ink: string;
  muted: string;
  /** Contrast panel: dark fill in light mode, light fill in dark mode */
  inverseSurface: string;
  onInverseSurface: string;
  onInverseMuted: string;
  soft: string;
  border: string;
  primary: string;
  secondary: string;
  /** Material colour roles derived from each source colour */
  primaryRole: ColorRoles;
  secondaryRole: ColorRoles;
  /** Primary, adjusted for this mode so `onPrimary` stays readable */
  accent: string;
  accentDark: string;
  onAccent: string;
  /** Secondary, adjusted the same way */
  accentSecondary: string;
  onAccentSecondary: string;
  danger: string;
  headerText: string;
  headerSub: string;
  navBg: string;
  cardBg: string;
  cardBorder: string;
  glassBorder: string;
  /** Top highlight line that gives 3D glass its lit edge */
  glassHighlight: string;
  shadow: string;
  /** Gradient stops for the full-bleed canvas (first stop doubles as the solid colour) */
  canvasColors: [string, string, ...string[]];
  /** Gradient stops for headers and accent chrome */
  headerColors: [string, string];
  /** Soft background orbs — empty unless the 3D glass style is active */
  orbColors: string[];
  /** Which system glass/blur palette to request */
  glassTint: 'light' | 'dark';
  /** Status bar icon colour over this theme's header */
  statusBar: 'light' | 'dark';
};

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && (THEME_MODES as string[]).includes(value);
}

export function isThemeStyle(value: unknown): value is ThemeStyle {
  return typeof value === 'string' && (THEME_STYLES as string[]).includes(value);
}

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
}
