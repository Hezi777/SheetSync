# SheetSync

SheetSync is a Windows desktop app that keeps one local Excel `.xlsx` workbook and one Google Sheet in sync. The desktop shell is PyWebView, the backend is Python, and the UI is a local React view loaded from `src/sheetsync/ui`.

## What It Does

- Watches the configured Excel workbook and syncs after local saves.
- Supports manual sync for Google Sheet edits.
- Supports `Bidirectional`, `Excel -> Sheets`, and `Sheets -> Excel` modes.
- Uses a clear conflict policy: `Excel wins` or `Sheets wins`.
- Stores configuration, activity, OAuth client JSON, and OAuth token locally.

## OAuth Setup

SheetSync does not ship with a developer-owned Google OAuth client. Each user supplies their own OAuth Desktop client JSON during onboarding.

1. Open https://console.cloud.google.com.
2. Create or select a project.
3. Enable Google Sheets API.
4. Enable Google Drive API.
5. Open APIs & Services, then Credentials.
6. Create an OAuth Client ID.
7. Choose application type `Desktop app`.
8. Download the JSON file.
9. On first launch, choose that JSON file or paste its contents into SheetSync.

An API key is not enough. SheetSync needs OAuth because it reads and writes private spreadsheets as the connected Google account.

## Project Layout

```text
src/
  sheetsync/
    api.py              PyWebView API exposed to the UI
    core/               sync, auth, storage, tray, watcher
    ui/                 local React UI loaded by PyWebView
  sheetsync_desktop.py  desktop entry point
assets/                 app icon and example OAuth file
packaging/installer/    Inno Setup script
scripts/                build helpers
```

Generated `build/`, `dist/`, `.spec`, `.exe`, and installer output files are intentionally ignored. Publish those from GitHub Releases or CI artifacts, not from source control.

## Run From Source

```powershell
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\python src\sheetsync_desktop.py
```

## Build

```powershell
.\.venv\Scripts\python scripts\build.py
```

The executable is written to `dist\SheetSync.exe`.

To build the Windows installer after the executable exists:

```powershell
.\.venv\Scripts\python scripts\build_installer.py
```

The installer output is written under `packaging\installer\Output`.

## Legacy Builds

The old Flet version is preserved in git history at commit `5472e82`. Keep legacy installers as release artifacts if needed; do not commit generated `.exe` or setup files into this repository.

## Troubleshooting

- `Choose your own Google OAuth Desktop client JSON before signing in`: restart onboarding and choose or paste the OAuth Desktop client JSON.
- `Google account is not connected`: connect Google from onboarding or Settings.
- `Excel file not found`: choose the moved or renamed workbook in Settings.
- `Waiting for Excel to release file`: Excel is still writing the workbook; SheetSync retries.
- `Match column 'ID' is missing`: add the configured match column to both header rows or use row-position matching.
- `Offline`: the app records that a sync was attempted offline and retries on a later manual or Excel-triggered sync.

## Privacy

SheetSync stores local state (config, tokens, activity) in `%APPDATA%\SheetSync` in both source and packaged modes. Spreadsheet data is sent only to Google's APIs for the sheet you configure. OAuth access can also be revoked from your Google Account security settings.
