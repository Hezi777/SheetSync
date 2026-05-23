# SheetSync

A PyWebView desktop app that syncs Excel workbooks with Google Sheets — bidirectionally, in real time, on Windows.

## Stack

| Layer | Technology |
|---|---|
| Desktop shell | Python 3 + PyWebView (`sheetsync_desktop.py`) |
| Frontend | React 18, single file: `src/sheetsync/ui/app.jsx` |
| Build | Vite 6 — `package.json` at project root |
| Icons | lucide-react |
| Font | Satoshi (local woff2, bundled in `ui/fonts/`) |

## Key files

```
sheetsync_desktop.py          entry point — window lifecycle, tray, event dispatch
src/sheetsync/
  api.py                      Python methods exposed to JS via pywebview bridge
  core/
    syncer.py                 Excel ↔ Sheets diff + write logic
    storage.py                config JSON, pair lifecycle, interval timers
  ui/
    app.jsx                   entire frontend (one file — do not split)
    index.html                CSS design tokens + font declarations (all CSS lives here)
    dist/                     Vite output — committed, ships inside the Python package
```

## Workflows

**Dev — browser, no Python needed:**
```sh
node_modules/.bin/vite --port 3000
```
`app.jsx` injects a full `window.pywebview` mock when PyWebView is absent. The UI runs completely in-browser with 3 fake pairs and a populated activity log.

**Build:**
```sh
node_modules/.bin/vite build
```
Output goes to `src/sheetsync/ui/dist/`. Always commit `dist/` — it ships inside the Python package.

**Run the desktop app:**
```sh
python sheetsync_desktop.py
```

## Architecture constraints

- **`app.jsx` is one file.** All React components live there by design — do not create a `components/` directory.
- **All CSS lives in `index.html`.** Design tokens are CSS custom properties on `:root`. Dark/light theme is driven by `body[data-theme="light"]` overrides. Do not add a separate `.css` file.
- **JS ↔ Python bridge:** `window.pywebview.api.*` calls are async Promises. Python pushes live events to the UI via `window.__ss_event(event)` — wired in the `useEffect` at the bottom of `App`.
- **Config is a JSON file.** `storage.py` manages it. There is no database.
- **`plyer`** sends OS notifications after sync outcomes.
- **Committed dist:** `src/sheetsync/ui/dist/` is in git and must be rebuilt and recommitted after any UI change that will ship.
