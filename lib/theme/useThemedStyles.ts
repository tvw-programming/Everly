import { useMemo } from 'react';

import type { EverlyTheme } from './buildTheme';
import { useTheme } from './ThemeContext';

/** Build a StyleSheet from theme tokens, rebuilt only when the tokens change. */
export function useThemedStyles<T>(factory: (theme: EverlyTheme) => T): T {
  const { theme } = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}
