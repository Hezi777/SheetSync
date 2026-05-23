from __future__ import annotations

import sys
import threading
from datetime import datetime
from pathlib import Path

import webview

from sheetsync.api import Api
from sheetsync.core.storage import AppConfig, has_crash_lock, load_activity, load_config, save_activity, save_config
from sheetsync.core.syncer import SyncEngine
from sheetsync.core.tray import TrayController
from sheetsync.core.watcher import ExcelWatcher


def _app_base() -> Path:
    """UI resource directory for dev and PyInstaller builds."""
    if getattr(sys, "frozen", False):
        return Path(sys._MEIPASS) / "sheetsync" / "ui"  # type: ignore[attr-defined]
    return Path(__file__).resolve().parent / "sheetsync" / "ui"


APP_BASE = _app_base()


class SheetSyncApp:
    def __init__(self) -> None:
        self.config: AppConfig = load_config()
        self.activity: list[dict] = load_activity()
        self.status: str = "idle" if self.config.paused else "watching"
        self.watchers: dict[str, ExcelWatcher] = {}
        self.interval_timers: dict[str, threading.Timer] = {}
        self.sheet_pollers: dict[str, threading.Timer] = {}
        self.engine = SyncEngine(self.config, self._on_engine_event)
        self.api = Api(self)
        self.tray = TrayController(
            self._open_from_tray,
            self._toggle_pause_from_tray,
            self._quit_from_tray,
        )

    # ── lifecycle ─────────────────────────────────────────────────────────────

    def on_window_loaded(self) -> None:
        """Called once the WebView is ready — safe to call evaluate_js from here."""
        self.tray.start()
        if self.config.setup_complete:
            self._start_watcher()
        if has_crash_lock():
            self._add_activity("info", "App recovered after an interrupted sync.", "")

    # ── activity ──────────────────────────────────────────────────────────────

    def _add_activity(self, kind: str, message: str, rows: str) -> None:
        now = datetime.now()
        self.activity.append({
            "time": now.isoformat(),
            "time_label": now.strftime("%I:%M %p").lstrip("0"),
            "kind": kind,
            "message": message,
            "rows": rows,
        })
        self.activity = self.activity[-500:]
        save_activity(self.activity)

    # ── watcher ───────────────────────────────────────────────────────────────

    def _start_watcher(self) -> None:
        self._start_watchers()

    def _start_watchers(self) -> None:
        self._stop_watcher()
        if self.config.paused:
            return
        for pair in self.config.pairs:
            if pair.paused or not pair.excel_path:
                continue
            try:
                watcher = ExcelWatcher(
                    pair.excel_path,
                    self.config.debounce_delay,
                    lambda pair_id=pair.id: self.api._run_sync("Excel", pair_id),
                )
                watcher.start()
                self.watchers[pair.id] = watcher
            except FileNotFoundError:
                self.status = "error"
                self._add_activity("error", f"Excel file not found for {pair.name}. Update the path in Settings.", "")
        if self.watchers:
            self.status = "watching"
        for pair in self.config.pairs:
            if not pair.paused:
                self._start_interval_timer(pair.id)
                self._start_sheet_poller(pair.id)

    def _stop_watcher(self) -> None:
        for watcher in self.watchers.values():
            watcher.stop()
        self.watchers = {}
        for timer in self.interval_timers.values():
            timer.cancel()
        self.interval_timers = {}
        for timer in self.sheet_pollers.values():
            timer.cancel()
        self.sheet_pollers = {}

    def _find_pair(self, pair_id: str):
        return next((pair for pair in self.config.pairs if pair.id == pair_id), None)

    def _schedule(self, registry: dict[str, threading.Timer], pair_id: str, seconds: float, fire) -> None:
        existing = registry.pop(pair_id, None)
        if existing is not None:
            existing.cancel()
        timer = threading.Timer(seconds, fire)
        timer.daemon = True
        timer.start()
        registry[pair_id] = timer

    def _start_interval_timer(self, pair_id: str) -> None:
        pair = self._find_pair(pair_id)
        if pair is None or pair.sync_interval_minutes <= 0 or pair.paused or self.config.paused:
            return

        def fire() -> None:
            if self.status != "syncing":
                self.api._run_sync("schedule", pair_id)
            self._start_interval_timer(pair_id)

        self._schedule(self.interval_timers, pair_id, pair.sync_interval_minutes * 60, fire)

    def _restart_interval_timer(self, pair_id: str) -> None:
        existing = self.interval_timers.pop(pair_id, None)
        if existing is not None:
            existing.cancel()
        self._start_interval_timer(pair_id)

    def _start_sheet_poller(self, pair_id: str) -> None:
        pair = self._find_pair(pair_id)
        if pair is None or not pair.sheets_poll_enabled or pair.paused or self.config.paused:
            return

        def poll() -> None:
            current_hash = self.engine.poll_sheet_hash(pair_id)
            if current_hash and current_hash != pair.last_sheet_hash:
                pair.last_sheet_hash = current_hash
                if self.status != "syncing":
                    self.api._run_sync("sheets_poll", pair_id)
            self._start_sheet_poller(pair_id)

        self._schedule(self.sheet_pollers, pair_id, pair.sheets_poll_interval or 300, poll)

    def _restart_sheet_poller(self, pair_id: str) -> None:
        existing = self.sheet_pollers.pop(pair_id, None)
        if existing is not None:
            existing.cancel()
        self._start_sheet_poller(pair_id)

    def _on_engine_event(self, event: dict) -> None:
        if event.get("state"):
            self.status = str(event["state"])

    # ── tray callbacks ────────────────────────────────────────────────────────

    def _open_from_tray(self) -> None:
        try:
            w = webview.windows[0]
            w.show()
            w.restore()
        except Exception:
            pass

    def _toggle_pause_from_tray(self) -> None:
        self.config.paused = not self.config.paused
        save_config(self.config)
        if self.config.paused:
            self._stop_watcher()
        else:
            self._start_watcher()
        self.api._push({"type": "status", "status": self.status})

    def _quit_from_tray(self) -> None:
        self._stop_watcher()
        self.tray.stop()
        try:
            webview.windows[0].destroy()
        except Exception:
            pass


def main() -> None:
    app = SheetSyncApp()

    window = webview.create_window(
        "SheetSync",
        str(APP_BASE / "dist" / "index.html"),
        js_api=app.api,
        width=app.config.window_width,
        height=app.config.window_height,
        min_size=(900, 600),
        background_color="#000000",
        text_select=False,
    )

    def on_loaded() -> None:
        app.on_window_loaded()

    def on_closing() -> None:
        app._stop_watcher()
        app.tray.stop()

    def on_resized(width: int, height: int) -> None:
        app.config.window_width = width
        app.config.window_height = height
        save_config(app.config)

    window.events.loaded += on_loaded
    window.events.closing += on_closing
    window.events.resized += on_resized

    webview.start(debug=False, private_mode=True)


if __name__ == "__main__":
    main()
