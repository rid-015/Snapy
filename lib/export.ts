import { toBlob } from 'html-to-image';

/** Renders the composition node (at its full logical size) to a PNG blob. */
export async function renderPng(node: HTMLElement, width: number, height: number, pixelRatio: number): Promise<Blob> {
  const blob = await toBlob(node, {
    width,
    height,
    pixelRatio,
    cacheBust: false,
    style: { transform: 'none', margin: '0' },
    filter: (el) => !(el instanceof HTMLElement && el.dataset.uiOnly === 'true'),
  });
  if (!blob) throw new Error('render');
  return blob;
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
