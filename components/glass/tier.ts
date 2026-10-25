import type { ThemeStyle } from '@/lib/theme/types';

/**
 * How a glass surface is actually drawn on this device:
 * native Liquid Glass, a system blur, a painted gradient, or an opaque fill.
 */
export type GlassTier = 'liquid' | 'blur' | 'gradient' | 'solid';

export function pickGlassTier(opts: {
  os: string;
  liquidAvailable: boolean;
  reduceTransparency: boolean;
  style: ThemeStyle;
}): GlassTier {
  if (opts.style === 'plain' || opts.reduceTransparency) return 'solid';
  if (opts.os === 'ios') return opts.liquidAvailable ? 'liquid' : 'blur';
  return 'gradient';
}
