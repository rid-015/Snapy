import { extractPalette } from './palette';
import type { MediaItem } from './types';

let counter = 0;
export const newId = () => `m${Date.now().toString(36)}${(counter++).toString(36)}`;

export const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif'];

export function loadImageFile(file: File): Promise<MediaItem> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read'));
    reader.onload = () => {
      const src = String(reader.result);
      const img = new Image();
      img.onload = () =>
        resolve({
          id: newId(),
          src,
          name: file.name || 'Pasted screenshot',
          width: img.naturalWidth,
          height: img.naturalHeight,
          palette: extractPalette(img),
        });
      img.onerror = () => reject(new Error('decode'));
      img.src = src;
    };
    // Data URLs (not blob URLs) so the image survives export and undo.
    reader.readAsDataURL(file);
  });
}

function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** A drawn dashboard screenshot so the editor opens showing what it does. */
export function makeExample(): MediaItem {
  const W = 1440, H = 900;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const font = getComputedStyle(document.body).fontFamily || 'Helvetica, Arial, sans-serif';
  g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#F6F6F3'; g.fillRect(0, 0, 260, H);
  for (let i = 0; i < 6; i++) { g.fillStyle = i === 0 ? '#D3DFB4' : '#E8E8E4'; rr(g, 36, 60 + i * 60, 188, 34, 8); g.fill(); }
  g.fillStyle = '#2B2B27'; g.font = `500 30px ${font}`; g.fillText('Overview', 320, 92);
  g.fillStyle = '#8A8A86'; g.font = `20px ${font}`; g.fillText('Last 30 days', 320, 128);
  [['Visitors', '24.8k'], ['Signups', '1,204'], ['Revenue', '$8.9k']].forEach(([k, v], i) => {
    const x = 320 + i * 360;
    g.fillStyle = i === 0 ? '#EEF3DE' : '#F4F4F1'; rr(g, x, 170, 330, 150, 16); g.fill();
    g.fillStyle = '#6B6B68'; g.font = `20px ${font}`; g.fillText(k, x + 28, 216);
    g.fillStyle = '#2B2B27'; g.font = `500 44px ${font}`; g.fillText(v, x + 28, 280);
  });
  g.fillStyle = '#F4F4F1'; rr(g, 320, 350, 1050, 470, 16); g.fill();
  g.strokeStyle = '#7C9A3A'; g.lineWidth = 4; g.lineJoin = 'round'; g.beginPath();
  [40, 120, 90, 160, 140, 130, 210, 260, 230, 300, 270, 360].forEach((v, i) => { const x = 360 + i * 88, y = 780 - v; if (i) g.lineTo(x, y); else g.moveTo(x, y); });
  g.stroke();
  return {
    id: 'example', src: c.toDataURL('image/png'), name: 'Example screenshot', width: W, height: H,
    palette: ['#F1F4E6', '#E1ECC4', '#CFEDE3', '#F3E6B5'], example: true,
  };
}
