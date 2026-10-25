import { createContext, useCallback, useContext, useMemo, useEffect, useState } from 'react';

import type { EverlyTheme } from './buildTheme';
import { buildTheme } from './buildTheme';
import { loadPrefs, savePrefs } from './storage';
import type { ThemeMode, ThemePrefs, ThemeStyle } from './types';
import { DEFAULT_PREFS } from './types';

type ThemeContextValue = {
  prefs: ThemePrefs;
  theme: EverlyTheme;
  setMode: (mode: ThemeMode) => void;
  setStyle: (style: ThemeStyle) => void;
  setPrimary: (hex: string) => void;
  setSecondary: (hex: string) => void;
  resetTheme: () => void;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<ThemePrefs>(DEFAULT_PREFS);
  const [ready, setReady] = useState(false);
  const theme = useMemo(() => buildTheme(prefs), [prefs]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadPrefs();
      if (!cancelled) {
        setPrefs(stored);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback((patch: Partial<ThemePrefs>) => {
    setPrefs((current) => {
      const next = { ...current, ...patch };
      void savePrefs(next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      prefs,
      theme,
      ready,
      setMode: (mode) => update({ mode }),
      setStyle: (style) => update({ style }),
      setPrimary: (primary) => update({ primary }),
      setSecondary: (secondary) => update({ secondary }),
      resetTheme: () => update(DEFAULT_PREFS),
    }),
    [prefs, theme, ready, update]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

const FALLBACK = buildTheme(DEFAULT_PREFS);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      prefs: DEFAULT_PREFS,
      theme: FALLBACK,
      ready: true,
      setMode: () => undefined,
      setStyle: () => undefined,
      setPrimary: () => undefined,
      setSecondary: () => undefined,
      resetTheme: () => undefined,
    };
  }
  return ctx;
}
