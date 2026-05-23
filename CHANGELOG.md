# Changelog

All notable changes to SheetSync are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [1.0.2] — 2026-05-23

### Added
- Column mappings: rename Excel columns to different Sheets column names per pair.
- Interval sync: optional timed sync every 5/15/30/60 minutes per pair.
- Sheets polling: detect remote Sheet changes by hash and auto-sync.
- Conflict log: per-cell conflict history viewable in the dashboard.
- OS notifications via plyer after sync outcomes (respects notification setting).
- Search filter in dashboard and activity log (Ctrl+K to focus).
- Sync status dot in topbar.
- `cols` stat displayed per pair.

### Fixed
- `match_column` now correctly mapped through `column_mappings` before merge, preventing a guaranteed SyncError when the match column was also remapped.
- Sheet poller and interval timer now check `status != "syncing"` before firing to prevent concurrent syncs.
- `last_edited_side` no longer set to "sheets" for schedule-triggered syncs.
- `save_settings` numeric coercions now return a proper error response instead of raising an unhandled ValueError.
- Conflict log column names now show original Excel column names instead of Sheets-mapped names.
- `ColumnMappingsEditor` React key fixed to prevent input corruption on delete.
- Timer closures used incorrect `self._app.status` reference (now `self.status`).

---

## [1.0.0] — 2026-05-12

### Added
- PyWebView + glassmorphism web frontend replaces the Flet UI.
- Google OAuth onboarding: user supplies their own Desktop OAuth client JSON.
- Bidirectional Excel ↔ Google Sheets sync with configurable conflict policy.
- File watcher (watchdog) triggers sync on Excel save.
- System tray icon with pause/resume and quick-sync actions.
- Windows installer via Inno Setup (`packaging/installer/SheetSync.iss`).
- Activity log with last 500 events persisted to `%APPDATA%\SheetSync\activity.json`.
- Multi-pair support: manage multiple Excel ↔ Sheet sync pairs.

### Changed
- Runtime state (`config.json`, `token.json`, `activity.json`, `sync_queue.json`)
  written to `%APPDATA%\SheetSync\` in both dev and packaged modes.
- WebView2 private mode enabled — no session data persisted to disk by the browser.
- OAuth scope narrowed: removed `drive.metadata.readonly`; email now fetched via
  OpenID Connect userinfo endpoint.
- `token.json` ACL restricted to current OS user via `icacls` on Windows.

### Security
- OAuth client secret never committed to version control.
- Google refresh token file (`token.json`) has OS-level read protection.
