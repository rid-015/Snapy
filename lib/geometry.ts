import type { Caption, CanvasSize, FrameType, LayoutKind, MediaItem, Placement, ResolvedFrame, Tilt } from './types';

/**
 * Frame sizes are expressed in "em", where 1em = 1% of the item's width.
 * Keeping them relative means a frame looks identical at any zoom or export size.
 */
export const BROWSER_BAR = 4.5; // em
export const DEVICE = {
  phone: { bezel: 3.6, radius: 13 },
  tablet: { bezel: 3.2, radius: 6 },
} as const;

export function resolveFrame(frame: FrameType, item: MediaItem): ResolvedFrame {
  if (frame !== 'auto') return frame;
  return item.width / item.height < 0.8 ? 'phone' : 'browser';
}

/** Width ÷ height of the framed item. */
export function framedAspect(item: MediaItem, frame: ResolvedFrame) {
  const a = item.width / item.height;
  if (frame === 'browser') return 100 / (100 / a + BROWSER_BAR);
  if (frame === 'phone' || frame === 'tablet') {
    const b = DEVICE[frame].bezel;
    return 100 / ((100 - 2 * b) / a + 2 * b);
  }
  return a;
}

export const TILTS: Record<Tilt, string> = {
  flat: 'none',
  left: 'perspective(2400px) rotateY(16deg) rotateX(6deg)',
  right: 'perspective(2400px) rotateY(-16deg) rotateX(6deg)',
  iso: 'perspective(3000px) rotateX(38deg) rotateZ(-24deg)',
};

/** Default positions for the current layout. Users can drag items away from these afterwards. */
export function autoPlace(
  items: MediaItem[],
  frame: FrameType,
  layout: LayoutKind,
  caption: Caption,
  canvas: CanvasSize,
): Record<string, Placement> {
  const out: Record<string, Placement> = {};
  if (!items.length) return out;
  const ca = canvas.w / canvas.h;
  const capH = caption.on ? 0.2 : 0;
  const boxW = 0.82;
  const boxH = 0.8 - capH;
  const cy = caption.on ? (caption.pos === 'top' ? 0.5 + capH / 2 : 0.5 - capH / 2) : 0.5;
  const aspects = items.map((it) => framedAspect(it, resolveFrame(frame, it)));

  /** Width (fraction of canvas width) that fits an item of aspect a; bh is a fraction of canvas height. */
  const fitW = (a: number, bw: number, bh: number) => Math.min(bw, (bh * a) / ca);

  const effective: LayoutKind = items.length === 1 ? 'single' : layout === 'single' ? 'side' : layout;

  if (effective === 'single') {
    out[items[0].id] = { x: 0.5, y: cy, scale: fitW(aspects[0], boxW, boxH), z: 1 };
    return out;
  }

  if (effective === 'side') {
    const gap = 0.04;
    // Same height for all: total width = h * sum(a) + gaps, in width units.
    const sumA = aspects.reduce((s, a) => s + a, 0);
    const hByWidth = (boxW - gap * (items.length - 1)) / sumA; // height in width units
    const h = Math.min(hByWidth, boxH / ca);
    let x = 0.5 - (h * sumA + gap * (items.length - 1)) / 2;
    items.forEach((it, i) => {
      const w = h * aspects[i];
      out[it.id] = { x: x + w / 2, y: cy, scale: w, z: i + 1 };
      x += w + gap;
    });
    return out;
  }

  if (effective === 'overlap') {
    const n = items.length;
    const step = 0.07;
    const bw = boxW - step * (n - 1);
    const bh = boxH - step * ca * (n - 1);
    items.forEach((it, i) => {
      const w = fitW(aspects[i], bw, bh);
      const off = (i - (n - 1) / 2) * step;
      out[it.id] = { x: 0.5 + off, y: cy + off * ca, scale: w, z: i + 1 };
    });
    return out;
  }

  // combo: the widest item sits behind, the narrowest stands in front at the bottom right.
  const order = items.map((it, i) => ({ it, a: aspects[i] })).sort((p, q) => q.a - p.a);
  const back = order[0];
  const backW = fitW(back.a, boxW * 0.86, boxH * 0.92);
  const backH = (backW / back.a) * ca; // in height units
  out[back.it.id] = { x: 0.5 - boxW * 0.07, y: cy - 0.02, scale: backW, z: 1 };
  order.slice(1).forEach((p, i) => {
    const frontH = backH * (0.78 - i * 0.08);
    const w = (frontH / ca) * p.a;
    out[p.it.id] = {
      x: 0.5 + backW / 2 - w * 0.35 - i * 0.08,
      y: cy + backH * 0.22,
      scale: w,
      z: 2 + i,
    };
  });
  return out;
}
