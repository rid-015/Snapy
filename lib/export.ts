import { toCanvas } from 'html-to-image';
import type { ExportFormat } from './types';

export const FORMAT_EXT: Record<ExportFormat, string> = { png: 'png', jpeg: 'jpg', webp: 'webp' };
export const FORMAT_LABEL: Record<ExportFormat, string> = { png: 'PNG', jpeg: 'JPG', webp: 'WebP' };

/** Renders the composition node (at its full logical size) to an image blob. */
export async function renderImage(node: HTMLElement, width: number, height: number, pixelRatio: number, format: ExportFormat = 'png', quality = 90): Promise<Blob> {
  let canvas = await toCanvas(node, {
    width,
    height,
    pixelRatio,
    cacheBust: false,
    style: { transform: 'none', margin: '0' },
    filter: (el) => !(el instanceof HTMLElement && el.dataset.uiOnly === 'true'),
  });
  if (format === 'jpeg') {
    // JPG has no transparency: put the image on white instead of letting it turn black.
    const flat = document.createElement('canvas');
    flat.width = canvas.width;
    flat.height = canvas.height;
    const g = flat.getContext('2d')!;
    g.fillStyle = '#FFFFFF';
    g.fillRect(0, 0, flat.width, flat.height);
    g.drawImage(canvas, 0, 0);
    canvas = flat;
  }
  const type = `image/${format}`;
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, type, format === 'png' ? undefined : quality / 100));
  // Browsers without a WebP encoder silently fall back to PNG.
  if (!blob || blob.type !== type) throw new Error(blob ? 'format' : 'render');
  return blob;
}

/** Shrinks a logo so it stays small enough to remember between visits. */
export function loadLogo(file: File, max = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.naturalWidth * k));
      c.height = Math.max(1, Math.round(img.naturalHeight * k));
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')); };
    img.src = url;
  });
}

export async function copyPng(make: () => Promise<Blob>) {
  if (!navigator.clipboard || typeof ClipboardItem === 'undefined') throw new Error('clipboard');
  // Passing a promise keeps Safari's user-gesture requirement satisfied.
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': make() })]);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
