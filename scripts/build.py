from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ICON = ROOT / "assets" / "icons" / "app.ico"
ENTRY = ROOT / "src" / "sheetsync_desktop.py"
UI_DIR = ROOT / "src" / "sheetsync" / "ui"


def add_data_arg(source: Path, dest: str) -> str:
    separator = ";" if os.name == "nt" else ":"
    return f"{source}{separator}{dest}"


def main() -> int:
    if not ICON.exists():
        raise SystemExit("Missing assets/icons/app.ico.")
    command = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--noconfirm",
        "--onefile",
        "--windowed",
        "--name",
        "SheetSync",
        "--icon",
        str(ICON),
        "--add-data",
        add_data_arg(UI_DIR, "sheetsync/ui"),
        str(ENTRY),
    ]
    return subprocess.call(command, cwd=ROOT)


if __name__ == "__main__":
    raise SystemExit(main())
