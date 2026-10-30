'use client';

import { forwardRef, type PointerEvent as ReactPointerEvent } from 'react';
import { GRAIN, backgroundCss, isDarkBackground, paletteFor } from '@/lib/backgrounds';
import { TILTS, resolveFrame } from '@/lib/geometry';
import type { Doc } from '@/lib/types';
import Frame from './Frame';

export type Corner = 'nw' | 'ne' | 'sw' | 'se';

interface Props {
  doc: Doc;
  selected: string | null;
  onItemDown?: (e: ReactPointerEvent, id: string) => void;
  onHandleDown?: (e: ReactPointerEvent, id: string, corner: Corner) => void;
}

/** The finished image at its real pixel size. The stage scales it to fit; export renders it as is. */
const Composition = forwardRef<HTMLDivElement, Props>(function Composition({ doc, selected, onItemDown, onHandleDown }, ref) {
  const { canvas } = doc;
  const first = doc.items[0];
  const colors = paletteFor(doc.bg, first);
  const dark = isDarkBackground(doc.bg, colors);
  const ordered = [...doc.items].sort((a, b) => (doc.place[a.id]?.z ?? 0) - (doc.place[b.id]?.z ?? 0));

  return (
    <div ref={ref} className="comp" style={{ width: canvas.w, height: canvas.h, background: backgroundCss(doc.bg, colors) }}>
      {doc.bg.kind === 'blur' && first ? (
        <div className="comp-blur" style={{ backgroundImage: `url(${first.src})`, filter: `blur(${Math.round(canvas.w * 0.035)}px) saturate(1.15)` }}>
          <i />
        </div>
      ) : null}
      {doc.bg.grain && doc.bg.kind !== 'clear' ? <div className="comp-grain" style={{ backgroundImage: GRAIN }} /> : null}

      {doc.caption.on ? (
        <div
          className={`comp-caption pos-${doc.caption.pos}`}
          style={{ color: dark ? '#F2F2EE' : '#2E2E2A', top: doc.caption.pos === 'top' ? canvas.h * 0.075 : undefined, bottom: doc.caption.pos === 'bottom' ? canvas.h * 0.075 : undefined }}
        >
          <div className="cap-title" style={{ fontSize: canvas.w * 0.034 }}>{doc.caption.title}</div>
          {doc.caption.sub ? <div className="cap-sub" style={{ fontSize: canvas.w * 0.016 }}>{doc.caption.sub}</div> : null}
        </div>
      ) : null}

      {ordered.map((item) => {
        const p = doc.place[item.id];
        if (!p) return null;
        const w = p.scale * canvas.w;
        const frame = resolveFrame(doc.frame, item);
        const isSel = selected === item.id;
        return (
          <div
            key={item.id}
            className={isSel ? 'comp-item is-selected' : 'comp-item'}
            style={{ left: p.x * canvas.w, top: p.y * canvas.h, width: w, zIndex: p.z + 1, fontSize: w / 100 }}
            onPointerDown={onItemDown ? (e) => onItemDown(e, item.id) : undefined}
          >
            <div className="comp-tilt" style={{ transform: TILTS[doc.tilt] }}>
              <Frame item={item} frame={frame} doc={doc} />
            </div>
            {isSel && onHandleDown ? (
              <div className="sel" data-ui-only="true">
                {(['nw', 'ne', 'sw', 'se'] as Corner[]).map((c) => (
                  <span key={c} className={`handle h-${c}`} onPointerDown={(e) => onHandleDown(e, item.id, c)} />
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
});

export default Composition;
