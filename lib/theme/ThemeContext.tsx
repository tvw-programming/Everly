import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { loadThemeId, saveThemeId } from './storage';
import { themes } from './themes';
import type { ThemeId, ThemeTokens } from './types';

type ThemeContextValue = {
  themeId: ThemeId;
  theme: ThemeTokens;
  setThemeId: (id: ThemeId) => void;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const id = await loadThemeId();
      if (!cancelled) {
        setThemeIdState(id);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id);
    void saveThemeId(id);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeId,
      theme: themes[themeId],
      setThemeId,
      ready,
    }),
    [themeId, setThemeId, ready]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      themeId: 'light',
      theme: themes.light,
      setThemeId: () => undefined,
      ready: true,
    };
  }
  return ctx;
}
