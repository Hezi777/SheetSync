<h1 align="center">
  <img width="160" height="160" alt="SheetSync logo" src="src/sheetsync/ui/app_icon.png" />
  <br />
  <b>SheetSync</b>
</h1>

<p align="center">
  A quiet Windows desktop app for syncing local Excel workbooks with Google Sheets.<br />
  Watch files, run manual syncs, manage multiple pairs, and keep OAuth credentials local.
</p>

<p align="center">
  <a href="https://github.com/Hezi777/sheet-sync/releases/latest">
    <img src="https://img.shields.io/github/v/release/Hezi777/sheet-sync?style=for-the-badge&label=release" alt="Latest release" />
  </a>
  <img src="https://img.shields.io/badge/Windows-desktop-111827?style=for-the-badge&logo=windows&logoColor=white" alt="Windows desktop" />
  <img src="https://img.shields.io/badge/Python-backend-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python backend" />
  <img src="https://img.shields.io/badge/React-ui-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React UI" />
  <img src="https://img.shields.io/badge/Inno_Setup-installer-2D3748?style=for-the-badge" alt="Inno Setup installer" />
</p>

<p align="center">
  <a href="#install">Install</a>
  |
  <a href="#features">Features</a>
  |
  <a href="#oauth-setup">OAuth Setup</a>
  |
  <a href="#development">Development</a>
  |
  <a href="#release-build">Release Build</a>
</p>

---

## Overview

SheetSync is built for people who still work in Excel locally but need a reliable Google Sheets mirror. It runs as a desktop app, stores its state on the current PC, and exposes the sync workflow through a local React interface inside PyWebView.

The app does not ship with a shared Google OAuth client. Each user brings their own Google Cloud Desktop OAuth JSON, signs in locally, and can revoke access from Google Account settings.

---

## Install

Download the latest Windows installer from GitHub Releases:

| Release | Installer |
|---|---|
| `v1.0.1` | [`SheetSyncSetup-1.0.1.exe`](https://github.com/Hezi777/sheet-sync/releases/download/v1.0.1/SheetSyncSetup-1.0.1.exe) |

The installer is generated with Inno Setup and installs SheetSync under the current user's local app directory.

---

## Features

| Area | What SheetSync does |
|---|---|
| File watching | Watches configured `.xlsx` files and reacts to local save events |
| Manual sync | Lets users trigger syncs from the desktop dashboard |
| Multi-pair workflow | Supports adding, selecting, pausing, pinning, and removing sync pairs |
| Sync direction | Supports `Bidirectional`, `Excel -> Sheets`, and `Sheets -> Excel` |
| Conflict policy | Supports `Excel wins` and `Sheets wins` |
| Google auth | Uses each user's own OAuth Desktop client JSON |
| Offline state | Records queued/offline attempts for later manual or file-triggered syncs |
| Packaging | Builds both a portable EXE and an Inno Setup installer |

---

## Screenshots

Screenshots are not checked into the repository yet. Add polished dashboard and onboarding captures under `docs/screenshots/`, then reference them here:

| Dashboard | Onboarding |
|---|---|
| `docs/screenshots/dashboard.png` | `docs/screenshots/onboarding.png` |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop shell | PyWebView |
| Backend | Python |
| File watching | watchdog |
| Excel IO | openpyxl |
| Google Sheets | gspread, google-auth, google-auth-oauthlib |
| UI | React, Vite, lucide-react |
| Tray/icon assets | pystray, Pillow |
| Packaging | PyInstaller, Inno Setup |

---

## OAuth Setup

SheetSync needs OAuth because it reads and writes private spreadsheets as the connected Google account. An API key is not enough.

1. Open [Google Cloud Console](https://console.cloud.google.com).
2. Create or select a project.
3. Enable Google Sheets API.
4. Enable Google Drive API.
5. Open APIs & Services, then Credentials.
6. Create an OAuth Client ID.
7. Choose application type `Desktop app`.
8. Download the JSON file.
9. Launch SheetSync, choose the JSON file, and sign in with Google.

---

## Getting Started From Source

### 1. Install Python dependencies

```powershell
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
```

### 2. Install UI dependencies

```powershell
npm install
```

### 3. Build the local UI bundle

```powershell
npm run build
```

### 4. Start the desktop app

```powershell
.\.venv\Scripts\python src\sheetsync_desktop.py
```

---

## Development

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite UI dev server |
| `npm run build` | Build `src/sheetsync/ui/dist` for PyWebView |
| `python -m compileall src scripts` | Validate Python syntax |
| `python scripts/build.py` | Build `dist/SheetSync.exe` |
| `python scripts/build_installer.py` | Build the Inno Setup installer |

The desktop app loads `src/sheetsync/ui/dist/index.html`, so rebuild the UI before packaging or testing the production desktop shell.

---

## Release Build

SheetSync uses Semantic Versioning. See [VERSION.md](VERSION.md).

```powershell
npm run build
python -m compileall src scripts
python scripts\build.py
python scripts\build_installer.py
```

Release outputs:

| File | Purpose |
|---|---|
| `dist\SheetSync.exe` | Portable desktop executable |
| `packaging\installer\Output\SheetSyncSetup-<version>.exe` | Inno Setup installer |

Every public release should:

1. Update `packaging/installer/SheetSync.iss`.
2. Update `VERSION.md`.
3. Build the UI, EXE, and Inno Setup installer.
4. Tag the commit as `v<version>`.
5. Upload the setup EXE to GitHub Releases.

---

## Project Structure

```text
src/
  sheetsync/
    api.py              PyWebView API exposed to the UI
    core/               auth, storage, sync engine, tray, watcher
    ui/                 React/Vite desktop UI
      dist/             built UI loaded by PyWebView
  sheetsync_desktop.py  desktop entry point
assets/
  icons/                source app logo and Windows ICO
packaging/
  installer/            Inno Setup script
scripts/
  build.py              PyInstaller build helper
  build_installer.py    Inno Setup build helper
```

Generated `build/`, root `dist/`, `.spec`, `.exe`, and installer output files are ignored. Publish installers through GitHub Releases, not source control.

---

## Local Data

Runtime data is stored in `%APPDATA%\SheetSync`:

| File | Purpose |
|---|---|
| `config.json` | App settings and sync pair configuration |
| `credentials.json` | User-provided Google OAuth Desktop client |
| `token.json` | Local Google OAuth token |
| `activity.json` | Local sync activity history |
| `sync_queue.json` | Queued/offline sync attempts |

These files are local machine state and should never be committed.

---

## Troubleshooting

| Message | Fix |
|---|---|
| `Choose your own Google OAuth Desktop client JSON before signing in` | Restart onboarding and choose the OAuth Desktop client JSON. |
| `Google account is not connected` | Connect Google from onboarding or Settings. |
| `Excel file not found` | Choose the moved or renamed workbook in Settings. |
| `Waiting for Excel to release file` | Excel is still writing the workbook; SheetSync retries. |
| `Match column 'ID' is missing` | Add the configured match column to both header rows or use row-position matching. |
| `Offline` | SheetSync records the attempted sync and retries on a later manual or Excel-triggered sync. |

---

## Privacy

SheetSync stores OAuth credentials and tokens locally on the user's PC. Spreadsheet data is sent only to Google's APIs for the sheet you configure. OAuth access can be revoked from Google Account security settings.

---

## Legacy Builds

The old Flet version is preserved in git history at commit `5472e82`. Keep legacy installers as release artifacts if needed; do not commit generated `.exe` or setup files into this repository.
