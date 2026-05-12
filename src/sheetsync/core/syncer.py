from __future__ import annotations

import csv
import socket
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable

import gspread
from openpyxl import load_workbook
from openpyxl.workbook import Workbook

from .google_auth import AuthError, get_client
from .storage import AppConfig, clear_lock, create_lock, load_queue, save_config, save_queue


StatusCallback = Callable[[dict], None]


class SyncError(RuntimeError):
    pass


@dataclass
class TableData:
    headers: list[str]
    rows: list[dict[str, object]]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def internet_available(host: str = "www.googleapis.com", port: int = 443, timeout: float = 3) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


def _normalize(value: object) -> str:
    if value is None:
        return ""
    return str(value).strip()


def read_excel(path: str) -> TableData:
    file_path = Path(path)
    if not file_path.exists():
        raise FileNotFoundError(path)
    last_error: PermissionError | None = None
    for _ in range(5):
        try:
            workbook = load_workbook(file_path)
            sheet = workbook.active
            values = list(sheet.iter_rows(values_only=True))
            workbook.close()
            if not values:
                return TableData([], [])
            headers = [_normalize(v) for v in values[0]]
            rows = []
            for raw in values[1:]:
                row = {headers[i]: raw[i] if i < len(raw) else "" for i in range(len(headers)) if headers[i]}
                if any(_normalize(v) for v in row.values()):
                    rows.append(row)
            return TableData(headers, rows)
        except PermissionError as exc:
            last_error = exc
            time.sleep(2)
    raise SyncError("Waiting for Excel to release file") from last_error


def write_excel(path: str, table: TableData) -> None:
    last_error: PermissionError | None = None
    for _ in range(5):
        workbook = Workbook()
        try:
            sheet = workbook.active
            sheet.append(table.headers)
            for row in table.rows:
                sheet.append([row.get(header, "") for header in table.headers])
            workbook.save(path)
            return
        except PermissionError as exc:
            last_error = exc
            time.sleep(2)
        finally:
            workbook.close()
    raise SyncError("Waiting for Excel to release file") from last_error


def read_sheet(client: gspread.Client, config: AppConfig) -> tuple[gspread.Worksheet, TableData]:
    spreadsheet = client.open_by_key(config.sheet_id)
    worksheet = spreadsheet.worksheet(config.worksheet_name) if config.worksheet_name else spreadsheet.sheet1
    values = worksheet.get_all_values()
    if not values:
        return worksheet, TableData([], [])
    headers = [_normalize(v) for v in values[0]]
    rows = []
    for raw in values[1:]:
        row = {headers[i]: raw[i] if i < len(raw) else "" for i in range(len(headers)) if headers[i]}
        if any(_normalize(v) for v in row.values()):
            rows.append(row)
    return worksheet, TableData(headers, rows)


def write_sheet(worksheet: gspread.Worksheet, table: TableData) -> None:
    values = [table.headers] + [[row.get(header, "") for header in table.headers] for row in table.rows]
    worksheet.clear()
    if values:
        worksheet.update(values, "A1")


def rows_by_key(table: TableData, key: str, side: str) -> dict[str, dict[str, object]]:
    if key not in table.headers:
        raise SyncError(f"Match column '{key}' is missing in {side}.")
    mapped = {}
    for row in table.rows:
        value = _normalize(row.get(key))
        if value:
            mapped[value] = row
    return mapped


def rows_by_position(table: TableData) -> dict[str, dict[str, object]]:
    return {str(index): row for index, row in enumerate(table.rows, start=1)}


def merge_headers(a: list[str], b: list[str]) -> list[str]:
    merged = []
    for header in a + b:
        if header and header not in merged:
            merged.append(header)
    return merged


def row_map(table: TableData, key: str, config: AppConfig, side: str) -> dict[str, dict[str, object]]:
    if config.match_mode == "Column value":
        return rows_by_key(table, key, side)
    return rows_by_position(table)


def ordered_keys(excel_map: dict[str, dict[str, object]], sheet_map: dict[str, dict[str, object]], config: AppConfig) -> list[str]:
    keys = set(excel_map) | set(sheet_map)
    if config.match_mode == "Column value":
        return sorted(keys)
    return sorted(keys, key=lambda value: int(value))


