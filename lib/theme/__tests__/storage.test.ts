import { parsePrefs } from '../prefs';
import { DEFAULT_PREFS } from '../types';

describe('parsePrefs', () => {
  it('defaults when nothing is stored', () => {
    expect(parsePrefs(null, null)).toEqual(DEFAULT_PREFS);
  });

  it('migrates the v1 glass theme id into dark 3D glass', () => {
    expect(parsePrefs(null, 'glass')).toEqual({ ...DEFAULT_PREFS, mode: 'dark', style: 'glass3d' });
  });

  it('migrates the v1 dark theme id into plain dark', () => {
    expect(parsePrefs(null, 'dark')).toEqual({ ...DEFAULT_PREFS, mode: 'dark', style: 'plain' });
  });

  it('defaults on corrupt JSON', () => {
    expect(parsePrefs('{bad json', null)).toEqual(DEFAULT_PREFS);
  });

  it('keeps valid fields and replaces invalid ones', () => {
    expect(
      parsePrefs('{"mode":"neon","style":"plain","primary":"#123456","secondary":"nope"}', null)
    ).toEqual({
      mode: DEFAULT_PREFS.mode,
      style: 'plain',
      primary: '#123456',
      secondary: DEFAULT_PREFS.secondary,
    });
  });

  it('prefers v2 over v1', () => {
    expect(parsePrefs('{"mode":"light","style":"gradient"}', 'glass')).toEqual({
      ...DEFAULT_PREFS,
      mode: 'light',
      style: 'gradient',
    });
  });
});
