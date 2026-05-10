from __future__ import annotations

import threading
from datetime import datetime
from pathlib import Path

import flet as ft
from plyer import notification

from core.google_auth import AuthError, disconnect, fetch_sheet_metadata, sheet_id_from_url
from core.storage import AppConfig, has_crash_lock, load_activity, load_config, reset_all, save_activity, save_config
from core.syncer import SyncEngine, SyncError, export_activity_csv
from core.tray import TrayController
from core.watcher import ExcelWatcher
from ui.components import icon, nav_item, toast
from ui.dashboard import ActivityLogView, DashboardView
from ui.onboarding import Onboarding
from ui.settings import SettingsView
from ui.theme import apply_page_theme, caption, display, tokens


class SheetSyncApp:
    def __init__(self, page: ft.Page):
        self.page = page
        self.config = load_config()
        self.activity = load_activity()
        self.view = "Dashboard"
        self.status = "watching"
        self.filter = "All"
        self.search = ""
        self.watcher: ExcelWatcher | None = None
        self.engine = SyncEngine(self.config, self.on_engine_event)
        self.tray = TrayController(self.open_from_tray, self.toggle_pause_from_tray, self.quit_from_tray)
        self.file_picker = ft.FilePicker()
        self.export_picker = ft.FilePicker()
        self.page.services.extend([self.file_picker, self.export_picker])
        self.configure_page()

    @property
    def palette(self):
        return tokens(self.config.theme)

    def configure_page(self) -> None:
        self.page.title = "SheetSync"
        self.page.padding = 0
        self.page.window.width = self.config.window_width
        self.page.window.height = self.config.window_height
        self.page.window.min_width = 900
        self.page.window.min_height = 600
        if self.config.window_left is not None:
            self.page.window.left = self.config.window_left
        if self.config.window_top is not None:
            self.page.window.top = self.config.window_top
        self.page.fonts = {"Inter": "assets/fonts/Inter.ttf", "JetBrains Mono": "assets/fonts/JetBrainsMono.ttf"}
        self.page.sheetsync_theme = self.config.theme
        self.page.on_window_event = self.on_window_event
        apply_page_theme(self.page, self.config.theme)
        self.tray.start()

    def start(self) -> None:
        if not self.config.setup_complete:
            Onboarding(self.page, self.config, self.finish_onboarding).refresh()
            return
        if has_crash_lock():
            self.add_activity("info", "App recovered after an interrupted sync. Resync now is available.", "")
        self.start_watcher()
        self.render()

    def finish_onboarding(self) -> None:
        self.start_watcher()
        self.render()

    def render(self) -> None:
        self.page.controls.clear()
        self.page.horizontal_alignment = ft.CrossAxisAlignment.START
        self.page.vertical_alignment = ft.MainAxisAlignment.START
        self.page.padding = 0
        self.page.sheetsync_theme = self.config.theme
        apply_page_theme(self.page, self.config.theme)
        self.page.add(
            ft.Row(
                [
                    self.sidebar(),
                    ft.Container(
                        content=ft.Column(
                            [
                                ft.Row([display(self.view, self.palette)], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
                                self.current_view(),
                            ],
                            spacing=20,
                            expand=True,
                        ),
                        bgcolor=self.palette["bg"],
                        padding=ft.Padding(24, 24, 24, 24),
                        expand=True,
                    ),
                ],
                spacing=0,
                expand=True,
            )
        )
        self.page.update()

    def sidebar(self) -> ft.Container:
        return ft.Container(
            width=240,
            bgcolor=self.palette["surface"],
            border=ft.Border(ft.BorderSide(0, "transparent"), ft.BorderSide(1, self.palette["border_subtle"]), ft.BorderSide(0, "transparent"), ft.BorderSide(0, "transparent")),
            padding=ft.Padding(16, 20, 16, 20),
            content=ft.Column(
                [
                    ft.Row([ft.Image(src="icons/app_logo.png", width=28, height=28), ft.Text("SheetSync", size=18, weight=ft.FontWeight.W_600, color=self.palette["text"])], spacing=10),
                    ft.Column(
                        [
                            nav_item("Dashboard", "HOME_OUTLINED", self.view == "Dashboard", self.palette, lambda _: self.set_view("Dashboard")),
                            nav_item("Activity Log", "LIST_ALT_OUTLINED", self.view == "Activity Log", self.palette, lambda _: self.set_view("Activity Log")),
                            nav_item("Settings", "SETTINGS_OUTLINED", self.view == "Settings", self.palette, lambda _: self.set_view("Settings")),
                        ],
                        spacing=6,
                    ),
                    ft.Container(expand=True),
                    ft.Row(
                        [
                            ft.IconButton(icon("LIGHT_MODE" if self.config.theme == "dark" else "DARK_MODE", 20, self.palette["text_muted"]), on_click=self.toggle_theme, tooltip="Toggle theme"),
                            ft.CircleAvatar(content=ft.Text((self.config.google_email[:1] or "S").upper()), bgcolor=self.palette["surface_elevated"], color=self.palette["text"]),
                            ft.Text(self.config.google_email or "Not connected", size=12, color=self.palette["text_muted"], overflow=ft.TextOverflow.ELLIPSIS, expand=True),
                        ],
                        spacing=8,
                    ),
                ],
                spacing=24,
                expand=True,
            ),
        )

    def current_view(self) -> ft.Control:
        entries = self.filtered_activity()
        if self.view == "Settings":
            return SettingsView(self.config, self.save_and_refresh, self.disconnect_google, self.confirm_reset, self.choose_excel_file).render()
        if self.view == "Activity Log":
            return ActivityLogView(self.config, entries, self.search_activity, self.export_activity).render()
        return DashboardView(self.config, self.status, entries, self.sync_clicked, self.pause_clicked, lambda _: self.set_view("Settings"), self.set_filter).render()

    def filtered_activity(self) -> list[dict]:
        entries = self.activity
        if self.filter != "All":
            wanted = {"Syncs": "success", "Conflicts": "conflict", "Errors": "error"}[self.filter]
            entries = [e for e in entries if e.get("kind") == wanted]
        if self.search:
            entries = [e for e in entries if self.search.lower() in e.get("message", "").lower()]
        return entries

    def set_view(self, value: str):
        self.view = value
        self.render()

    def set_filter(self, event):
        self.filter = event.control.value
        self.render()

    def search_activity(self, event):
        self.search = event.control.value
        self.render()

    def save_and_refresh(self):
        self.config.sheet_id = sheet_id_from_url(self.config.sheet_url) or self.config.sheet_id
        save_config(self.config)
        self.start_watcher()
        self.render()

    def toggle_theme(self, _):
        self.config.theme = "light" if self.config.theme == "dark" else "dark"
        self.save_and_refresh()

    def pause_clicked(self, _):
        self.config.paused = not self.config.paused
        save_config(self.config)
        if self.config.paused and self.watcher:
            self.watcher.stop()
        else:
            self.start_watcher()
        self.render()

    def sync_clicked(self, _=None):
        threading.Thread(target=self.run_sync, args=("manual",), daemon=True).start()

    def run_sync(self, reason: str):
        try:
            self.status = "syncing"
            self.render()
            stats = self.engine.sync_now(reason)
            rows = f"+{stats.get('rows', 0)} rows" if stats.get("rows", 0) else ""
            kind = "conflict" if stats.get("conflicts", 0) else "success"
            self.add_activity(kind, f"Synced {stats.get('rows', 0)} rows from {reason}", rows)
            self.status = "watching"
            toast(self.page, "Sync complete", "success")
            self.notify("SheetSync", "Sync complete")
        except ConnectionError as exc:
            self.status = "error"
            self.add_activity("error", str(exc), "")
            toast(self.page, str(exc), "error")
            self.notify("SheetSync error", str(exc))
        except (SyncError, AuthError, Exception) as exc:
            self.status = "error"
            self.add_activity("error", str(exc), "")
            toast(self.page, str(exc), "error")
            self.notify("SheetSync error", str(exc))
        self.render()

    def on_engine_event(self, event: dict):
        if event.get("state"):
            self.status = str(event["state"])

    def add_activity(self, kind: str, message: str, rows: str):
        now = datetime.now()
        self.activity.append({"time": now.isoformat(), "time_label": now.strftime("%I:%M %p").lstrip("0"), "kind": kind, "message": message, "rows": rows})
        self.activity = self.activity[-500:]
        save_activity(self.activity)

    def start_watcher(self):
        if self.watcher:
            self.watcher.stop()
            self.watcher = None
        if self.config.paused or not self.config.excel_path:
            return
        try:
            self.watcher = ExcelWatcher(self.config.excel_path, self.config.debounce_delay, lambda: self.run_sync("Excel"))
            self.watcher.start()
            self.status = "watching"
        except FileNotFoundError:
            self.status = "error"
            self.add_activity("error", "Excel file not found. Locate the file to resume syncing.", "")

    def disconnect_google(self, _):
        disconnect()
        self.config.google_email = ""
        save_config(self.config)
        toast(self.page, "Google account disconnected", "info")
        self.render()

    def confirm_reset(self, _):
        def reset(_):
            reset_all()
            self.config = AppConfig()
            self.activity = []
            self.page.close(dialog)
            Onboarding(self.page, self.config, self.finish_onboarding).refresh()

        dialog = ft.AlertDialog(
            modal=True,
            title=ft.Text("Reset all settings?"),
            content=ft.Text("This removes local config, token, queue, and activity history."),
            actions=[ft.TextButton("Cancel", on_click=lambda _: self.page.close(dialog)), ft.TextButton("Reset", on_click=reset)],
        )
        self.page.open(dialog)

    async def choose_excel_file(self, _):
        files = await self.file_picker.pick_files(allowed_extensions=["xlsx"], allow_multiple=False)
        if files:
            self.config.excel_path = files[0].path
            self.save_and_refresh()

    async def export_activity(self, _):
        path = await self.export_picker.save_file(file_name="sheetsync-activity.csv", allowed_extensions=["csv"])
        if path:
            export_activity_csv(path, self.filtered_activity())
            toast(self.page, "Activity exported", "success")

    def on_window_event(self, event):
        if event.data == "close" and self.config.minimize_to_tray:
            self.page.window.prevent_close = True
            self.page.window.visible = False
            self.page.update()
        self.config.window_width = int(self.page.window.width or self.config.window_width)
        self.config.window_height = int(self.page.window.height or self.config.window_height)
        self.config.window_left = int(self.page.window.left) if self.page.window.left is not None else None
        self.config.window_top = int(self.page.window.top) if self.page.window.top is not None else None
        save_config(self.config)

    def open_from_tray(self):
        self.page.window.visible = True
        self.page.window.to_front()
        self.page.update()

    def toggle_pause_from_tray(self):
        self.config.paused = not self.config.paused
        save_config(self.config)
        if self.config.paused and self.watcher:
            self.watcher.stop()
        elif not self.config.paused:
            self.start_watcher()
        self.render()

    def quit_from_tray(self):
        if self.watcher:
            self.watcher.stop()
        self.tray.stop()
        self.page.window.destroy()

    def notify(self, title: str, message: str):
        if not self.config.notifications:
            return
        try:
            if not self.page.window.visible:
                notification.notify(title=title, message=message, app_name="SheetSync", timeout=4)
        except Exception:
            return


def main(page: ft.Page):
    app = SheetSyncApp(page)
    app.start()


if __name__ == "__main__":
    ft.app(target=main, assets_dir="assets")
