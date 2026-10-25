export type Rgb = [number, number, number];

/** Parse #rgb, #rrggbb or rgba(r,g,b,a) into channels plus alpha. */
export function parseColor(value: string): { rgb: Rgb; alpha: number } {
  const rgba = value.match(/rgba?\(([^)]+)\)/i);
  if (rgba) {
    const parts = rgba[1].split(',').map((v) => parseFloat(v.trim()));
    return { rgb: [parts[0], parts[1], parts[2]] as Rgb, alpha: parts[3] ?? 1 };
  }
  return { rgb: parseHex(value), alpha: 1 };
}

/** Composite a possibly-translucent colour over an opaque backdrop. */
export function flatten(color: string, backdrop: string): string {
  const { rgb, alpha } = parseColor(color);
  if (alpha >= 1) return toHex(rgb);
  const base = parseColor(backdrop).rgb;
  return toHex([0, 1, 2].map((i) => rgb[i] * alpha + base[i] * (1 - alpha)) as Rgb);
}

export function parseHex(hex: string): Rgb {
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function toHex([r, g, b]: Rgb): string {
  const part = (v: number) =>
    Math.round(Math.min(255, Math.max(0, v)))
      .toString(16)
      .padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`.toUpperCase();
}

/** Linear blend: t=0 → a, t=1 → b */
export function mix(a: string, b: string, t: number): string {
  const ca = parseHex(a);
  const cb = parseHex(b);
  return toHex([0, 1, 2].map((i) => ca[i] + (cb[i] - ca[i]) * t) as Rgb);
}

export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** WCAG 2.x relative luminance */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const bg = flatten(b, '#FFFFFF');
  const la = relativeLuminance(flatten(a, bg));
  const lb = relativeLuminance(bg);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Text colour for a filled background — whichever of the two reads better */
export function pickOnColor(bg: string, light = '#FFFFFF', dark = '#0B1220'): string {
  return contrastRatio(light, bg) >= contrastRatio(dark, bg) ? light : dark;
}

/**
 * Nudge a fill toward black or white in small steps until its own best text
 * colour clears `target`. Preset hues that sit just under AA (indigo against
 * white, for instance) come back a shade deeper rather than unreadable.
 */
export function ensureReadableFill(fill: string, target = 4.5): string {
  let current = fill;
  for (let i = 0; i < 20; i++) {
    const on = pickOnColor(current);
    if (contrastRatio(on, current) >= target) return current;
    current = mix(current, on === '#FFFFFF' ? '#000000' : '#FFFFFF', 0.04);
  }
  return current;
}

/** Hue angle in degrees (0–360) — used to keep category colours distinguishable. */
export function hue(color: string): number {
  const [r, g, b] = parseColor(color).rgb.map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return 0;
  let h: number;
  if (max === r) h = ((g - b) / delta) % 6;
  else if (max === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

/** Shortest distance between two hue angles, 0–180. */
export function hueDistance(a: string, b: string): number {
  const diff = Math.abs(hue(a) - hue(b)) % 360;
  return diff > 180 ? 360 - diff : diff;
}
