'use client';

import { useId, type ReactNode } from 'react';
import { useStore } from '@/lib/store';

export function Section({ title, children, defaultOpen = true, aside }: { title: string; children: ReactNode; defaultOpen?: boolean; aside?: ReactNode }) {
  return (
    <details className="sec" open={defaultOpen}>
      <summary>
        <span>{title}</span>
        {aside ? <span className="sec-aside">{aside}</span> : null}
        <svg className="chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
      </summary>
      <div className="sec-body">{children}</div>
    </details>
  );
}

export interface SegOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export function Segmented<T extends string>({ label, value, options, onChange, columns }: {
  label: string;
  value: T;
  options: SegOption<T>[];
  onChange: (v: T) => void;
  columns?: number;
}) {
  return (
    <div className="seg" role="radiogroup" aria-label={label} style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={o.disabled}
          className={o.icon ? 'seg-btn has-icon' : 'seg-btn'}
          onClick={() => onChange(o.value)}
        >
          {o.icon}
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/** A slider that records one undo step per drag instead of one per pixel. */
export function Slider({ label, value, min, max, step = 1, unit = '', onChange, disabled }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const begin = useStore((s) => s.begin);
  return (
    <div className={disabled ? 'slider is-disabled' : 'slider'}>
      <label htmlFor={id}>{label}</label>
      <output htmlFor={id}>{value}{unit}</output>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onPointerDown={begin}
        onKeyDown={(e) => { if (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End') begin(); }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <label className="toggle" htmlFor={id}>
      <span>{label}</span>
      <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <i aria-hidden="true" />
    </label>
  );
}

/** Text field that saves one undo step per editing session. */
export function TextField({ label, value, placeholder, onChange }: { label: string; value: string; placeholder?: string; onChange: (v: string) => void }) {
  const id = useId();
  const begin = useStore((s) => s.begin);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="text" value={value} placeholder={placeholder} autoComplete="off" spellCheck={false} onFocus={begin} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

export const Icon = {
  auto: <path d="M12 3l1.8 4.7L18.5 9l-4.7 1.8L12 15.5l-1.8-4.7L5.5 9l4.7-1.3z" />,
  browser: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18" /></>,
  laptop: <><rect x="5" y="5" width="14" height="10" rx="1.5" /><path d="M2.5 18.5h19" /></>,
  phone: <><rect x="7" y="3" width="10" height="18" rx="2.5" /><path d="M11 18h2" /></>,
  tablet: <><rect x="4.5" y="3" width="15" height="18" rx="2" /><path d="M11 18h2" /></>,
  none: <rect x="4" y="6" width="16" height="12" rx="2" />,
};

export function Svg({ children, size = 18 }: { children: ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}
