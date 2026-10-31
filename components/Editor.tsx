'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { FORMAT_EXT, copyPng, downloadBlob, renderImage } from '@/lib/export';
import { ACCEPTED, loadImageFile, makeExample } from '@/lib/media';
import { useStore } from '@/lib/store';
import type { ExportFormat } from '@/lib/types';
import Sidebar from './Sidebar';
import Stage from './Stage';
import TopBar from './TopBar';

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);

export default function Editor() {
  const compRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const toast = useStore((s) => s.toast);
  const notify = useStore((s) => s.notify);
  const clearToast = useStore((s) => s.clearToast);

  // Open on an example so the first screen already shows what snapy does.
  useEffect(() => {
    const start = () => useStore.getState().init(makeExample());
    if (document.fonts?.ready) document.fonts.ready.then(start); else start();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 3200);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  const addFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const ok = files.filter((f) => ACCEPTED.includes(f.type));
    const bad = files.find((f) => !ACCEPTED.includes(f.type));
    if (bad) notify(`${bad.name || 'That file'} isn’t a screenshot. Use PNG, JPG or WebP.`, true);
    const loaded = [];
    for (const f of ok) {
      try { loaded.push(await loadImageFile(f)); }
      catch { notify(`Couldn’t open ${f.name}. Try saving it again as PNG.`, true); }
    }
    if (loaded.length) useStore.getState().addItems(loaded);
  }, [notify]);

  const pick = useCallback(() => fileRef.current?.click(), []);

  const render = useCallback(async (scale: number, format: ExportFormat = 'png') => {
    const node = compRef.current;
    const { canvas, quality } = useStore.getState().doc;
    if (!node) throw new Error('no canvas');
    return renderImage(node, canvas.w, canvas.h, scale, format, quality);
  }, []);

  const fileName = (format: ExportFormat) => {
    const first = useStore.getState().doc.items.find((i) => !i.example);
    return `${first ? first.name.replace(/\.[^.]+$/, '') : 'snapy'}-snapy.${FORMAT_EXT[format]}`;
  };

  const copy = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      await copyPng(() => render(2));
      notify('Copied. Paste it anywhere.');
    } catch {
      notify('Your browser blocked copying. Use Download instead.', true);
    } finally {
      setBusy(false);
    }
  }, [busy, render, notify]);

  const download = useCallback(async (scale: number) => {
    if (busy) return;
    setBusy(true);
    try {
      const { format } = useStore.getState().doc;
      downloadBlob(await render(scale, format), fileName(format));
    } catch (err) {
      notify(err instanceof Error && err.message === 'format'
        ? 'This browser can’t save that format. Try PNG or JPG.'
        : 'Couldn’t create the image. Try a smaller canvas or 1×.', true);
    } finally {
      setBusy(false);
    }
  }, [busy, render, notify]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const mod = e.metaKey || e.ctrlKey;
      const s = useStore.getState();
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) s.redo(); else s.undo(); return; }
      if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); s.redo(); return; }
      if (mod && e.key.toLowerCase() === 'c') {
        if (window.getSelection()?.toString()) return;
        e.preventDefault(); copy(); return;
      }
      if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); download(2); return; }
      if (mod && e.key.toLowerCase() === 'o') { e.preventDefault(); pick(); return; }
      const id = s.selected;
      if (!id) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); s.removeItem(id); return; }
      if (e.key === 'Escape') { s.select(null); return; }
      const step = e.shiftKey ? 0.02 : 0.004;
      const p = s.doc.place[id];
      const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (p && moves[e.key]) {
        e.preventDefault();
        const [dx, dy] = moves[e.key];
        s.movePlacement(id, { x: p.x + dx, y: p.y + dy }, true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [copy, download, pick]);

  // Paste and drop anywhere
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (isTyping(e.target)) return;
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length) { e.preventDefault(); addFiles(files); }
    };
    let depth = 0;
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes('Files');
    const enter = (e: DragEvent) => { if (!hasFiles(e)) return; e.preventDefault(); depth++; setDragging(true); };
    const over = (e: DragEvent) => { if (hasFiles(e)) e.preventDefault(); };
    const leave = () => { depth = Math.max(0, depth - 1); if (!depth) setDragging(false); };
    const drop = (e: DragEvent) => { if (!hasFiles(e)) return; e.preventDefault(); depth = 0; setDragging(false); addFiles(Array.from(e.dataTransfer?.files ?? [])); };
    window.addEventListener('paste', onPaste);
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragover', over);
    window.addEventListener('dragleave', leave);
    window.addEventListener('drop', drop);
    return () => {
      window.removeEventListener('paste', onPaste);
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragover', over);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('drop', drop);
    };
  }, [addFiles]);

  return (
    <div className="app">
      <Sidebar onPick={pick} />
      <main className="main">
        <TopBar onCopy={copy} onDownload={download} busy={busy} />
        <Stage compRef={compRef} onPick={pick} />
      </main>
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED.join(',')}
        multiple
        hidden
        onChange={(e) => { addFiles(Array.from(e.target.files ?? [])); e.target.value = ''; }}
      />
      {dragging ? <div className="dropzone" aria-hidden="true">Drop to add</div> : null}
      {toast ? <div key={toast.id} className={toast.err ? 'toast err' : 'toast'} role="status">{toast.msg}</div> : null}
    </div>
  );
}
