# SheetSync

SheetSync is a native Python desktop app that syncs a local Excel workbook with a Google Sheet whenever the Excel file is saved. It uses Flet for the desktop UI, watchdog for file events, openpyxl for Excel, and gspread with Google OAuth for Sheets.

## Screenshots

![Dashboard placeholder](https://placehold.co/1200x720/111113/FAFAFA?text=SheetSync+Dashboard)

![Onboarding placeholder](https://placehold.co/1200x720/18181B/FAFAFA?text=SheetSync+Onboarding)

## Features

- Four-step onboarding for OAuth credentials, Google sign-in, file selection, and sync preferences.
- Real-time Excel save detection with a 1.5 second debounce.
- Bidirectional, Excel-to-Sheets, and Sheets-to-Excel sync modes.
- Conflict policies for last modified, Excel wins, and Sheets wins.
- Missing file, locked Excel file, missing match column, expired token, deleted sheet, offline queue, and crash recovery states.
- Dashboard, activity log, CSV export, settings, theme switching, and local config persistence.
- Local-only `config.json`, `token.json`, sync queue, and activity history.

## Quick start

```powershell
cd "c:\Users\Hen\Documents\Projects\Active\Excel Sync"
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\python main.py
```

## Google Cloud Setup

1. Go to https://console.cloud.google.com.
2. Create a new project from the project selector.
3. Open APIs & Services, then Library.
4. Enable Google Sheets API.
5. Enable Google Drive API.
6. Open APIs & Services, then Credentials.
7. Choose Create Credentials, then OAuth Client ID.
8. If prompted, configure the OAuth consent screen for an external or internal desktop app.
9. Select Desktop app as the OAuth client type.
10. Download the JSON file.
11. Download the JSON file.
12. On first launch, choose the downloaded JSON file or paste its contents into SheetSync.

An API key is not enough for SheetSync because the app needs private read/write access to your Google Sheet as your Google account. Use an OAuth Desktop client JSON file.

## Running from source

```powershell
cd "c:\Users\Hen\Documents\Projects\Active\Excel Sync"
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\python main.py
```

The first launch opens onboarding. First choose or paste the OAuth Desktop client JSON from Google Cloud. Google OAuth then runs in your browser and stores the resulting token locally in `token.json`.

## Building the .exe

Run:

```powershell
cd "c:\Users\Hen\Documents\Projects\Active\Excel Sync"
.\.venv\Scripts\python build.py
```

The build script runs:

```powershell
flet pack main.py --name SheetSync --icon assets/icons/app.ico
```

## Troubleshooting

- `credentials.json is missing`: restart onboarding or place an OAuth Desktop client JSON beside `main.py`.
- `Paste or choose a Google OAuth client JSON file, not an API key`: Google API keys cannot perform this private bidirectional sync. Create an OAuth Desktop client instead.
- `Google session expired`: disconnect and reconnect the account from Settings.
- `Excel file not found`: use Settings to locate the moved or renamed workbook.
- `Waiting for Excel to release file`: Excel is still writing the workbook; SheetSync retries automatically.
- `Match column 'ID' is missing`: add the configured match column to both the Excel header row and Google Sheet header row.
- `Offline`: SheetSync queues the change locally and retries when the next sync is triggered with internet available.
- Build fails on icon: add a Windows `.ico` file at `assets/icons/app.ico`.

## Privacy note

SheetSync stores configuration, OAuth tokens, queued sync metadata, and activity history locally on your machine. Spreadsheet data is sent only to Google's official APIs for the Google Sheet you connect.
