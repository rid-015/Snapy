'use client';

import { useId, useState } from 'react';
import { useStore } from '@/lib/store';
import { Svg } from './controls';
import { SIZES } from './Sidebar';

export default function TopBar({ onCopy, onDownload, busy }: { onCopy: () => void; onDownload: (scale: number) => void; busy: boolean }) {
  const doc = useStore((s) => s.doc);
  const canUndo = useStore((s) => s.past.length > 0);
  const canRedo = useStore((s) => s.future.length > 0);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const commit = useStore((s) => s.commit);
  const [scale, setScale] = useState(2);
  const [custom, setCustom] = useState(false);
  const [cw, setCw] = useState(String(doc.canvas.w));
  const [ch, setCh] = useState(String(doc.canvas.h));
  const sizeId = useId(), scaleId = useId();

  const setSize = (label: string) => {
    if (label === '__custom') { setCustom(true); setCw(String(doc.canvas.w)); setCh(String(doc.canvas.h)); return; }
    for (const g of SIZES) for (const [l, w, h] of g.items) if (l === label) { setCustom(false); commit({ canvas: { w, h, label: l } }); }
  };
  const applyCustom = () => {
    const w = Math.round(Math.min(6000, Math.max(200, Number(cw) || doc.canvas.w)));
    const h = Math.round(Math.min(6000, Math.max(200, Number(ch) || doc.canvas.h)));
    commit({ canvas: { w, h, label: 'Custom' } });
    setCustom(false);
  };
  const known = SIZES.some((g) => g.items.some(([l]) => l === doc.canvas.label));

  return (
    <div className="top">
      <div className="top-left">
        <button type="button" className="icon-btn" onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo (⌘Z)">
          <Svg><path d="M9 14L4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 010 11H11" /></Svg>
        </button>
        <button type="button" className="icon-btn" onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo (⇧⌘Z)">
          <Svg><path d="M15 14l5-5-5-5" /><path d="M20 9H9.5a5.5 5.5 0 000 11H13" /></Svg>
        </button>
        <span className="divider" aria-hidden="true" />
        <label className="sr-only" htmlFor={sizeId}>Canvas size</label>
        <select id={sizeId} className="select" value={custom ? '__custom' : known ? doc.canvas.label : '__current'} onChange={(e) => setSize(e.target.value)}>
          {!known && !custom ? <option value="__current">Custom</option> : null}
          {SIZES.map((g) => (
            <optgroup key={g.group} label={g.group}>
              {g.items.map(([l]) => <option key={l} value={l}>{l}</option>)}
            </optgroup>
          ))}
          <option value="__custom">Custom size…</option>
        </select>
        {custom ? (
          <form className="custom-size" onSubmit={(e) => { e.preventDefault(); applyCustom(); }}>
            <label><span>W</span><input inputMode="numeric" value={cw} onChange={(e) => setCw(e.target.value)} aria-label="Width in pixels" /></label>
            <label><span>H</span><input inputMode="numeric" value={ch} onChange={(e) => setCh(e.target.value)} aria-label="Height in pixels" /></label>
            <button type="submit" className="btn">Set</button>
          </form>
        ) : (
          <span className="dims">{doc.canvas.w} × {doc.canvas.h}</span>
        )}
      </div>
      <div className="top-right">
        <label className="sr-only" htmlFor={scaleId}>Export scale</label>
        <select id={scaleId} className="select narrow" value={scale} onChange={(e) => setScale(Number(e.target.value))}>
          <option value={1}>1×</option>
          <option value={2}>2×</option>
          <option value={3}>3×</option>
        </select>
        <button type="button" className="btn" onClick={() => onDownload(scale)} disabled={busy}>Download</button>
        <button type="button" className="btn primary" onClick={onCopy} disabled={busy} title="Copy image (⌘C)">
          {busy ? 'Working…' : 'Copy'}<kbd>⌘C</kbd>
        </button>
      </div>
    </div>
  );
}
