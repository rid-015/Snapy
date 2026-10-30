'use client';

import { BROWSER_BAR, DEVICE } from '@/lib/geometry';
import type { Doc, MediaItem, ResolvedFrame, ShadowKind } from '@/lib/types';

export function shadowCss(kind: ShadowKind, opacity: number) {
  const o = opacity / 100;
  switch (kind) {
    case 'soft':
      return `0 1.6em 4.5em rgba(28, 30, 22, ${0.32 * o})`;
    case 'real':
      return `0 0.3em 0.7em rgba(0, 0, 0, ${0.22 * o}), 0 2.4em 5em rgba(0, 0, 0, ${0.42 * o})`;
    case 'float':
      return `0 5em 8em -1em rgba(0, 0, 0, ${0.62 * o}), 0 0.4em 1em rgba(0, 0, 0, ${0.2 * o})`;
    default:
      return 'none';
  }
}

/**
 * One framed screenshot. Every length is in em; the parent sets font-size to 1% of the
 * item's width, so the frame scales cleanly with zoom and export size.
 */
export default function Frame({ item, frame, doc }: { item: MediaItem; frame: ResolvedFrame; doc: Doc }) {
  const shadow = shadowCss(doc.shadow, doc.shadowOpacity);
  const r = doc.radius / 8; // slider px at 800px-wide reference → em

  if (frame === 'phone' || frame === 'tablet') {
    const d = DEVICE[frame];
    return (
      <div className={`fr fr-device tone-${doc.deviceTone}`} style={{ padding: `${d.bezel}em`, borderRadius: `${d.radius}em`, boxShadow: shadow }}>
        {frame === 'phone' ? <span className="fr-cam" /> : null}
        <img src={item.src} alt="" draggable={false} style={{ borderRadius: `${d.radius - d.bezel * 0.8}em` }} />
      </div>
    );
  }

  if (frame === 'browser') {
    const style = doc.browserStyle;
    return (
      <div className={`fr fr-browser bs-${style}`} style={{ borderRadius: `${r}em`, boxShadow: shadow }}>
        <div className="fr-bar" style={{ height: `${BROWSER_BAR}em` }}>
          <span className="fr-dots"><i /><i /><i /></span>
          {style !== 'glass' ? (
            <span className="fr-nav" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
            </span>
          ) : null}
          <span className="fr-url">{doc.url || ''}</span>
        </div>
        <img src={item.src} alt="" draggable={false} style={style === 'glass' ? { borderRadius: `${Math.max(0, r - 0.8)}em` } : undefined} />
      </div>
    );
  }

  return (
    <div className="fr fr-none" style={{ borderRadius: `${r}em`, boxShadow: shadow }}>
      <img src={item.src} alt="" draggable={false} />
    </div>
  );
}
