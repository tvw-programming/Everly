import { mix, pickOnColor } from './color';
import type { ThemeMode } from './types';

/**
 * Material 3 colour roles for one source colour.
 *
 * True MD3 derives these from HCT tonal palettes. We approximate with
 * luminance mixing, which keeps the roles in the right relative order
 * without pulling in a native colour-science dependency.
 */
export type ColorRoles = {
  base: string;
  on: string;
  container: string;
  onContainer: string;
};

export function roles(source: string, mode: ThemeMode): ColorRoles {
  const base = mode === 'light' ? source : mix(source, '#FFFFFF', 0.3);
  const container = mode === 'light' ? mix(source, '#FFFFFF', 0.82) : mix(source, '#000000', 0.62);
  return {
    base,
    on: pickOnColor(base),
    container,
    onContainer: pickOnColor(container),
  };
}
