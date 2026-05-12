from __future__ import annotations

import json
import threading
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import TYPE_CHECKING

import webview

from sheetsync.core.google_auth import (
    AuthError,
    connect_google,
    credentials_configured,
    disconnect,
    fetch_sheet_metadata,
    save_credentials_file,
    save_credentials_json,
    sheet_id_from_url,
)
from sheetsync.core.storage import AppConfig, reset_all, save_config
from sheetsync.core.syncer import SyncError, export_activity_csv

if TYPE_CHECKING:
    from main import SheetSyncApp


class Api:
    def __init__(self, app: "SheetSyncApp") -> None:
        self._app = app

    # ── internal helpers ─────────────────────────────────────────────────────

    def _push(self, event: dict) -> None:
        try:
            js = f"window.__ss_event && window.__ss_event({json.dumps(event)})"
            for w in webview.windows:
                w.evaluate_js(js)
        except Exception:
            pass

    @staticmethod
    def _rel_time(iso: str) -> str:
        if not iso:
            return "never"
        try:
            then = datetime.fromisoformat(iso)
            if then.tzinfo is None:
                then = then.astimezone(timezone.utc)
            secs = max(0, int((datetime.now(timezone.utc) - then).total_seconds()))
        except ValueError:
            return "never"
        if secs < 60:
            return "just now"
        if secs < 3600:
            return f"{secs // 60}m ago"
        if secs < 86400:
            return f"{secs // 3600}h ago"
        return f"{secs // 86400}d ago"

    @staticmethod
    def _dir_key(direction: str) -> str:
        return {
            "Bidirectional": "both",
            "Excel -> Sheets": "excelToSheet",
            "Sheets -> Excel": "sheetToExcel",
        }.get(direction, "both")

    def _build_pairs(self) -> list[dict]:
        cfg = self._app.config
        if not cfg.excel_path and not cfg.sheet_url:
            return []
        sid = cfg.sheet_id or ""
        short_id = (sid[:6] + "…" + sid[-4:]) if len(sid) > 10 else sid
        name = Path(cfg.excel_path).stem if cfg.excel_path else "Untitled"
        return [{
            "id": "main",
            "name": name,
            "excel": cfg.excel_path,
            "sheet": cfg.sheet_url,
            "sheetId": short_id,
            "rows": cfg.stats.get("rows_synced", 0),
            "cols": 0,
            "sheets": 1,
            "direction": self._dir_key(cfg.sync_direction),
            "lastSync": self._rel_time(cfg.last_sync_iso),
            "every": "on change",
            "state": "idle" if cfg.paused else "live",
            "owner": cfg.google_email,
            "lastEditor": cfg.google_email,
            "lastEditedSide": "excel",
        }]

    @staticmethod
    def _convert_activity(entries: list[dict]) -> list[dict]:
        state_map = {
            "success": "ok",
            "conflict": "yellow",
            "error": "red",
            "info": "blue",
        }
        result = []
        for entry in reversed(entries[-50:]):
            result.append({
                "t": entry.get("time_label", ""),
                "msg": entry.get("message", ""),
                "state": state_map.get(entry.get("kind", "info"), "idle"),
                "rows": entry.get("rows") or None,
                "side": None,
            })
        return result

    # ── public API (called from JS via window.pywebview.api.*) ───────────────

    def get_initial_data(self) -> dict:
        app = self._app
        return {
            "setup_complete": app.config.setup_complete,
            "config": asdict(app.config),
            "pairs": self._build_pairs(),
            "activity": self._convert_activity(app.activity),
            "status": app.status,
            "credentials_configured": credentials_configured(),
        }

    def sync_now(self) -> dict:
        if self._app.status == "syncing":
            return {"ok": False, "error": "Already syncing"}
        threading.Thread(target=self._run_sync, args=("manual",), daemon=True).start()
        return {"ok": True}

    def _run_sync(self, reason: str) -> None:
        app = self._app
        app.status = "syncing"
        self._push({"type": "status", "status": "syncing"})
        try:
            stats = app.engine.sync_now(reason)
            rows_label = f"+{stats.get('rows', 0)}" if stats.get("rows") else ""
            kind = "conflict" if stats.get("conflicts", 0) else "success"
            msg = f"Synced {stats.get('rows', 0)} rows"
            app._add_activity(kind, msg, rows_label)
            app.status = "watching"
            self._push({"type": "status", "status": "watching"})
            self._push({"type": "toast", "title": "Sync complete", "msg": msg, "kind": ""})
        except ConnectionError as exc:
            app.status = "error"
            app._add_activity("error", str(exc), "")
            self._push({"type": "status", "status": "error"})
            self._push({"type": "toast", "title": "Offline", "msg": str(exc), "kind": "red"})
        except (SyncError, AuthError, Exception) as exc:
            app.status = "error"
            app._add_activity("error", str(exc), "")
            self._push({"type": "status", "status": "error"})
            self._push({"type": "toast", "title": "Sync failed", "msg": str(exc), "kind": "red"})
        self._push({"type": "activity", "entries": self._convert_activity(app.activity)})
        self._push({"type": "pairs", "pairs": self._build_pairs()})

    def toggle_pause(self) -> dict:
        app = self._app
        app.config.paused = not app.config.paused
        save_config(app.config)
        if app.config.paused:
            app._stop_watcher()
            app.status = "idle"
        else:
            app._start_watcher()
            app.status = "watching"
        self._push({"type": "status", "status": app.status})
        self._push({"type": "pairs", "pairs": self._build_pairs()})
        return {"ok": True, "paused": app.config.paused}

    def connect_google(self) -> dict:
        try:
            email, _ = connect_google()
            self._app.config.google_email = email
            save_config(self._app.config)
            return {"ok": True, "email": email}
        except (AuthError, Exception) as exc:
            return {"ok": False, "error": str(exc)}

    def disconnect_google(self) -> dict:
        disconnect()
        self._app.config.google_email = ""
        save_config(self._app.config)
        return {"ok": True}

    def validate_sheet_url(self, url: str) -> dict:
        try:
            data = fetch_sheet_metadata(url)
            return {
                "ok": True,
                "title": data["title"],
                "worksheets": data["worksheets"],
                "sheet_id": data["sheet_id"],
            }
        except (AuthError, Exception) as exc:
            return {"ok": False, "error": str(exc)}

    def pick_excel_file(self) -> dict:
        try:
            result = webview.windows[0].create_file_dialog(
                webview.OPEN_DIALOG,
                allow_multiple=False,
                file_types=("Excel files (*.xlsx)",),
            )
            if result:
                return {"ok": True, "path": result[0]}
            return {"ok": False, "cancelled": True}
        except Exception as exc:
            return {"ok": False, "error": str(exc)}

    def pick_credentials_file(self) -> dict:
        try:
            result = webview.windows[0].create_file_dialog(
                webview.OPEN_DIALOG,
                allow_multiple=False,
                file_types=("JSON files (*.json)",),
            )
            if result:
                save_credentials_file(result[0])
                return {"ok": True}
            return {"ok": False, "cancelled": True}
        except AuthError as exc:
            return {"ok": False, "error": str(exc)}
        except Exception as exc:
            return {"ok": False, "error": str(exc)}

    def save_credentials_json_str(self, raw_json: str) -> dict:
        try:
            save_credentials_json(raw_json)
            return {"ok": True}
        except AuthError as exc:
            return {"ok": False, "error": str(exc)}

    def save_settings(self, updates: dict) -> dict:
        cfg = self._app.config
        allowed = {
            "excel_path", "sheet_url", "worksheet_name", "match_column",
            "match_mode", "sync_direction", "conflict_resolution",
            "start_on_boot", "notifications", "minimize_to_tray", "debounce_delay",
        }
        for key, value in updates.items():
            if key in allowed and hasattr(cfg, key):
                setattr(cfg, key, value)
        if "sheet_url" in updates:
            cfg.sheet_id = sheet_id_from_url(updates["sheet_url"])
        save_config(cfg)
        self._app._start_watcher()
        return {"ok": True, "config": asdict(cfg), "pairs": self._build_pairs()}

    def complete_onboarding(self, data: dict) -> dict:
        cfg = self._app.config
        field_map = {
            "excel_path": str, "sheet_url": str, "worksheet_name": str,
            "sync_direction": str, "conflict_resolution": str,
            "notifications": bool, "start_on_boot": bool, "minimize_to_tray": bool,
        }
        for key, cast in field_map.items():
            if key in data:
                setattr(cfg, key, cast(data[key]))
        if cfg.sheet_url:
            cfg.sheet_id = sheet_id_from_url(cfg.sheet_url)
        cfg.setup_complete = True
        save_config(cfg)
        self._app._start_watcher()
        return {"ok": True, "config": asdict(cfg), "pairs": self._build_pairs()}

    def reset_all(self) -> dict:
        self._app._stop_watcher()
        reset_all()
        self._app.config = AppConfig()
        self._app.activity = []
        return {"ok": True}

    def export_activity(self) -> dict:
        try:
            result = webview.windows[0].create_file_dialog(
                webview.SAVE_DIALOG,
                save_filename="sheetsync-activity.csv",
                file_types=("CSV files (*.csv)",),
            )
            if result:
                path = result[0] if isinstance(result, (list, tuple)) else result
                export_activity_csv(path, self._app.activity)
                return {"ok": True}
            return {"ok": False, "cancelled": True}
        except Exception as exc:
            return {"ok": False, "error": str(exc)}

    def window_action(self, action: str) -> None:
        try:
            w = webview.windows[0]
            if action == "close":
                if self._app.config.minimize_to_tray:
                    w.hide()
                else:
                    self._app._stop_watcher()
                    self._app.tray.stop()
                    w.destroy()
            elif action == "minimize":
                w.minimize()
            elif action == "maximize":
                w.toggle_fullscreen()
        except Exception:
            pass
