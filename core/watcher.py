from __future__ import annotations

import threading
from pathlib import Path
from typing import Callable

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer


class ExcelSaveHandler(FileSystemEventHandler):
    def __init__(self, excel_path: str, debounce: float, callback: Callable[[], None]):
        super().__init__()
        self.excel_path = str(Path(excel_path).resolve())
        self.debounce = debounce
        self.callback = callback
        self.timer: threading.Timer | None = None

    def _matches_target(self, path: str) -> bool:
        candidate = Path(path)
        if candidate.name.startswith("~$"):
            return False
        try:
            return str(candidate.resolve()).lower() == self.excel_path.lower()
        except OSError:
            return False

    def _schedule(self) -> None:
        if self.timer:
            self.timer.cancel()
        self.timer = threading.Timer(self.debounce, self.callback)
        self.timer.daemon = True
        self.timer.start()

    def on_modified(self, event):
        if event.is_directory:
            return
        if self._matches_target(event.src_path):
            self._schedule()

    def on_created(self, event):
        if event.is_directory:
            return
        if self._matches_target(event.src_path):
            self._schedule()

    def on_moved(self, event):
        if event.is_directory:
            return
        if self._matches_target(event.dest_path):
            self._schedule()


class ExcelWatcher:
    def __init__(self, excel_path: str, debounce: float, callback: Callable[[], None]):
        self.excel_path = excel_path
        self.debounce = debounce
        self.callback = callback
        self.observer: Observer | None = None

    def start(self) -> None:
        self.stop()
        path = Path(self.excel_path)
        if not path.exists():
            raise FileNotFoundError(self.excel_path)
        handler = ExcelSaveHandler(str(path), self.debounce, self.callback)
        self.observer = Observer()
        self.observer.schedule(handler, str(path.parent), recursive=False)
        self.observer.start()

    def stop(self) -> None:
        if self.observer:
            self.observer.stop()
            self.observer.join(timeout=2)
            self.observer = None
