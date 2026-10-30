/** Colour helpers: read a small palette from an image and soften it into backgrounds. */

type RGB = [number, number, number];

const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
export const toHex = ([r, g, b]: RGB) => '#' + [r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('');
export function fromHex(hex: string): RGB {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const mix = (a: RGB, b: RGB, k: number): RGB => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

function saturation([r, g, b]: RGB) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}
export function luminance(hex: string) {
  const [r, g, b] = fromHex(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Returns four soft colours for an image. Colourful pixels are preferred so a mostly
 * white screenshot still yields a tinted background; greys fall back to a warm neutral set.
 */
export function extractPalette(img: CanvasImageSource): string[] {
  const size = 40;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d', { willReadFrequently: true });
  if (!g) return FALLBACK;
  try {
    g.drawImage(img, 0, 0, size, size);
    const data = g.getImageData(0, 0, size, size).data;
    const buckets = new Map<string, { count: number; weight: number; sum: RGB }>();
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      const px: RGB = [data[i], data[i + 1], data[i + 2]];
      const key = px.map((v) => v >> 5).join(',');
      const b = buckets.get(key) ?? { count: 0, weight: 0, sum: [0, 0, 0] as RGB };
      b.count += 1;
      b.weight += 1 + saturation(px) * 6;
      b.sum = [b.sum[0] + px[0], b.sum[1] + px[1], b.sum[2] + px[2]];
      buckets.set(key, b);
    }
    const ranked = [...buckets.values()]
      .map((b) => ({ weight: b.weight, rgb: b.sum.map((v) => v / b.count) as RGB }))
      .sort((a, b) => b.weight - a.weight);
    const picked: RGB[] = [];
    for (const r of ranked) {
      const rgb = r.rgb;
      if (saturation(rgb) < 0.12) continue;
      if (picked.every((p) => Math.abs(p[0] - rgb[0]) + Math.abs(p[1] - rgb[1]) + Math.abs(p[2] - rgb[2]) > 90)) picked.push(rgb);
      if (picked.length === 3) break;
    }
    if (picked.length === 0) return FALLBACK;
    while (picked.length < 3) picked.push(mix(picked[0], [255, 255, 255], 0.3 * picked.length));
    const soft = picked.map((p) => toHex(mix(p, [255, 255, 255], 0.55)));
    return [toHex(mix(picked[0], [255, 255, 255], 0.78)), ...soft];
  } catch {
    return FALLBACK;
  }
}

const FALLBACK = ['#F1F4E6', '#E1ECC4', '#CFE3F2', '#F5D5C0'];

export const PALETTES: { id: string; name: string; colors: string[] }[] = [
  { id: 'pistachio', name: 'Pistachio', colors: ['#F1F4E6', '#E1ECC4', '#CFEDE3', '#F3E6B5'] },
  { id: 'peach', name: 'Peach', colors: ['#FBF0E8', '#F5D5C0', '#F4D3D8', '#F3E6B5'] },
  { id: 'lilac', name: 'Lilac', colors: ['#F2EFFA', '#DDD6F3', '#CFE3F2', '#F4D3D8'] },
  { id: 'sky', name: 'Sky', colors: ['#EEF5FA', '#CFE3F2', '#CFEDE3', '#DDD6F3'] },
  { id: 'charcoal', name: 'Charcoal', colors: ['#33332F', '#45453F', '#3A3F33', '#4A4540'] },
  { id: 'paper', name: 'Paper', colors: ['#F7F7F4', '#ECECE8', '#E3E3DF', '#F2F0EA'] },
];
