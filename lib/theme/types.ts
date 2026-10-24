export type ThemeId = 'light' | 'dark' | 'glass';

export type ThemeTokens = {
  id: ThemeId;
  label: string;
  /** Root canvas behind content */
  canvas: string;
  /** Phone shell / stage outside the device frame */
  stage: string;
  surface: string;
  surfaceElevated: string;
  ink: string;
  muted: string;
  soft: string;
  border: string;
  accent: string;
  accentDark: string;
  onAccent: string;
  danger: string;
  headerBg: string;
  headerText: string;
  headerSub: string;
  navBg: string;
  cardBg: string;
  cardBorder: string;
  glassBorder: string;
  shadow: string;
  /** Optional CSS gradient for web glass / dark washes */
  canvasGradient?: string;
  /** Frosted panel opacity styling */
  blur?: boolean;
  mode: 'light' | 'dark';
};

export const THEME_IDS: ThemeId[] = ['light', 'dark', 'glass'];
