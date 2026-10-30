# Snapy

Beautiful mockups in easy clicks. Turn a screenshot into a beautiful mockup in one drop. Free, no sign-up, nothing uploaded.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
```

## What it does

- **Add screenshots:** drop anywhere, paste with ⌘V, or click Add. Up to 3 at once.
- **Looks:** one-click styles (Mesh, Glass, Charcoal, Soft, Tilted, Plain). The default background is built from your screenshot's own colours.
- **Direct editing:** drag to move, scroll or pinch to zoom, corner handles to resize. Arrow keys nudge (Shift for bigger steps).
- **Layouts:** side by side, overlap, or combo (wide screenshot behind, tall one in front).
- **Frames:** auto, browser (light, dark, glass, with address bar), laptop, phone, tablet, none. Corner radius.
- **Tilt:** flat, left, right, isometric.
- **Shadow:** none, soft, realistic, float, with strength.
- **Background:** mesh, gradient, solid, blur of your screenshot, or transparent; palettes, custom colour, film grain.
- **Caption:** headline and subtext above or below.
- **Watermark:** text and/or a logo in any corner, with opacity. Remembered with your look.
- **Canvas:** ratio and social presets, or a custom size.
- **Export:** Copy (⌘C) or Download at 1×, 2× or 3× (⌘S) as PNG, JPG or WebP, with a quality slider for JPG and WebP.
- **Undo/redo:** ⌘Z and ⇧⌘Z. Your last look is remembered.

## Shortcuts

| Keys | Action |
| --- | --- |
| ⌘V | Paste a screenshot |
| ⌘O | Choose files |
| ⌘C | Copy image |
| ⌘S | Download (2×, in the chosen format) |
| ⌘Z / ⇧⌘Z | Undo / redo |
| Arrows | Nudge selected screenshot |
| Delete | Remove selected screenshot |
| Esc | Deselect |

## How it's built

- Next.js 14 (App Router), React 18, TypeScript, Geist.
- `lib/store.ts`: Zustand store with undo/redo history; looks persist to localStorage.
- `components/Composition.tsx`: the image at its real pixel size, built from DOM and CSS. The stage scales it to fit; export renders it untouched with `html-to-image`.
- `lib/geometry.ts`: frame sizes (in em, 1em = 1% of item width) and automatic layouts.
- `lib/palette.ts`: reads soft colours from a screenshot for automatic backgrounds.

## Known limits

- Images only (PNG, JPG, WebP, GIF, AVIF). Video is out of scope for now.
- Copy needs a browser that supports writing images to the clipboard (current Chrome, Edge, Safari).
- Very large canvases at 3× can be slow on low-memory devices.
