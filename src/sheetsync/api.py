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
from sheetsync.core.storage import (
    AppConfig,
    SyncPairConfig,
    ensure_pair,
    pair_id_for,
    reset_all,
    save_config,
    sync_legacy_fields,
)
from sheetsync.core.syncer import SyncError, export_activity_csv

if TYPE_CHECKING:
    from sheetsync_desktop import SheetSyncApp


class Api:
    def __init__(self, app: "SheetSyncApp") -> None:
        self._app = app

    def _push(self, event: dict) -> None:
        try:
            # json.dumps is load-bearing for XSS safety — do not replace with string formatting.
            js = f"window.__ss_event && window.__ss_event({json.dumps(event)})"
            for window in webview.windows:
                window.evaluate_js(js)
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

    def _pair_payload(self, pair: SyncPairConfig) -> dict:
        cfg = self._app.config
        sheet_id = pair.sheet_id or ""
        short_id = (sheet_id[:6] + "..." + sheet_id[-4:]) if len(sheet_id) > 10 else sheet_id
        name = pair.name or (Path(pair.excel_path).stem if pair.excel_path else "Untitled")
        return {
            "id": pair.id,
            "name": name,
            "excel": pair.excel_path,
            "sheet": pair.sheet_url,
            "sheetId": short_id,
            "rows": pair.stats.get("rows_synced", 0),
            "cols": 0,
            "sheets": 1,
            "direction": self._dir_key(pair.sync_direction),
            "lastSync": self._rel_time(pair.last_sync_iso),
            "every": "on change",
            "state": "idle" if cfg.paused or pair.paused else "live",
            "owner": cfg.google_email,
            "lastEditor": cfg.google_email,
            "lastEditedSide": "excel",
            "pinned": pair.pinned,
            "active": pair.id == cfg.active_pair_id,
            "worksheet": pair.worksheet_name,
            "queued": pair.queued_changes,
            "conflicts": pair.stats.get("conflicts_resolved", 0),
        }

    def _build_pairs(self) -> list[dict]:
        return [self._pair_payload(pair) for pair in self._app.config.pairs if pair.excel_path or pair.sheet_url]

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
                "side": entry.get("side"),
                "pair_id": entry.get("pair_id"),
            })
        return result

    def get_initial_data(self) -> dict:
        app = self._app
        return {
            "setup_complete": app.config.setup_complete,
            "config": asdict(app.config),
            "active_pair_id": app.config.active_pair_id,
            "pairs": self._build_pairs(),
            "activity": self._convert_activity(app.activity),
            "status": app.status,
            "credentials_configured": credentials_configured(),
        }

    def sync_now(self, pair_id: str | None = None) -> dict:
        if self._app.status == "syncing":
            return {"ok": False, "error": "Already syncing"}
        threading.Thread(target=self._run_sync, args=("manual", pair_id), daemon=True).start()
        return {"ok": True}

    def _run_sync(self, reason: str, pair_id: str | None = None) -> None:
        app = self._app
        pair = ensure_pair(app.config, pair_id)
        app.status = "syncing"
        self._push({"type": "status", "status": "syncing"})
        try:
            stats = app.engine.sync_now(reason, pair.id)
            rows_label = f"+{stats.get('rows', 0)}" if stats.get("rows") else ""
            kind = "conflict" if stats.get("conflicts", 0) else "success"
            msg = f"Synced {stats.get('rows', 0)} rows in {pair.name}"
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
        self._app.config.setup_complete = False
        self._app._stop_watcher()
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

    def save_settings(self, updates: dict, pair_id: str | None = None) -> dict:
        cfg = self._app.config
        pair = ensure_pair(cfg, pair_id)
        pair_fields = {
            "name", "excel_path", "sheet_url", "worksheet_name", "match_column",
            "match_mode", "sync_direction", "conflict_resolution", "paused", "pinned",
        }
        app_fields = {"notifications", "minimize_to_tray", "debounce_delay"}
        for key, value in updates.items():
            if key in pair_fields and hasattr(pair, key):
                setattr(pair, key, value)
            elif key in app_fields and hasattr(cfg, key):
                setattr(cfg, key, value)
        if "sheet_url" in updates:
            pair.sheet_id = sheet_id_from_url(str(updates["sheet_url"]))
        sync_legacy_fields(cfg, pair)
        save_config(cfg)
        self._app._start_watcher()
        return {"ok": True, "config": asdict(cfg), "pairs": self._build_pairs()}

    def complete_onboarding(self, data: dict) -> dict:
        cfg = self._app.config
        pair = ensure_pair(cfg)
        field_map = {
            "excel_path": str,
            "sheet_url": str,
            "worksheet_name": str,
            "sync_direction": str,
            "conflict_resolution": str,
        }
        for key, cast in field_map.items():
            if key in data:
                setattr(pair, key, cast(data[key]))
        for key in ("notifications", "minimize_to_tray"):
            if key in data:
                setattr(cfg, key, bool(data[key]))
        pair.name = data.get("name") or pair.name or (Path(pair.excel_path).stem if pair.excel_path else "Main pair")
        if pair.sheet_url:
            pair.sheet_id = sheet_id_from_url(pair.sheet_url)
        sync_legacy_fields(cfg, pair)
        cfg.setup_complete = True
        save_config(cfg)
        self._app._start_watcher()
        return {"ok": True, "config": asdict(cfg), "pairs": self._build_pairs()}

    def create_pair(self, data: dict) -> dict:
        cfg = self._app.config
        excel_path = str(data.get("excel_path", ""))
        sheet_url = str(data.get("sheet_url", ""))
        pair = SyncPairConfig(
            id=pair_id_for(excel_path, sheet_url),
            name=str(data.get("name") or (Path(excel_path).stem if excel_path else "New pair")),
            excel_path=excel_path,
            sheet_url=sheet_url,
            sheet_id=sheet_id_from_url(sheet_url) if sheet_url else "",
            worksheet_name=str(data.get("worksheet_name", "")),
            sync_direction=str(data.get("sync_direction", "Bidirectional")),
            conflict_resolution=str(data.get("conflict_resolution", "Excel wins")),
            pinned=bool(data.get("pinned", True)),
        )
        cfg.pairs.append(pair)
        cfg.active_pair_id = pair.id
        sync_legacy_fields(cfg, pair)
        save_config(cfg)
        self._app._start_watcher()
        return {"ok": True, "pair": self._pair_payload(pair), "pairs": self._build_pairs()}

    def set_active_pair(self, pair_id: str) -> dict:
        pair = ensure_pair(self._app.config, pair_id)
        self._app.config.active_pair_id = pair.id
        sync_legacy_fields(self._app.config, pair)
        save_config(self._app.config)
        return {"ok": True, "active_pair_id": pair.id, "pairs": self._build_pairs()}

    def toggle_pair_pin(self, pair_id: str) -> dict:
        pair = ensure_pair(self._app.config, pair_id)
        pair.pinned = not pair.pinned
        save_config(self._app.config)
        return {"ok": True, "pinned": pair.pinned, "pairs": self._build_pairs()}

    def toggle_pair_pause(self, pair_id: str) -> dict:
        pair = ensure_pair(self._app.config, pair_id)
        pair.paused = not pair.paused
        save_config(self._app.config)
        self._app._start_watcher()
        return {"ok": True, "paused": pair.paused, "pairs": self._build_pairs()}

    def delete_pair(self, pair_id: str) -> dict:
        cfg = self._app.config
        cfg.pairs = [pair for pair in cfg.pairs if pair.id != pair_id]
        if cfg.active_pair_id == pair_id:
            cfg.active_pair_id = cfg.pairs[0].id if cfg.pairs else ""
        if cfg.pairs:
            sync_legacy_fields(cfg, ensure_pair(cfg, cfg.active_pair_id))
        save_config(cfg)
        self._app._start_watcher()
        return {"ok": True, "pairs": self._build_pairs(), "active_pair_id": cfg.active_pair_id}

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
            window = webview.windows[0]
            if action == "close":
                if self._app.config.minimize_to_tray:
                    window.hide()
                else:
                    self._app._stop_watcher()
                    self._app.tray.stop()
                    window.destroy()
            elif action == "minimize":
                window.minimize()
            elif action == "maximize":
                window.toggle_fullscreen()
        except Exception:
            pass
