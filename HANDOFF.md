# Windows Build Handoff — SheetSync v1.0.2

## What was just done (on Mac)

- Added column mappings, interval sync, Sheets polling, conflict log, OS notifications, search, and topbar status dot
- Fixed 7 bugs (see CHANGELOG.md for full list)
- Code simplified and reviewed
- UI rebuilt (`vite build`)
- All changes committed and pushed to `main`

## What you need to do on Windows

### 1. Pull latest

```bat
git pull
```

### 2. Build the executable

```bat
python scripts/build.py
```

Produces: `dist/SheetSync.exe`

### 3. Build the installer

```bat
python scripts/build_installer.py
```

Produces: `packaging/installer/Output/SheetSyncSetup-1.0.2.exe`

Requires Inno Setup 6. If not installed:
```bat
winget install JRSoftware.InnoSetup
```

### 4. Create the GitHub release

```bat
gh release create v1.0.2 packaging/installer/Output/SheetSyncSetup-1.0.2.exe --title "SheetSync v1.0.2" --notes "See CHANGELOG.md"
```

## Done
