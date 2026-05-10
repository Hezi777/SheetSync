from __future__ import annotations

import sys
import threading
from pathlib import Path
from typing import Callable

from PIL import Image
import pystray


class TrayController:
    def __init__(self, on_open: Callable[[], None], on_pause_resume: Callable[[], None], on_quit: Callable[[], None]):
        self.on_open = on_open
        self.on_pause_resume = on_pause_resume
        self.on_quit = on_quit
        self.icon: pystray.Icon | None = None
        self.thread: threading.Thread | None = None

    def start(self) -> None:
        if self.icon:
            return
        base_dir = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parents[1]))
        image_path = base_dir / "assets" / "icons" / "app_logo_256.png"
        if not image_path.exists():
            image_path = Path(__file__).resolve().parents[1] / "assets" / "icons" / "app_logo_256.png"
        image = Image.open(image_path).convert("RGBA").resize((64, 64))
        menu = pystray.Menu(
            pystray.MenuItem("Open", lambda: self.on_open()),
            pystray.MenuItem("Pause / Resume", lambda: self.on_pause_resume()),
            pystray.MenuItem("Quit", lambda: self.on_quit()),
        )
        self.icon = pystray.Icon("SheetSync", image, "SheetSync", menu)
        self.thread = threading.Thread(target=self.icon.run, daemon=True)
        self.thread.start()

    def stop(self) -> None:
        if self.icon:
            self.icon.stop()
            self.icon = None
