# SheetSync Versioning

SheetSync uses Semantic Versioning for desktop releases:

- `MAJOR` changes for incompatible config, installer, or sync behavior changes.
- `MINOR` changes for new user-facing features.
- `PATCH` changes for bug fixes, UI polish, and packaging fixes.

Current release: `1.0.2`.

Every release should build both:

- `dist/SheetSync.exe` from `python scripts/build.py`
- `packaging/installer/Output/SheetSyncSetup-<version>.exe` from Inno Setup via `python scripts/build_installer.py`

The GitHub release tag should match the version with a `v` prefix, for example `v1.0.1`, and the Inno Setup installer should be uploaded as a release artifact.
