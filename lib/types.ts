export type FrameType = 'auto' | 'none' | 'browser' | 'phone' | 'tablet';
export type ResolvedFrame = Exclude<FrameType, 'auto'>;
export type BrowserStyle = 'light' | 'dark' | 'glass';
export type DeviceTone = 'dark' | 'light';
export type ShadowKind = 'none' | 'soft' | 'real' | 'float';
export type Tilt = 'flat' | 'left' | 'right' | 'iso';
export type BgKind = 'mesh' | 'linear' | 'solid' | 'blur' | 'clear';
export type LayoutKind = 'single' | 'side' | 'overlap' | 'combo';
export type CaptionPos = 'top' | 'bottom';

export interface MediaItem {
  id: string;
  src: string;
  name: string;
  width: number;
  height: number;
  /** Pastel colours taken from the image, used for automatic backgrounds. */
  palette: string[];
  example?: boolean;
}

export interface Placement {
  /** Centre of the item, as a fraction of canvas width and height. */
  x: number;
  y: number;
  /** Item width as a fraction of canvas width. */
  scale: number;
  z: number;
}

export interface Background {
  kind: BgKind;
  /** 'auto' takes colours from the first screenshot; otherwise a preset palette id or 'custom'. */
  paletteId: string;
  custom: string;
  angle: number;
  grain: boolean;
}

export interface Caption {
  on: boolean;
  title: string;
  sub: string;
  pos: CaptionPos;
}

export interface CanvasSize {
  w: number;
  h: number;
  label: string;
}

/** Everything that undo/redo covers. */
export interface Doc {
  items: MediaItem[];
  place: Record<string, Placement>;
  frame: FrameType;
  browserStyle: BrowserStyle;
  deviceTone: DeviceTone;
  url: string;
  radius: number;
  shadow: ShadowKind;
  shadowOpacity: number;
  tilt: Tilt;
  bg: Background;
  layout: LayoutKind;
  caption: Caption;
  canvas: CanvasSize;
  look: string | null;
}

/** The part of a Doc that is remembered between visits (no images). */
export type Look = Omit<Doc, 'items' | 'place'>;
