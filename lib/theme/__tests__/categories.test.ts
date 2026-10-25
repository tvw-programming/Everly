import { CATEGORY_KEYS, categoryColors } from '../categories';
import { buildTheme } from '../buildTheme';
import { DEFAULT_PREFS } from '../types';
import { contrastRatio, hueDistance } from '../color';
import { INK, LEGEND_SURFACE } from '../tokens';
import type { ThemeMode } from '../types';

const MODES: ThemeMode[] = ['light', 'dark'];

describe('categoryColors', () => {
  it('uses the specified accent for each category in light mode', () => {
    expect(categoryColors('personal', 'light').accent).toBe('#DC2626');
    expect(categoryColors('social', 'light').accent).toBe('#C026D3');
    expect(categoryColors('professional', 'light').accent).toBe('#2563EB');
    expect(categoryColors('financial', 'light').accent).toBe('#16A34A');
  });

  it('uses the specified accent for each category in dark mode', () => {
    expect(categoryColors('personal', 'dark').accent).toBe('#FCA5A5');
    expect(categoryColors('social', 'dark').accent).toBe('#F0ABFC');
    expect(categoryColors('professional', 'dark').accent).toBe('#93C5FD');
    expect(categoryColors('financial', 'dark').accent).toBe('#86EFAC');
  });

  it('keeps body text readable on every container', () => {
    for (const mode of MODES) {
      for (const key of CATEGORY_KEYS) {
        const { container } = categoryColors(key, mode);
        expect(contrastRatio(INK[mode].primary, container)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('gives each category a distinct accent within a mode', () => {
    for (const mode of MODES) {
      const accents = CATEGORY_KEYS.map((k) => categoryColors(k, mode).accent);
      expect(new Set(accents).size).toBe(CATEGORY_KEYS.length);
    }
  });

  it('treats the economical pillar as financial', () => {
    expect(categoryColors('economical', 'light').accent).toBe('#16A34A');
  });
});

describe('theme.categories', () => {
  it('carries every category for the active mode', () => {
    for (const mode of MODES) {
      const theme = buildTheme({ ...DEFAULT_PREFS, mode });
      for (const key of CATEGORY_KEYS) {
        expect(theme.categories[key]).toEqual(categoryColors(key, mode));
      }
    }
  });
});

describe('legend surface', () => {
  it('keeps row text readable on the neutral card fill', () => {
    for (const mode of MODES) {
      expect(contrastRatio(INK[mode].primary, LEGEND_SURFACE[mode])).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe('category hues', () => {
  it('keeps every pair of categories at least 40 degrees apart in hue', () => {
    for (const mode of MODES) {
      for (let i = 0; i < CATEGORY_KEYS.length; i++) {
        for (let j = i + 1; j < CATEGORY_KEYS.length; j++) {
          const a = categoryColors(CATEGORY_KEYS[i], mode).accent;
          const b = categoryColors(CATEGORY_KEYS[j], mode).accent;
          expect({
            pair: `${CATEGORY_KEYS[i]} vs ${CATEGORY_KEYS[j]} (${mode})`,
            apart: Math.round(hueDistance(a, b)),
          }).toEqual({
            pair: `${CATEGORY_KEYS[i]} vs ${CATEGORY_KEYS[j]} (${mode})`,
            apart: expect.any(Number),
          });
          expect(hueDistance(a, b)).toBeGreaterThanOrEqual(60);
        }
      }
    }
  });
});
