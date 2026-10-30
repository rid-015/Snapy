import { PALETTES, fromHex, luminance, toHex } from './palette';
import type { Background, MediaItem } from './types';

export function paletteFor(bg: Background, first: MediaItem | undefined): string[] {
  if (bg.paletteId === 'custom') {
    const [r, g, b] = fromHex(bg.custom);
    const lift = (k: number) => toHex([r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k]);
    return [bg.custom, lift(0.25), lift(0.45), lift(0.15)];
  }
  if (bg.paletteId === 'auto') return first?.palette ?? PALETTES[0].colors;
  return PALETTES.find((p) => p.id === bg.paletteId)?.colors ?? PALETTES[0].colors;
}

/** CSS background for the canvas. 'blur' is drawn by a separate layer, so it only sets a base colour here. */
export function backgroundCss(bg: Background, colors: string[]): string {
  const [c0, c1, c2, c3] = colors;
  switch (bg.kind) {
    case 'mesh':
      return [
        `radial-gradient(at 12% 18%, ${c1} 0px, transparent 55%)`,
        `radial-gradient(at 88% 12%, ${c2} 0px, transparent 50%)`,
        `radial-gradient(at 78% 88%, ${c3} 0px, transparent 55%)`,
        `radial-gradient(at 18% 86%, ${c2} 0px, transparent 45%)`,
        c0,
      ].join(', ');
    case 'linear':
      return `linear-gradient(${bg.angle}deg, ${c1}, ${c2})`;
    case 'solid':
      return c0;
    case 'blur':
      return c0;
    case 'clear':
      return 'transparent';
  }
}

/** True when the background is dark enough that captions should be light. */
export function isDarkBackground(bg: Background, colors: string[]) {
  if (bg.kind === 'clear') return false;
  const sample = bg.kind === 'linear' ? colors[1] : colors[0];
  return luminance(sample) < 0.18;
}

/** Fine film grain as an inline SVG, so it exports with the image. */
export const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";
