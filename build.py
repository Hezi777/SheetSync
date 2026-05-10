from __future__ import annotations

import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent
ICON = ROOT / "assets" / "icons" / "app.ico"


def main() -> int:
    if not ICON.exists():
        raise SystemExit("Missing assets/icons/app.ico. Add an icon before packaging.")
    command = [
        "flet",
        "pack",
        "main.py",
        "--name",
        "SheetSync",
        "--icon",
        "assets/icons/app.ico",
        "--add-data",
        "assets:assets",
        "--yes",
    ]
    return subprocess.call(command, cwd=ROOT)


if __name__ == "__main__":
    raise SystemExit(main())
