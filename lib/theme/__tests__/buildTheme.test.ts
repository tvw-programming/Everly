import { buildTheme } from '../buildTheme';
import { contrastRatio } from '../color';
import { PRIMARY_SWATCHES, SECONDARY_SWATCHES } from '../accents';
import type { ThemeMode, ThemeStyle } from '../types';
import { DEFAULT_PREFS } from '../types';

const MODES: ThemeMode[] = ['light', 'dark'];
const STYLES: ThemeStyle[] = ['plain', 'gradient', 'glass3d'];

const prefs = (patch: Partial<typeof DEFAULT_PREFS>) => ({ ...DEFAULT_PREFS, ...patch });

describe('buildTheme', () => {
  for (const mode of MODES) {
    for (const primary of PRIMARY_SWATCHES) {
      it(`keeps text on ${primary} readable in ${mode}`, () => {
        const t = buildTheme(prefs({ mode, primary }));
        expect(contrastRatio(t.onAccent, t.accent)).toBeGreaterThanOrEqual(4.5);
      });
    }

    for (const secondary of SECONDARY_SWATCHES) {
      it(`keeps text on secondary ${secondary} readable in ${mode}`, () => {
        const t = buildTheme(prefs({ mode, secondary }));
        expect(contrastRatio(t.onAccentSecondary, t.accentSecondary)).toBeGreaterThanOrEqual(4.5);
      });
    }

    for (const style of STYLES) {
      it(`keeps body text readable on the ${mode} ${style} canvas`, () => {
        const t = buildTheme(prefs({ mode, style }));
        expect(contrastRatio(t.ink, t.canvasColors[0])).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it('only draws orbs for the 3D glass style', () => {
    expect(buildTheme(prefs({ style: 'glass3d' })).orbColors.length).toBeGreaterThan(0);
    expect(buildTheme(prefs({ style: 'gradient' })).orbColors).toEqual([]);
    expect(buildTheme(prefs({ style: 'plain' })).orbColors).toEqual([]);
  });

  it('never tints surface-base in the plain style', () => {
    const plain = buildTheme(prefs({ style: 'plain', mode: 'dark' }));
    expect(new Set(plain.canvasColors).size).toBe(1);
    const gradient = buildTheme(prefs({ style: 'gradient', mode: 'dark' }));
    expect(new Set(gradient.canvasColors).size).toBeGreaterThan(1);
  });

  it('uses opaque card surfaces in the plain style and glass tint otherwise', () => {
    expect(buildTheme(prefs({ style: 'plain', mode: 'dark' })).cardBg).toBe('#1E1E1E');
    expect(buildTheme(prefs({ style: 'gradient', mode: 'dark' })).cardBg).toMatch(/rgba/);
  });

  it('blurs 14px for gradient glass and 18px for 3D, none for plain', () => {
    expect(buildTheme(prefs({ style: 'plain' })).blur).toBe(0);
    expect(buildTheme(prefs({ style: 'gradient' })).blur).toBe(14);
    expect(buildTheme(prefs({ style: 'glass3d' })).blur).toBe(18);
  });

  it('only lights the 3D sheen for the 3D style', () => {
    expect(buildTheme(prefs({ style: 'gradient' })).glassHighlight).toBe('transparent');
    expect(buildTheme(prefs({ style: 'glass3d' })).glassHighlight).not.toBe('transparent');
  });

  it('matches the status bar icons to the header colour', () => {
    expect(buildTheme(prefs({ primary: '#4527A0' })).statusBar).toBe('light');
    expect(buildTheme(prefs({ primary: '#F9A825' })).statusBar).toBe('dark');
  });

  it('reports the colours it was built from', () => {
    const t = buildTheme(prefs({ primary: '#8E2A2A', secondary: '#F9A825' }));
    expect(t.primary).toBe('#8E2A2A');
    expect(t.secondary).toBe('#F9A825');
  });
});
