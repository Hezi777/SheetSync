# Audit 7 — Visual/Design Layer

**Scope:** `src/sheetsync/ui/` (Vite + React). No separate CSS files exist. All styling lives in a single `<style>` block inside `src/sheetsync/ui/index.html` (lines 7–1245, ~40 CSS custom properties in `:root` / `body[data-theme="light"]`), plus scattered inline `style={{...}}` objects in `app.jsx`. `icons.jsx` defines a second, complete icon component library that is never imported anywhere (dead code) — `app.jsx` renders icons through its own `Icon` wrapper around `lucide-react` instead.

This is READ-ONLY. No source files were modified.

## Design tokens
- **Finding:** A real token system exists as CSS custom properties in `index.html` lines 38–77 (dark, default) and 79–107 (`body[data-theme="light"]` override). Covers brand color (`--green: #16a34a`), primary CTA (`--primary`, `--on-primary`), a 4-step surface ladder (`--canvas`, `--surface`, `--surface-soft`, `--control`, `--shell`), border tiers (`--hairline`, `--hairline-soft`, `--hairline-strong`), a text ladder (`--ink`, `--charcoal`, `--slate`, `--steel`, `--stone`), and semantic colors (`--error`, `--teal`, `--yellow`, `--peach`, `--mint`, `--navy`, `--cream`). Radius is not tokenized — recurring literal values are `6px`, `7px`, `8px`, `10px`, `12px`, `14px`, `16px`, `999px` (pill). Shadow is explicitly disabled: `--shadow: none; --shadow-large: none;` (index.html:71–73), yet real box-shadows are hardcoded all over the file anyway (see Inconsistency).
- **Inconsistency:** The tokens declare shadows off (`--shadow: none`), but `.glass-onboarding` (index.html:1000–1002), `.toast` (index.html:1209), `.nav-btn.active` (index.html:238–240), and `.pair-row-card.active` (index.html:727) all hardcode their own one-off `box-shadow` values instead of using a token — the "no shadows" rule in the token layer is fiction. Also, hairline color is redefined ad hoc in `app.jsx` inline styles (`rgba(255,255,255,0.06)` at line 763) instead of referencing `var(--hairline)`, so table borders silently ignore the theme system and stay wrong in light mode.

