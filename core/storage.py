from __future__ import annotations

import json
import os
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any


def app_root() -> Path:
    if getattr(sys, "frozen", False):
        appdata = os.environ.get("APPDATA")
        if appdata:
            path = Path(appdata) / "SheetSync"
            path.mkdir(parents=True, exist_ok=True)
            return path
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parents[1]


APP_DIR = app_root()
ROOT_DIR = APP_DIR
CONFIG_PATH = ROOT_DIR / "config.json"
TOKEN_PATH = ROOT_DIR / "token.json"
LOCK_PATH = ROOT_DIR / ".sheetsync.lock"
QUEUE_PATH = ROOT_DIR / "sync_queue.json"
ACTIVITY_PATH = ROOT_DIR / "activity.json"


@dataclass
class AppConfig:
    excel_path: str = ""
    sheet_url: str = ""
    sheet_id: str = ""
    worksheet_name: str = ""
    match_column: str = "ID"
    match_mode: str = "Row position"
    sync_direction: str = "Bidirectional"
    conflict_resolution: str = "Last modified wins"
    start_on_boot: bool = False
    notifications: bool = True
    minimize_to_tray: bool = True
    theme: str = "dark"
    debounce_delay: float = 1.5
    google_email: str = ""
    window_width: int = 1100
    window_height: int = 720
    window_left: int | None = None
    window_top: int | None = None
    last_sync_iso: str = ""
    setup_complete: bool = False
    paused: bool = False
    queued_changes: int = 0
    stats: dict[str, int] = field(
        default_factory=lambda: {
            "total_syncs": 0,
            "rows_synced": 0,
            "conflicts_resolved": 0,
            "errors": 0,
        }
    )


def _read_json(path: Path, fallback: Any) -> Any:
    try:
        if path.exists():
            return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return fallback
    return fallback


def _write_json(path: Path, data: Any) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    os.replace(tmp, path)


def load_config() -> AppConfig:
    raw = _read_json(CONFIG_PATH, {})
    config = AppConfig()
    for key, value in raw.items():
        if hasattr(config, key):
            setattr(config, key, value)
    return config


def save_config(config: AppConfig) -> None:
    _write_json(CONFIG_PATH, asdict(config))


def load_activity() -> list[dict[str, Any]]:
    data = _read_json(ACTIVITY_PATH, [])
    return data if isinstance(data, list) else []


def save_activity(entries: list[dict[str, Any]]) -> None:
    _write_json(ACTIVITY_PATH, entries[-500:])


def load_queue() -> list[dict[str, Any]]:
    data = _read_json(QUEUE_PATH, [])
    return data if isinstance(data, list) else []


def save_queue(entries: list[dict[str, Any]]) -> None:
    _write_json(QUEUE_PATH, entries)


def has_crash_lock() -> bool:
    return LOCK_PATH.exists()


def create_lock() -> None:
    LOCK_PATH.write_text(str(os.getpid()), encoding="utf-8")


def clear_lock() -> None:
    try:
        LOCK_PATH.unlink(missing_ok=True)
    except OSError:
        pass


def reset_all() -> None:
    for path in [CONFIG_PATH, TOKEN_PATH, QUEUE_PATH, ACTIVITY_PATH, LOCK_PATH]:
        try:
            path.unlink(missing_ok=True)
        except OSError:
            pass
