import type { Doc } from './types';

/** One-click looks. Each sets the whole style at once; media and positions are untouched. */
export interface LookPreset {
  id: string;
  name: string;
  apply: (d: Doc) => Partial<Doc>;
}

export const LOOKS: LookPreset[] = [
  {
    id: 'mesh',
    name: 'Mesh',
    apply: (d) => ({
      bg: { ...d.bg, kind: 'mesh', paletteId: 'auto', grain: false },
      frame: 'auto', browserStyle: 'light', deviceTone: 'dark', shadow: 'real', shadowOpacity: 45, tilt: 'flat', radius: 12,
    }),
  },
  {
    id: 'glass',
    name: 'Glass',
    apply: (d) => ({
      bg: { ...d.bg, kind: 'blur', paletteId: 'auto', grain: false },
      frame: 'auto', browserStyle: 'glass', deviceTone: 'light', shadow: 'soft', shadowOpacity: 40, tilt: 'flat', radius: 14,
    }),
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    apply: (d) => ({
      bg: { ...d.bg, kind: 'mesh', paletteId: 'charcoal', grain: true },
      frame: 'auto', browserStyle: 'dark', deviceTone: 'dark', shadow: 'float', shadowOpacity: 60, tilt: 'flat', radius: 12,
    }),
  },
  {
    id: 'soft',
    name: 'Soft',
    apply: (d) => ({
      bg: { ...d.bg, kind: 'linear', paletteId: 'auto', angle: 135, grain: false },
      frame: 'auto', browserStyle: 'light', deviceTone: 'light', shadow: 'soft', shadowOpacity: 35, tilt: 'flat', radius: 16,
    }),
  },
  {
    id: 'tilted',
    name: 'Tilted',
    apply: (d) => ({
      bg: { ...d.bg, kind: 'mesh', paletteId: 'auto', grain: true },
      frame: 'auto', browserStyle: 'light', deviceTone: 'dark', shadow: 'real', shadowOpacity: 50, tilt: 'left', radius: 12,
    }),
  },
  {
    id: 'plain',
    name: 'Plain',
    apply: (d) => ({
      bg: { ...d.bg, kind: 'solid', paletteId: 'paper', grain: false },
      frame: 'none', shadow: 'soft', shadowOpacity: 30, tilt: 'flat', radius: 10,
    }),
  },
];
