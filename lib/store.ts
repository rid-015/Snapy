'use client';

import { create } from 'zustand';
import { autoPlace } from './geometry';
import { LOOKS } from './looks';
import type { Doc, Look, MediaItem, Placement } from './types';

export const MAX_ITEMS = 3;
const HISTORY_LIMIT = 80;
const STORAGE_KEY = 'snapy.look.v1';

export const DEFAULT_DOC: Doc = {
  items: [],
  place: {},
  frame: 'auto',
  browserStyle: 'light',
  deviceTone: 'dark',
  url: '',
  radius: 12,
  shadow: 'real',
  shadowOpacity: 45,
  tilt: 'flat',
  bg: { kind: 'mesh', paletteId: 'auto', custom: '#C8D7F0', angle: 135, grain: false },
  layout: 'side',
  caption: { on: false, title: 'Your product, beautifully framed', sub: 'One line about what it does', pos: 'top' },
  canvas: { w: 1920, h: 1280, label: '3:2' },
  look: 'mesh',
};

/** Changing any of these moves items back to their automatic positions. */
const RELAYOUT_KEYS: (keyof Doc)[] = ['items', 'frame', 'layout', 'caption', 'canvas'];

type Patch = Partial<Doc> | ((d: Doc) => Partial<Doc>);

interface Toast { id: number; msg: string; err?: boolean }

interface Store {
  doc: Doc;
  past: Doc[];
  future: Doc[];
  selected: string | null;
  toast: Toast | null;
  /** Undoable change. */
  commit: (patch: Patch) => void;
  /** Starts a gesture (drag, resize, wheel): saves one undo step, then use `live` for the moves. */
  begin: () => void;
  live: (patch: Patch) => void;
  movePlacement: (id: string, p: Partial<Placement>, history?: boolean) => void;
  undo: () => void;
  redo: () => void;
  select: (id: string | null) => void;
  addItems: (items: MediaItem[]) => void;
  removeItem: (id: string) => void;
  applyLook: (id: string) => void;
  relayout: () => void;
  notify: (msg: string, err?: boolean) => void;
  clearToast: () => void;
  init: (example: MediaItem) => void;
}

function withLayout(prev: Doc, next: Doc): Doc {
  const changed = RELAYOUT_KEYS.some((k) => {
    if (k === 'caption') return prev.caption.on !== next.caption.on || prev.caption.pos !== next.caption.pos;
    return prev[k] !== next[k];
  });
  if (!changed) return next;
  return { ...next, place: autoPlace(next.items, next.frame, next.layout, next.caption, next.canvas) };
}

function resolve(doc: Doc, patch: Patch): Doc {
  const p = typeof patch === 'function' ? patch(doc) : patch;
  return withLayout(doc, { ...doc, ...p });
}

function saveLook(doc: Doc) {
  try {
    const { items: _i, place: _p, ...look } = doc;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(look));
  } catch {
    /* storage unavailable: nothing to remember */
  }
}

function loadLook(): Partial<Look> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<Look>) : {};
  } catch {
    return {};
  }
}

let toastId = 0;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
const scheduleSave = (doc: Doc) => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveLook(doc), 400);
};

export const useStore = create<Store>((set, get) => ({
  doc: DEFAULT_DOC,
  past: [],
  future: [],
  selected: null,
  toast: null,

  commit: (patch) => {
    const { doc, past } = get();
    const next = resolve(doc, patch);
    set({ doc: next, past: [...past, doc].slice(-HISTORY_LIMIT), future: [] });
    scheduleSave(next);
  },
  begin: () => {
    const { doc, past } = get();
    set({ past: [...past, doc].slice(-HISTORY_LIMIT), future: [] });
  },
  live: (patch) => {
    const next = resolve(get().doc, patch);
    set({ doc: next });
    scheduleSave(next);
  },
  movePlacement: (id, p, history = false) => {
    const fn = (d: Doc) => ({ place: { ...d.place, [id]: { ...d.place[id], ...p } } });
    if (history) get().commit(fn);
    else get().live(fn);
  },
  undo: () => {
    const { past, doc, future } = get();
    if (!past.length) return;
    const prev = past[past.length - 1];
    set({ doc: prev, past: past.slice(0, -1), future: [doc, ...future] });
    scheduleSave(prev);
  },
  redo: () => {
    const { past, doc, future } = get();
    if (!future.length) return;
    const next = future[0];
    set({ doc: next, past: [...past, doc], future: future.slice(1) });
    scheduleSave(next);
  },
  select: (id) => set({ selected: id }),

  addItems: (incoming) => {
    const { doc, notify } = get();
    const kept = doc.items.filter((it) => !it.example);
    let items = [...kept, ...incoming];
    if (items.length > MAX_ITEMS) {
      items = items.slice(-MAX_ITEMS);
      notify(`Up to ${MAX_ITEMS} screenshots at once, so the oldest was replaced.`);
    }
    get().commit({ items });
    set({ selected: incoming[incoming.length - 1]?.id ?? null });
  },
  removeItem: (id) => {
    const { doc, selected } = get();
    const items = doc.items.filter((it) => it.id !== id);
    get().commit({ items });
    if (selected === id) set({ selected: null });
  },
  applyLook: (id) => {
    const look = LOOKS.find((l) => l.id === id);
    if (!look) return;
    get().commit((d) => ({ ...look.apply(d), look: id }));
  },
  relayout: () => {
    get().commit((d) => ({ place: autoPlace(d.items, d.frame, d.layout, d.caption, d.canvas) }));
  },
  notify: (msg, err) => set({ toast: { id: ++toastId, msg, err } }),
  clearToast: () => set({ toast: null }),

  init: (example) => {
    const saved = loadLook();
    const base: Doc = { ...DEFAULT_DOC, ...saved, bg: { ...DEFAULT_DOC.bg, ...saved.bg }, caption: { ...DEFAULT_DOC.caption, ...saved.caption } };
    const items = [example];
    const doc: Doc = { ...base, items, place: autoPlace(items, base.frame, base.layout, base.caption, base.canvas) };
    set({ doc, past: [], future: [] });
  },
}));
