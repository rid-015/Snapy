'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { useStore } from '@/lib/store';
import Composition, { type Corner } from './Composition';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export default function Stage({ compRef, onPick }: { compRef: RefObject<HTMLDivElement>; onPick: () => void }) {
  const doc = useStore((s) => s.doc);
  const selected = useStore((s) => s.selected);
  const select = useStore((s) => s.select);
  const begin = useStore((s) => s.begin);
  const movePlacement = useStore((s) => s.movePlacement);

  const areaRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(0.4);
  const { w: cw, h: ch } = doc.canvas;

  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setFit(Math.max(0.05, Math.min((r.width - 32) / cw, (r.height - 32) / ch)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cw, ch]);

  // ----- drag to move -----
  const onItemDown = useCallback((e: ReactPointerEvent, id: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    select(id);
    const start = useStore.getState().doc.place[id];
    if (!start) return;
    const sx = e.clientX, sy = e.clientY;
    let moved = false;
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - sx) / fit / cw, dy = (ev.clientY - sy) / fit / ch;
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 3) return;
      if (!moved) { begin(); moved = true; }
      movePlacement(id, { x: clamp(start.x + dx, -0.2, 1.2), y: clamp(start.y + dy, -0.2, 1.2) });
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [fit, cw, ch, select, begin, movePlacement]);

  // ----- corner handles to resize -----
  const onHandleDown = useCallback((e: ReactPointerEvent, id: string, _corner: Corner) => {
    e.stopPropagation();
    e.preventDefault();
    const comp = compRef.current;
    const start = useStore.getState().doc.place[id];
    if (!comp || !start) return;
    const box = comp.getBoundingClientRect();
    const cx = box.left + start.x * cw * fit, cy = box.top + start.y * ch * fit;
    const d0 = Math.hypot(e.clientX - cx, e.clientY - cy) || 1;
    begin();
    const move = (ev: PointerEvent) => {
      const d = Math.hypot(ev.clientX - cx, ev.clientY - cy);
      movePlacement(id, { scale: clamp((start.scale * d) / d0, 0.06, 1.8) });
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [compRef, cw, ch, fit, begin, movePlacement]);

  // ----- scroll or pinch to zoom the selected (or only) item -----
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let active = false;
    const onWheel = (e: WheelEvent) => {
      const s = useStore.getState();
      const id = s.selected ?? (s.doc.items.length === 1 ? s.doc.items[0].id : null);
      if (!id || !s.doc.place[id]) return;
      e.preventDefault();
      if (!active) { s.begin(); active = true; }
      clearTimeout(timer);
      timer = setTimeout(() => { active = false; }, 350);
      const k = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015));
      s.movePlacement(id, { scale: clamp(s.doc.place[id].scale * k, 0.06, 1.8) });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const empty = doc.items.length === 0;
  const onlyExample = doc.items.length === 1 && doc.items[0].example;

  return (
    <div className="stage" ref={areaRef} onPointerDown={() => select(null)}>
      <div className={doc.bg.kind === 'clear' ? 'stage-frame checker' : 'stage-frame'} style={{ width: cw * fit, height: ch * fit }}>
        <div className="stage-scale" style={{ transform: `scale(${fit})`, ['--inv' as string]: String(1 / fit) }}>
          <Composition ref={compRef} doc={doc} selected={selected} onItemDown={onItemDown} onHandleDown={onHandleDown} />
        </div>
        {empty ? (
          <button type="button" className="stage-empty" onClick={onPick} onPointerDown={(e) => e.stopPropagation()}>
            <strong>Add a screenshot</strong>
            <span>Drop it here, paste with ⌘V, or click to choose</span>
          </button>
        ) : null}
      </div>
      <p className="stage-hint" aria-live="polite">
        {onlyExample
          ? 'This is an example. Drop, paste (⌘V) or click Add to use your own.'
          : 'Drag to move · scroll to zoom · corners to resize'}
      </p>
    </div>
  );
}