def compute_merge(excel: TableData, sheet: TableData, key: str, config: AppConfig) -> tuple[TableData, TableData, dict[str, int]]:
    excel_map = row_map(excel, key, config, "Excel file")
    sheet_map = row_map(sheet, key, config, "Google Sheet")
    headers = merge_headers(excel.headers, sheet.headers)
    all_keys = ordered_keys(excel_map, sheet_map, config)
    stats = {"added": 0, "modified": 0, "deleted": 0, "conflicts": 0, "rows": 0}
    merged_rows: list[dict[str, object]] = []
    for item_key in all_keys:
        erow = excel_map.get(item_key)
        srow = sheet_map.get(item_key)
        if erow and not srow:
            chosen = erow
            stats["added"] += 1
        elif srow and not erow:
            chosen = srow
            stats["added"] += 1
        elif erow == srow:
            chosen = erow or srow or {}
        else:
            stats["modified"] += 1
            stats["conflicts"] += 1
            if config.conflict_resolution == "Excel wins":
                chosen = erow or {}
            elif config.conflict_resolution == "Sheets wins":
                chosen = srow or {}
            else:
                chosen = erow or srow or {}
        merged_rows.append({header: chosen.get(header, "") for header in headers})
    stats["rows"] = stats["added"] + stats["modified"] + stats["deleted"]
    merged = TableData(headers, merged_rows)
    if config.sync_direction == "Excel -> Sheets":
        return excel, excel, stats
    if config.sync_direction == "Sheets -> Excel":
        return sheet, sheet, stats
    return merged, merged, stats


class SyncEngine:
    def __init__(self, config: AppConfig, callback: StatusCallback | None = None):
        self.config = config
        self.callback = callback or (lambda event: None)

    def emit(self, kind: str, message: str, **data: object) -> None:
        self.callback({"kind": kind, "message": message, **data})

    def sync_now(self, reason: str = "manual") -> dict[str, int]:
        if self.config.paused:
            raise SyncError("Sync is paused.")
        if not self.config.excel_path:
            raise SyncError("Choose an Excel file before syncing.")
        if not self.config.sheet_id:
            raise SyncError("Connect a Google Sheet before syncing.")
        if not internet_available():
            queue = load_queue()
            queue.append({"created_at": now_iso(), "reason": reason, "excel_path": self.config.excel_path})
            save_queue(queue)
            self.config.queued_changes = len(queue)
            save_config(self.config)
            raise ConnectionError("Offline. Changes queued and will sync when the connection returns.")
        create_lock()
        self.emit("status", "Syncing...", state="syncing")
        try:
            excel = read_excel(self.config.excel_path)
            client = get_client(interactive=False)
            worksheet, sheet = read_sheet(client, self.config)
            excel_out, sheet_out, stats = compute_merge(excel, sheet, self.config.match_column, self.config)
            should_write_excel = self.config.sync_direction in ("Bidirectional", "Sheets -> Excel")
            if reason == "Excel" and self.config.sync_direction == "Bidirectional":
                should_write_excel = False
            if should_write_excel:
                write_excel(self.config.excel_path, excel_out)
            if self.config.sync_direction in ("Bidirectional", "Excel -> Sheets"):
                write_sheet(worksheet, sheet_out)
            self.config.last_sync_iso = now_iso()
            self.config.queued_changes = 0
            self.config.stats["total_syncs"] += 1
            self.config.stats["rows_synced"] += stats["rows"]
            self.config.stats["conflicts_resolved"] += stats["conflicts"]
            save_queue([])
            save_config(self.config)
            self.emit("synced", f"Synced {stats['rows']} rows", stats=stats)
            return stats
        except FileNotFoundError as exc:
            self.config.stats["errors"] += 1
            save_config(self.config)
            raise SyncError("Excel file not found. Locate the file to resume syncing.") from exc
        except PermissionError as exc:
            self.config.stats["errors"] += 1
            save_config(self.config)
            raise SyncError("Waiting for Excel to release file") from exc
        except AuthError:
            self.config.stats["errors"] += 1
            save_config(self.config)
            raise
        except gspread.SpreadsheetNotFound as exc:
            self.config.stats["errors"] += 1
            save_config(self.config)
            raise SyncError("Google Sheet was deleted or access was removed. Update the Sheet URL.") from exc
        finally:
            clear_lock()


def export_activity_csv(path: str, entries: list[dict]) -> None:
    with open(path, "w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["time", "kind", "message", "rows"])
        writer.writeheader()
        for entry in entries:
            writer.writerow(
                {
                    "time": entry.get("time", ""),
                    "kind": entry.get("kind", ""),
                    "message": entry.get("message", ""),
                    "rows": entry.get("rows", ""),
                }
            )
