'use client';

import { backgroundCss, paletteFor } from '@/lib/backgrounds';
import { LOOKS } from '@/lib/looks';
import { PALETTES } from '@/lib/palette';
import { MAX_ITEMS, useStore } from '@/lib/store';
import type { BgKind, BrowserStyle, CaptionPos, DeviceTone, FrameType, LayoutKind, ShadowKind, Tilt } from '@/lib/types';
import { Icon, Section, Segmented, Slider, Svg, TextField, Toggle } from './controls';
import { resolveFrame } from '@/lib/geometry';

export const SIZES = [
  { group: 'Ratios', items: [['16:9', 1920, 1080], ['3:2', 1920, 1280], ['4:3', 1920, 1440], ['5:4', 1920, 1536], ['1:1', 1920, 1920], ['4:5', 1536, 1920], ['3:4', 1440, 1920], ['2:3', 1280, 1920], ['9:16', 1080, 1920]] },
  { group: 'Social', items: [['Post 1:1', 1080, 1080], ['Portrait 4:5', 1080, 1350], ['Story 9:16', 1080, 1920], ['Wide post 16:9', 1600, 900], ['Open Graph', 1200, 630]] },
] as const;

export default function Sidebar({ onPick }: { onPick: () => void }) {
  const doc = useStore((s) => s.doc);
  const commit = useStore((s) => s.commit);
  const live = useStore((s) => s.live);
  const applyLook = useStore((s) => s.applyLook);
  const removeItem = useStore((s) => s.removeItem);
  const relayout = useStore((s) => s.relayout);

  const real = doc.items.filter((i) => !i.example);
  const first = doc.items[0];
  const frames = doc.items.map((it) => resolveFrame(doc.frame, it));
  const showBrowser = frames.includes('browser');
  const showDevice = frames.includes('phone') || frames.includes('tablet');
  const onlyDevices = frames.length > 0 && frames.every((f) => f === 'phone' || f === 'tablet');

  return (
    <aside className="side" aria-label="Edit">
      <div className="brand"><i aria-hidden="true" />snapy</div>

      <Section title="Looks">
        <div className="looks">
          {LOOKS.map((l) => {
            const preview = { ...doc, ...l.apply(doc) };
            const bg = preview.bg.kind === 'blur' || preview.bg.kind === 'clear' ? { ...preview.bg, kind: 'mesh' as BgKind } : preview.bg;
            return (
              <button key={l.id} type="button" className="look" aria-pressed={doc.look === l.id} onClick={() => applyLook(l.id)}>
                <span className="look-pv" style={{ background: backgroundCss(bg, paletteFor(preview.bg, first)) }}>
                  <i className={`look-card bs-${preview.frame === 'none' ? 'none' : preview.browserStyle}`} style={{ transform: l.id === 'tilted' ? 'perspective(80px) rotateY(14deg)' : undefined }} />
                </span>
                <span>{l.name}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Screenshots" aside={`${real.length}/${MAX_ITEMS}`}>
        <div className="media">
          {real.map((it) => (
            <div key={it.id} className="media-item">
              <img src={it.src} alt="" />
              <button type="button" className="media-x" aria-label={`Remove ${it.name}`} onClick={() => removeItem(it.id)}>
                <Svg size={12}><path d="M6 6l12 12M18 6L6 18" /></Svg>
              </button>
            </div>
          ))}
          {real.length < MAX_ITEMS ? (
            <button type="button" className="media-add" onClick={onPick}>
              <Svg size={16}><path d="M12 5v14M5 12h14" /></Svg>
              <span>{real.length ? 'Add' : 'Add yours'}</span>
            </button>
          ) : null}
        </div>
        <p className="hint">Drop or paste (⌘V) anywhere to add.</p>
      </Section>

      <Section title="Layout" defaultOpen={real.length > 1}>
        <Segmented<LayoutKind>
          label="Layout"
          value={doc.layout === 'single' ? 'side' : doc.layout}
          onChange={(v) => commit({ layout: v })}
          options={[
            { value: 'side', label: 'Side by side', disabled: doc.items.length < 2 },
            { value: 'overlap', label: 'Overlap', disabled: doc.items.length < 2 },
            { value: 'combo', label: 'Combo', disabled: doc.items.length < 2 },
          ]}
        />
        {doc.items.length < 2 ? <p className="hint">Add a second screenshot to arrange them.</p> : null}
        <button type="button" className="ghost" onClick={relayout}>Reset positions</button>
      </Section>

      <Section title="Frame">
        <Segmented<FrameType>
          label="Frame"
          value={doc.frame}
          onChange={(v) => commit({ frame: v })}
          options={(['auto', 'browser', 'phone', 'tablet', 'none'] as const).map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1), icon: <Svg>{Icon[v]}</Svg> }))}
        />
        {showBrowser ? (
          <Segmented<BrowserStyle>
            label="Browser style"
            value={doc.browserStyle}
            onChange={(v) => commit({ browserStyle: v })}
            options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'glass', label: 'Glass' }]}
          />
        ) : null}
        {showBrowser && doc.browserStyle !== 'glass' ? (
          <TextField label="Address bar" value={doc.url} placeholder="yoursite.com" onChange={(v) => live({ url: v })} />
        ) : null}
        {showDevice ? (
          <Segmented<DeviceTone>
            label="Device colour"
            value={doc.deviceTone}
            onChange={(v) => commit({ deviceTone: v })}
            options={[{ value: 'dark', label: 'Dark device' }, { value: 'light', label: 'Light device' }]}
          />
        ) : null}
        <Slider label="Corner radius" value={doc.radius} min={0} max={40} unit=" px" disabled={onlyDevices} onChange={(v) => live({ radius: v })} />
      </Section>

      <Section title="Tilt">
        <Segmented<Tilt>
          label="Tilt"
          value={doc.tilt}
          onChange={(v) => commit({ tilt: v })}
          options={[{ value: 'flat', label: 'Flat' }, { value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }, { value: 'iso', label: 'Iso' }]}
        />
      </Section>

      <Section title="Shadow">
        <Segmented<ShadowKind>
          label="Shadow"
          value={doc.shadow}
          onChange={(v) => commit({ shadow: v })}
          options={[{ value: 'none', label: 'None' }, { value: 'soft', label: 'Soft' }, { value: 'real', label: 'Realistic' }, { value: 'float', label: 'Float' }]}
        />
        <Slider label="Strength" value={doc.shadowOpacity} min={0} max={100} step={5} unit="%" disabled={doc.shadow === 'none'} onChange={(v) => live({ shadowOpacity: v })} />
      </Section>

      <Section title="Background">
        <Segmented<BgKind>
          label="Background type"
          value={doc.bg.kind}
          onChange={(v) => commit({ bg: { ...doc.bg, kind: v } })}
          options={[{ value: 'mesh', label: 'Mesh' }, { value: 'linear', label: 'Gradient' }, { value: 'solid', label: 'Solid' }, { value: 'blur', label: 'Blur' }, { value: 'clear', label: 'None' }]}
        />
        {doc.bg.kind !== 'clear' && doc.bg.kind !== 'blur' ? (
          <div className="palettes" role="radiogroup" aria-label="Colours">
            <button type="button" role="radio" aria-checked={doc.bg.paletteId === 'auto'} className="pal" title="From your screenshot" aria-label="Colours from your screenshot" onClick={() => commit({ bg: { ...doc.bg, paletteId: 'auto' } })}>
              <span style={{ background: backgroundCss({ ...doc.bg, kind: 'mesh' }, first?.palette ?? PALETTES[0].colors) }} />
              <em>Auto</em>
            </button>
            {PALETTES.map((p) => (
              <button key={p.id} type="button" role="radio" aria-checked={doc.bg.paletteId === p.id} className="pal" title={p.name} aria-label={p.name} onClick={() => commit({ bg: { ...doc.bg, paletteId: p.id } })}>
                <span style={{ background: backgroundCss({ ...doc.bg, kind: 'mesh' }, p.colors) }} />
              </button>
            ))}
            <label className={doc.bg.paletteId === 'custom' ? 'pal pal-custom is-on' : 'pal pal-custom'} title="Custom colour">
              <span style={{ background: doc.bg.custom }} />
              <input type="color" value={doc.bg.custom} aria-label="Custom colour" onFocus={() => useStore.getState().begin()} onChange={(e) => live({ bg: { ...doc.bg, paletteId: 'custom', custom: e.target.value } })} />
            </label>
          </div>
        ) : null}
        {doc.bg.kind === 'linear' ? <Slider label="Angle" value={doc.bg.angle} min={0} max={360} step={5} unit="°" onChange={(v) => live({ bg: { ...doc.bg, angle: v } })} /> : null}
        {doc.bg.kind !== 'clear' ? <Toggle label="Film grain" checked={doc.bg.grain} onChange={(v) => commit({ bg: { ...doc.bg, grain: v } })} /> : null}
        {doc.bg.kind === 'clear' ? <p className="hint">Exports with a transparent background.</p> : null}
      </Section>

      <Section title="Caption" defaultOpen={false} aside={doc.caption.on ? 'On' : 'Off'}>
        <Toggle label="Show caption" checked={doc.caption.on} onChange={(v) => commit({ caption: { ...doc.caption, on: v } })} />
        {doc.caption.on ? (
          <>
            <TextField label="Headline" value={doc.caption.title} onChange={(v) => live({ caption: { ...doc.caption, title: v } })} />
            <TextField label="Subtext" value={doc.caption.sub} placeholder="Optional" onChange={(v) => live({ caption: { ...doc.caption, sub: v } })} />
            <Segmented<CaptionPos> label="Caption position" value={doc.caption.pos} onChange={(v) => commit({ caption: { ...doc.caption, pos: v } })} options={[{ value: 'top', label: 'Above' }, { value: 'bottom', label: 'Below' }]} />
          </>
        ) : null}
      </Section>
    </aside>
  );
}
