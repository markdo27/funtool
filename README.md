# PUSHTYPE — Push & Type Poster Studio

A browser-based creative tool for making typographic posters with 3D depth.  
Load an image, sculpt it into stacked 3D cube columns, then layer text over it in any direction.

---

## ✨ Features

### PUSH Mode
- Loads any image and slices it into a configurable grid of cells
- Each cell becomes a **column of 3D cubes** rendered with Three.js (instanced mesh + custom GLSL shader)
- **Select** cells by clicking or drag-selecting, then **push forward / pull back** with `↑ / ↓` or `W / S`
- Shift-drag to add to an existing selection; `Esc` to deselect all
- Adjustable **Cell Size**, **Stack Depth**, **Push Step**, and **Camera Angle** (Tilt X/Y, Zoom/FOV)
- Undo / Reset history (up to 30 steps)

### TYPE Mode
- Place a text cursor anywhere on the canvas by clicking
- Type freely in **5 directions**: Right, Left, Down, Up, Radial
- Per-layer controls: **font**, size, letter spacing, opacity, bold/italic, color (presets + custom picker)
- Multiple independent text layers with a layer list panel — delete or switch layers easily
- Text Z-depth auto-syncs with the push grid beneath it (text "sits on" the cubes)

### Export
- **Export PNG** — flattens both the 3D push canvas and all type layers to a single high-resolution PNG

---

## 🖥️ Usage

The main deliverable is a **single self-contained HTML file** — no build step required.

1. Open `index.html` in any modern browser
2. **Drop an image** onto the canvas, click **↑ Load Image**, or paste from clipboard (`Ctrl+V`)
3. Switch between **PUSH** and **TYPE** modes using the left panel
4. Export your poster with **↓ Export PNG**

### Keyboard Shortcuts

| Key | Action |
|---|---|
| `P` | Switch to Push mode |
| `T` | Switch to Type mode |
| `↑` / `W` | Push selected cells forward |
| `↓` / `S` | Pull selected cells back |
| `Ctrl+Z` | Undo |
| `E` | Export PNG |
| `Esc` | Deselect all / deselect type layer |
| `Backspace` | Delete last character (type mode) |
| `Enter` | New line (type mode) |

---

## 🏗️ Project Structure

```
newfuntool/
├── index.html          # ← Main app (fully standalone, no build needed)
├── push-src/           # React + TypeScript source for the Push engine variant
│   ├── src/
│   │   ├── App.tsx
│   │   ├── State.tsx       # Three.js push state
│   │   ├── TypeLayer.tsx   # Canvas 2D type overlay
│   │   ├── TypeState.tsx   # Type cursor & layer management
│   │   ├── Bars.tsx        # UI toolbar
│   │   └── ...
│   └── package.json
└── type-src/           # React + TypeScript source for the Type engine variant
    ├── src/
    │   ├── App.tsx
    │   ├── Text.tsx
    │   ├── State.tsx
    │   └── ...
    └── package.json
```

> `push-src` and `type-src` are the original React development sources.  
> `index.html` is the unified, compiled-and-inlined production version combining both engines.

---

## 🛠️ Tech Stack

- **Three.js** (v0.157) — 3D rendering, instanced mesh, custom GLSL shaders
- **Canvas 2D API** — directional text cursor and type layer compositing
- **Vanilla HTML/CSS/JS** — zero runtime dependencies in `index.html`
- **React + TypeScript** — used in `push-src` / `type-src` development sources
- **Google Fonts** — JetBrains Mono, Space Grotesk, Bebas Neue, Anton, Archivo Black

---

## 🚀 Running the Source Projects

```bash
# Push source
cd push-src
npm install
npm start

# Type source
cd type-src
npm install
npm start   # or yarn start
```

---

## License

MIT