## Type scale
- **Finding:** No type-scale system (no clamp, no `--font-size-*` tokens). Sizes are literal px values scattered through the stylesheet: `10px` (nav-label, pair-row-stats caption), `11px` (pair-link, project-row span, kbd, count-pill, state-pill), `12px` (btn, crumbs, page-sub, tiny-badge, section-head p), `13px` (card-sub, project-row strong, settings-status-row strong, table font in ConflictModal inline style line 751), `14px` (path-box strong, search input, file-drop), `15px` (card-title, brand-block h2), `22px` (simple-step h3), `28px` (page-title), `30px` (overlay-head h2), `38px` (stat-value). Weights used: `500`, `650` (a non-standard weight — most fonts don't have a native 650 cut and it silently falls back), `700`.
- **Inconsistency:** `font-weight: 650` appears at index.html:204, 296, 486, 557, 667, 823 — six uses of a weight most font files (including the loaded Satoshi, which only ships 400/500/700/900) don't actually have; the browser synthesizes/rounds it, so it's indistinguishable from 700 in practice but reads as a deliberate scale step it isn't. `38px` (`.stat-value`, index.html:563) and `30px` (`.overlay-head h2`, index.html:1044) each appear exactly once — one-off sizes with no reuse anywhere else, i.e. no real scale, just per-component picks.

## Spacing
Arbitrary/hardcoded spacing values (padding, margin, gap), file + line:
- `index.html:154` `.vertical-nav` padding `14px 8px`
- `index.html:163` `.brand-block` padding `0 8px 22px`
- `index.html:187` `.nav-label` padding `8px 8px 7px`
- `index.html:287` `.topbar` padding `0 14px 0 18px`
- `index.html:453` `.content` padding `18px 22px 26px` (overridden to `16px` flat at `index.html:1241` under the 760px breakpoint — two different paddings for the same element)
- `index.html:519` `.card` padding `16px`
- `index.html:604` `.sync-hub` padding `16px` (duplicate literal of `.card`, not derived from it)
- `index.html:620` `.path-box` padding `12px`
- `index.html:704` `.sync-detail-panel` padding `14px`
- `index.html:1080` `.overlay-body` padding `22px`
- `index.html:1126` `.file-drop` padding `0 12px`
- `app.jsx:378` inline `style={{ height: 32, padding: "0 10px" }}` on the "View all" button — a one-off button height that doesn't match `.btn` (`36px`) or `.btn.compact` (`28px`)
- `app.jsx:710` inline `style={{ marginTop: 12 }}` (ColumnMappingsEditor field wrapper)
- `app.jsx:713` inline `style={{ display: "flex", gap: 6, marginBottom: 4 }}`
- `app.jsx:717` inline `style={{ padding: "0 8px" }}` on the remove-row button
- `app.jsx:720` inline `style={{ marginTop: 4 }}` on "Add mapping"
- `app.jsx:735` inline `cellStyle = { padding: "4px 8px" }` (ConflictModal table cells)
- `app.jsx:738` inline `style={{ maxWidth: 720, maxHeight: "80vh", overflow: "auto" }}` on the conflict modal — a max-width duplicated from `.glass-onboarding`'s `min(720px, 100%)` (index.html:996) as a raw number instead of reusing the class or a token
- `index.html:637` `.project-row` grid-template-columns `26px 1fr`
- `index.html:713` `.pair-row-card` padding `12px`

- **Inconsistency:** Two parallel spacing vocabularies exist — CSS-class spacing in `index.html` (mostly steps of ~4–8px) and ad-hoc inline `style={{}}` spacing in `app.jsx` (`ColumnMappingsEditor`, `ConflictModal`, the "View all" button) that was clearly bolted on later and never promoted into the stylesheet. The inline spacing doesn't reuse any of the CSS values consistently (e.g. `gap: 6` in app.jsx:713 vs `gap: 8`/`gap: 10` used everywhere in index.html for similar flex rows).

## Layout containers
- **Finding:** Two container widths govern the app: the fixed 198px sidebar (`.frame` grid-template-columns, index.html:137) and a `min(720px, 100%)` modal width used by `.glass-onboarding` (index.html:996). `.content` padding is `18px 22px 26px` (index.html:453), collapsing to `16px` under 760px (index.html:1241).
- **Inconsistency:** The Conflict modal (`app.jsx:738`) reuses the `.glass-onboarding` class but overrides its width with an inline `maxWidth: 720` — same number as the token-less `min(720px, 100%)`, restated as a raw literal rather than shared. There's no single "modal max-width" constant; it's copy-pasted. Card padding is also inconsistent: `.card` uses `16px` (index.html:519), but `.sync-detail-panel` uses `14px` (index.html:704) and `.overlay-body` uses `22px` (index.html:1080) — three different paddings for what are visually the same kind of panel.

## Responsive
- **Finding:** Two real breakpoints exist, both in `index.html`: `@media (max-width: 1120px)` (index.html:1225–1238, collapses to single-column, hides the sidebar, shows the mobile nav trigger) and `@media (max-width: 760px)` (index.html:1239–1244, hides the topbar search, shrinks content padding, stacks the sync-paths arrow). This is genuine, non-trivial responsive CSS — not a token-free codebase on that front.
- **Inconsistency:** Responsiveness is 100% media-query-driven; there is zero JS-based responsive logic (no `matchMedia`, no resize listeners, no conditional className-by-viewport in `app.jsx`) apart from `MobileNav`'s open/close state, which is a manual toggle, not breakpoint detection — so the mobile drawer only appears because CSS hides `.sidebar` and reveals `.mobile-nav-trigger`; React itself is breakpoint-blind. No container queries are used anywhere, even though several components (`.card`, `.pair-row-card`) are reused in contexts of very different available widths (dashboard grid vs. settings sidebar list).

## Motion
- **Finding:** All transitions/animations, file + line:
  - `.nav-btn` transition: `background 150ms ease, color 150ms ease, transform 150ms ease, box-shadow 150ms ease` (index.html:210)
  - `.nav-btn::before` transition: `opacity 150ms ease` (index.html:221)
  - `.pair-row-card` transition: `border-color 150ms ease, background 150ms ease, transform 150ms ease` (index.html:714)
  - `.settings-pair` transition: `background 150ms ease, border-color 150ms ease, transform 150ms ease` (index.html:867)
  - `.switch::after` transition: `transform 150ms ease` (index.html:973)
  - `@keyframes toast-in` (index.html:1214–1217), applied via `.toast { animation: toast-in 200ms ease; }` (index.html:1210)
  - `@keyframes spin` (index.html:1221), applied via `.spin { animation: spin 900ms linear infinite; }` (index.html:1222) — used for the loading spinner in `ConflictModal` (app.jsx:748)
- **Inconsistency:** Duration/easing is otherwise consistent (`150ms ease` for nearly every hover/state transition), which is the one place this codebase does show real discipline. The only outliers are the two keyframe animations (`200ms ease` for toast-in, `900ms linear` for spin) — reasonable given they're categorically different (entrance vs. continuous loading), not really a violation. No transitions exist on `.btn`, `.input`, `.select`, or `.card` hover/focus states at all — interactive controls elsewhere in the app (nav, pair cards, settings rows) animate, but the most common `.btn` element in the whole UI has no transition property, so its `:disabled` opacity change (index.html:507) and focus-visible state (index.html:716–719 for `.pair-row-card` only, not `.btn`) snap instantly. That's an inconsistency in interaction feel, not just code style.

## Fonts
- **Finding:** One custom typeface, "Satoshi," self-hosted via four `@font-face` declarations for weights 400/500/700/900 (index.html:8–35, files under `fonts/satoshi-*.woff2`). Applied globally through `--font: "Satoshi", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif;` (index.html:75) set on `body` (index.html:114). A separate monospace stack, `--mono: "SFMono-Regular", "Cascadia Mono", Consolas, ui-monospace, monospace` (index.html:76), is used only for `.kbd` (index.html:396) and `.textarea` (index.html:1169).
- **Inconsistency:** The stylesheet declares `font-weight: 650` in six places (see Type scale) despite only 400/500/700/900 being loaded — those rules request a weight that was never shipped, so the browser is silently substituting the nearest available cut (almost certainly 700) instead of what the source visually implies as an in-between step.

## Verdict

There's a real, intentional design system underneath this — a genuine two-theme CSS variable ladder (surfaces, borders, text, semantic colors), a consistent `150ms ease` motion vocabulary, and two working responsive breakpoints. That's more discipline than "no CSS files" suggests at first glance; someone built this with an actual system in mind, once, inside `index.html`.

But it has decayed into a pile of one-off decisions layered on top. The moment the code needed anything beyond the original component set — the conflict modal, the column-mappings editor, the "View all" button — the pattern was abandoned in favor of raw inline `style={{}}` objects in `app.jsx` that duplicate values (`720` max-width, `4px 8px` padding) instead of reusing the tokens or classes already sitting in `index.html`. Radius and spacing were never tokenized to begin with, so every component picked its own `12px`/`14px`/`16px`/`22px` padding independently, several of them visually equivalent but numerically different for no reason (`.card` 16px vs `.sync-detail-panel` 14px vs `.overlay-body` 22px). The declared "no shadows" token is violated by four hardcoded box-shadows. And `icons.jsx` — a full second icon component library, own default size, own stroke width — is dead code that isn't imported anywhere, evidence of an abandoned earlier direction nobody cleaned up.

Net: a coherent system was designed once, then extended ad hoc without discipline. It's salvageable — the CSS variable layer is solid — but the newer surfaces (modals, editors) already don't follow it, which is exactly the failure mode that turns a design system into a pile of one-offs if left unaddressed.
