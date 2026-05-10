from __future__ import annotations

import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent
SCRIPT = ROOT / "installer" / "SheetSync.iss"


def find_iscc() -> str:
    found = shutil.which("iscc")
    if found:
        return found
    candidates = [
        Path.home() / "AppData" / "Local" / "Programs" / "Inno Setup 6" / "ISCC.exe",
        Path(r"C:\Program Files (x86)\Inno Setup 6\ISCC.exe"),
        Path(r"C:\Program Files\Inno Setup 6\ISCC.exe"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return str(candidate)
    raise SystemExit("Inno Setup compiler not found. Install it with: winget install JRSoftware.InnoSetup")


def main() -> int:
    if not (ROOT / "dist" / "SheetSync.exe").exists():
        raise SystemExit("Missing dist/SheetSync.exe. Run python build.py first.")
    if not SCRIPT.exists():
        raise SystemExit(f"Missing installer script: {SCRIPT}")
    return subprocess.call([find_iscc(), str(SCRIPT)], cwd=ROOT)


if __name__ == "__main__":
    raise SystemExit(main())
