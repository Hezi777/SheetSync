from __future__ import annotations

import flet as ft

from sheetsync.core.storage import AppConfig
from .components import app_textfield, outline_button, primary_button, section_card
from .theme import caption, tokens


class SettingsView:
    def __init__(self, config: AppConfig, on_change, on_disconnect, on_reset, on_choose_file):
        self.config = config
        self.on_change = on_change
        self.on_disconnect = on_disconnect
        self.on_reset = on_reset
        self.on_choose_file = on_choose_file
        self.palette = tokens(config.theme)

    def render(self) -> ft.Control:
        return ft.Column(
            [
                section_card(
                    "Account",
                    [
                        ft.Row(
                            [
                                ft.CircleAvatar(content=ft.Text((self.config.google_email[:1] or "S").upper()), bgcolor=self.palette["accent"]),
                                ft.Column([ft.Text(self.config.google_email or "Not connected", color=self.palette["text"]), caption("Google account", self.palette)], expand=True),
                                outline_button("Disconnect", self.palette, self.on_disconnect, "LOGOUT"),
                            ],
                            spacing=14,
                        )
                    ],
                    self.palette,
                ),
                section_card(
                    "Files",
                    [
                        ft.Row([app_textfield("Excel path", self.config.excel_path, self.palette, lambda e: self.changed("excel_path", e.control.value), expand=True), outline_button("Browse", self.palette, self.on_choose_file, "FOLDER_OPEN")]),
                        app_textfield("Sheet URL", self.config.sheet_url, self.palette, lambda e: self.changed("sheet_url", e.control.value)),
                        ft.Dropdown(
                            label="Match rows by",
                            value=self.config.match_mode,
                            options=[ft.DropdownOption(v) for v in ["Row position", "Column value"]],
                            on_select=lambda e: self.changed("match_mode", e.control.value),
                            bgcolor=self.palette["surface_elevated"],
                        ),
                        caption("Row position syncs row 2 to row 2. Use Column value only when rows may move around.", self.palette) if self.config.match_mode != "Column value" else app_textfield("Match column", self.config.match_column, self.palette, lambda e: self.changed("match_column", e.control.value)),
                    ],
                    self.palette,
                ),
                section_card(
                    "Sync",
                    [
                        ft.Dropdown(
                            label="Direction",
                            value=self.config.sync_direction,
                            options=[ft.DropdownOption(v) for v in ["Bidirectional", "Excel -> Sheets", "Sheets -> Excel"]],
                            on_select=lambda e: self.changed("sync_direction", e.control.value),
                            bgcolor=self.palette["surface_elevated"],
                        ),
                        ft.Dropdown(
                            label="Conflict resolution",
                            value=self.config.conflict_resolution,
                            options=[ft.DropdownOption(v) for v in ["Last modified wins", "Excel wins", "Sheets wins"]],
                            on_select=lambda e: self.changed("conflict_resolution", e.control.value),
                            bgcolor=self.palette["surface_elevated"],
                        ),
                        ft.Column(
                            [
                                caption(f"Debounce delay: {self.config.debounce_delay:.1f} seconds", self.palette),
                                ft.Slider(min=1, max=10, divisions=18, value=self.config.debounce_delay, on_change=lambda e: self.changed("debounce_delay", float(e.control.value))),
                            ]
                        ),
                    ],
                    self.palette,
                ),
                section_card(
                    "App",
                    [
                        ft.Switch(label="Light theme", value=self.config.theme == "light", on_change=lambda e: self.changed("theme", "light" if e.control.value else "dark")),
                        ft.Switch(label="Start on system boot", value=self.config.start_on_boot, on_change=lambda e: self.changed("start_on_boot", e.control.value)),
                        ft.Switch(label="Show notifications", value=self.config.notifications, on_change=lambda e: self.changed("notifications", e.control.value)),
                        ft.Switch(label="Minimize to tray on close", value=self.config.minimize_to_tray, on_change=lambda e: self.changed("minimize_to_tray", e.control.value)),
                    ],
                    self.palette,
                ),
                section_card("Danger zone", [outline_button("Reset all settings", self.palette, self.on_reset, "DELETE_FOREVER", color=self.palette["error"])], self.palette),
            ],
            spacing=16,
            scroll=ft.ScrollMode.AUTO,
            expand=True,
        )

    def changed(self, key: str, value):
        setattr(self.config, key, value)
        self.on_change()
