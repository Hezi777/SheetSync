from __future__ import annotations

import json
import logging
import os
import subprocess
import sys
from hashlib import sha1
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


def app_root() -> Path:
    if getattr(sys, "frozen", False):
        appdata = os.environ.get("APPDATA")
        if appdata:
            path = Path(appdata) / "SheetSync"
            path.mkdir(parents=True, exist_ok=True)
            return path
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parents[3]


APP_DIR = app_root()
ROOT_DIR = APP_DIR
CONFIG_PATH = ROOT_DIR / "config.json"
TOKEN_PATH = ROOT_DIR / "token.json"
LOCK_PATH = ROOT_DIR / ".sheetsync.lock"
QUEUE_PATH = ROOT_DIR / "sync_queue.json"
ACTIVITY_PATH = ROOT_DIR / "activity.json"


@dataclass
class SyncPairConfig:
    id: str = ""
    name: str = ""
    excel_path: str = ""
    sheet_url: str = ""
    sheet_id: str = ""
    worksheet_name: str = ""
    match_column: str = "ID"
    match_mode: str = "Row position"
    sync_direction: str = "Bidirectional"
    conflict_resolution: str = "Excel wins"
    paused: bool = False
    pinned: bool = True
    last_sync_iso: str = ""
    queued_changes: int = 0
    stats: dict[str, int] = field(
        default_factory=lambda: {
            "total_syncs": 0,
            "rows_synced": 0,
            "conflicts_resolved": 0,
            "errors": 0,
        }
    )


@dataclass
class AppConfig:
    excel_path: str = ""
    sheet_url: str = ""
    sheet_id: str = ""
    worksheet_name: str = ""
    match_column: str = "ID"
    match_mode: str = "Row position"
    sync_direction: str = "Bidirectional"
    conflict_resolution: str = "Excel wins"
    notifications: bool = True
    minimize_to_tray: bool = True
    debounce_delay: float = 1.5
    google_email: str = ""
    window_width: int = 1100
    window_height: int = 720
    last_sync_iso: str = ""
    setup_complete: bool = False
    paused: bool = False
    active_pair_id: str = ""
    pairs: list[SyncPairConfig] = field(default_factory=list)
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


def _restrict_to_current_user(path: Path) -> None:
    """Apply Windows ACL so only the current user can read/write the file."""
    if sys.platform != "win32":
        return
    try:
        username = os.environ.get("USERNAME", "")
        if not username:
            return
        subprocess.run(
            ["icacls", str(path), "/inheritance:r", f"/grant:r", f"{username}:F"],
            check=True,
            capture_output=True,
        )
    except Exception as exc:
        logger.warning("Could not restrict ACL on %s: %s", path, exc)


def load_config() -> AppConfig:
    raw = _read_json(CONFIG_PATH, {})
    config = AppConfig()
    for key, value in raw.items():
        if key == "pairs" and isinstance(value, list):
            config.pairs = [_pair_from_raw(item) for item in value if isinstance(item, dict)]
        elif hasattr(config, key):
            setattr(config, key, value)
    if config.conflict_resolution == "Last modified wins":
        config.conflict_resolution = "Excel wins"
    for pair in config.pairs:
        if pair.conflict_resolution == "Last modified wins":
            pair.conflict_resolution = "Excel wins"
    if not config.pairs and (config.excel_path or config.sheet_url):
        pair = SyncPairConfig(
            id="main",
            name=Path(config.excel_path).stem if config.excel_path else "Main pair",
            excel_path=config.excel_path,
            sheet_url=config.sheet_url,
            sheet_id=config.sheet_id,
            worksheet_name=config.worksheet_name,
            match_column=config.match_column,
            match_mode=config.match_mode,
            sync_direction=config.sync_direction,
            conflict_resolution=config.conflict_resolution,
            paused=config.paused,
            last_sync_iso=config.last_sync_iso,
            queued_changes=config.queued_changes,
            stats=dict(config.stats),
        )
        config.pairs = [pair]
        config.active_pair_id = pair.id
    if config.pairs and not config.active_pair_id:
        config.active_pair_id = config.pairs[0].id
    return config


def save_config(config: AppConfig) -> None:
    _write_json(CONFIG_PATH, asdict(config))


def _pair_from_raw(raw: dict[str, Any]) -> SyncPairConfig:
    pair = SyncPairConfig()
    for key, value in raw.items():
        if hasattr(pair, key):
            setattr(pair, key, value)
    if not pair.id:
        pair.id = pair_id_for(pair.excel_path, pair.sheet_url)
    if not pair.name:
        pair.name = Path(pair.excel_path).stem if pair.excel_path else "Sync pair"
    return pair


def pair_id_for(excel_path: str, sheet_url: str) -> str:
    seed = f"{excel_path}|{sheet_url}".strip("|") or "pair"
    return sha1(seed.encode("utf-8")).hexdigest()[:10]


def ensure_pair(config: AppConfig, pair_id: str | None = None) -> SyncPairConfig:
    if not config.pairs and (config.excel_path or config.sheet_url):
        config.pairs = [
            SyncPairConfig(
                id="main",
                name=Path(config.excel_path).stem if config.excel_path else "Main pair",
                excel_path=config.excel_path,
                sheet_url=config.sheet_url,
                sheet_id=config.sheet_id,
                worksheet_name=config.worksheet_name,
                match_column=config.match_column,
                match_mode=config.match_mode,
                sync_direction=config.sync_direction,
                conflict_resolution=config.conflict_resolution,
                paused=config.paused,
                last_sync_iso=config.last_sync_iso,
                queued_changes=config.queued_changes,
                stats=dict(config.stats),
            )
        ]
    if pair_id:
        for pair in config.pairs:
            if pair.id == pair_id:
                return pair
    if config.active_pair_id:
        for pair in config.pairs:
            if pair.id == config.active_pair_id:
                return pair
    if not config.pairs:
        pair = SyncPairConfig(id="main", name="Main pair")
        config.pairs.append(pair)
    config.active_pair_id = config.pairs[0].id
    return config.pairs[0]


def sync_legacy_fields(config: AppConfig, pair: SyncPairConfig | None = None) -> None:
    target = pair or (config.pairs[0] if config.pairs else None)
    if not target:
        return
    config.excel_path = target.excel_path
    config.sheet_url = target.sheet_url
    config.sheet_id = target.sheet_id
    config.worksheet_name = target.worksheet_name
    config.match_column = target.match_column
    config.match_mode = target.match_mode
    config.sync_direction = target.sync_direction
    config.conflict_resolution = target.conflict_resolution
    config.last_sync_iso = target.last_sync_iso
    config.queued_changes = target.queued_changes
    config.stats = dict(target.stats)


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
    for path in [CONFIG_PATH, TOKEN_PATH, QUEUE_PATH, ACTIVITY_PATH, LOCK_PATH, ROOT_DIR / "credentials.json"]:
        try:
            path.unlink(missing_ok=True)
        except OSError:
            pass
