# Changelog

All notable changes to SheetSync are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Added
- (list new features here)

### Changed
- (list behavior changes here)

### Fixed
- (list bug fixes here)

### Removed
- (list removed features here)

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
