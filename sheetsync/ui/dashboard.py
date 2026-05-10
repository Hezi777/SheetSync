from __future__ import annotations

from datetime import datetime, timezone

import flet as ft

from sheetsync.core.storage import AppConfig
from .components import badge, border_all, card, empty_state, file_label, icon, outline_button, padding_symmetric, primary_button, status_dot
from .theme import body, caption, display, heading, tokens


def relative_time(iso_value: str) -> str:
    if not iso_value:
        return "Never synced"
    try:
        then = datetime.fromisoformat(iso_value)
        seconds = max(0, int((datetime.now(timezone.utc) - then).total_seconds()))
    except ValueError:
        return "Last sync unknown"
    if seconds < 60:
        return "Last sync just now"
    if seconds < 3600:
        return f"Last sync {seconds // 60} minutes ago"
    if seconds < 86400:
        return f"Last sync {seconds // 3600} hours ago"
    return f"Last sync {seconds // 86400} days ago"


class DashboardView:
    def __init__(self, config: AppConfig, status: str, activity: list[dict], on_sync, on_pause, on_settings, on_filter):
        self.config = config
        self.status = status
        self.activity = activity
        self.on_sync = on_sync
        self.on_pause = on_pause
        self.on_settings = on_settings
        self.on_filter = on_filter
        self.palette = tokens(config.theme)

    def render(self) -> ft.Control:
        return ft.Column(
            [
                self.hero(),
                ft.ResponsiveRow(
                    [
                        ft.Container(self.connection_card(), col={"sm": 12, "md": 6}),
                        ft.Container(self.stats_card(), col={"sm": 12, "md": 6}),
                    ],
                    spacing=16,
                    run_spacing=16,
                ),
                self.activity_feed(self.activity[-50:], compact=True),
            ],
            scroll=ft.ScrollMode.AUTO,
            spacing=16,
            expand=True,
        )

    def hero(self) -> ft.Container:
        if self.status == "syncing":
            color, label, headline = self.palette["warning"], "Syncing...", "Syncing..."
        elif self.status == "error":
            color, label, headline = self.palette["error"], "Error", "Sync paused"
        elif self.config.paused:
            color, label, headline = self.palette["warning"], "Paused", "Sync paused"
        else:
            color, label, headline = self.palette["success"], "Watching", "All synced"
        return card(
            ft.Column(
                [
                    ft.Row(
                        [
                            ft.Column([display(headline, self.palette), body(relative_time(self.config.last_sync_iso), self.palette, self.palette["text_muted"])], spacing=6, expand=True),
                            ft.Container(
                                content=ft.Row([status_dot(color, label == "Watching"), ft.Text(label, size=12, weight=ft.FontWeight.W_500, color=self.palette["text"])], spacing=8),
                                bgcolor=self.palette["surface_elevated"],
                                border=border_all(1, self.palette["border"]),
                                border_radius=999,
                                padding=padding_symmetric(horizontal=12, vertical=7),
                            ),
                        ]
                    ),
                    ft.Row(
                        [
                            primary_button("Sync Now", self.palette, self.on_sync, "SYNC", expand=True),
                            outline_button("Resume" if self.config.paused else "Pause", self.palette, self.on_pause, "PAUSE" if not self.config.paused else "PLAY_ARROW", expand=True),
                        ],
                        spacing=12,
                    ),
                ],
                spacing=28,
            ),
            self.palette,
            padding=32,
        )

    def connection_card(self) -> ft.Container:
        return card(
            ft.Column(
                [
                    ft.Row([heading("Connection", self.palette), ft.TextButton("Edit", on_click=self.on_settings)], alignment=ft.MainAxisAlignment.SPACE_BETWEEN),
                    file_label(self.config.excel_path, self.palette),
                    ft.Row(
                        [
                            icon("GRID_ON_OUTLINED", 20, self.palette["text_muted"]),
                            ft.Column(
                                [
                                    ft.Text(self.config.sheet_url or "No Google Sheet selected", size=14, color=self.palette["text"], overflow=ft.TextOverflow.ELLIPSIS),
                                    ft.Row([badge(self.config.worksheet_name or "Sheet1", self.palette)], spacing=8),
                                ],
                                expand=True,
                            ),
                        ],
                        spacing=12,
                    ),
                    ft.Row(
                        [
                            caption("Match rows by", self.palette),
                            badge(self.config.match_column if self.config.match_mode == "Column value" else "Row position", self.palette, self.palette["accent"]),
                        ],
                        alignment=ft.MainAxisAlignment.SPACE_BETWEEN,
                    ),
                ],
                spacing=18,
            ),
            self.palette,
        )

    def stats_card(self) -> ft.Container:
        stats = self.config.stats
        items = [
            ("Total syncs", stats.get("total_syncs", 0), self.palette["text"]),
            ("Rows synced", stats.get("rows_synced", 0), self.palette["text"]),
            ("Conflicts resolved", stats.get("conflicts_resolved", 0), self.palette["text"]),
            ("Errors", stats.get("errors", 0), self.palette["error"] if stats.get("errors", 0) else self.palette["text"]),
        ]
        return card(
            ft.Column(
                [
                    heading("Stats (last 24h)", self.palette),
                    ft.ResponsiveRow(
                        [
                            ft.Container(
                                content=ft.Column([ft.Text(str(value), size=26, weight=ft.FontWeight.W_600, color=color), caption(label, self.palette)], spacing=2),
                                col=6,
                            )
                            for label, value, color in items
                        ],
                        run_spacing=20,
                    ),
                ],
                spacing=22,
            ),
            self.palette,
        )

    def activity_feed(self, entries: list[dict], compact: bool = False) -> ft.Container:
        rows = []
        colors = {"success": self.palette["success"], "conflict": self.palette["warning"], "error": self.palette["error"], "info": self.palette["accent"]}
        for entry in reversed(entries):
            color = colors.get(entry.get("kind", "info"), self.palette["accent"])
            rows.append(
                ft.Row(
                    [
                        status_dot(color),
                        ft.Text(entry.get("time_label", ""), size=12, color=self.palette["text_muted"], width=72),
                        ft.Text(entry.get("message", ""), size=14, color=self.palette["text"], expand=True),
                        badge(entry.get("rows", ""), self.palette) if entry.get("rows") else ft.Container(),
                    ],
                    spacing=12,
                    vertical_alignment=ft.CrossAxisAlignment.CENTER,
                )
            )
        content = empty_state("No activity yet. Edit your Excel file to see syncs appear here.", self.palette) if not rows else ft.Column(rows, spacing=14, scroll=ft.ScrollMode.AUTO if not compact else None)
        return card(
            ft.Column(
                [
                    ft.Row(
                        [
                            heading("Recent activity", self.palette),
                            ft.Dropdown(
                                width=150,
                                value="All",
                                options=[ft.DropdownOption(v) for v in ["All", "Syncs", "Conflicts", "Errors"]],
                                on_select=self.on_filter,
                                border_color=self.palette["border"],
                                bgcolor=self.palette["surface_elevated"],
                            ),
                        ],
                        alignment=ft.MainAxisAlignment.SPACE_BETWEEN,
                    ),
                    content,
                ],
                spacing=18,
            ),
            self.palette,
        )


class ActivityLogView:
    def __init__(self, config: AppConfig, activity: list[dict], on_search, on_export):
        self.config = config
        self.activity = activity
        self.on_search = on_search
        self.on_export = on_export
        self.palette = tokens(config.theme)

    def render(self) -> ft.Control:
        grouped = self.grouped()
        controls: list[ft.Control] = [
            ft.Row(
                [
                    ft.Container(
                        content=ft.Row(
                            [
                                icon("SEARCH", 18, self.palette["text_muted"]),
                                ft.TextField(hint_text="Search activity", on_change=self.on_search, expand=True, border_radius=8, filled=True, fill_color=self.palette["surface"]),
                            ],
                            spacing=8,
                        ),
                        expand=True,
                    ),
                    primary_button("Export CSV", self.palette, self.on_export, "DOWNLOAD"),
                ],
                spacing=12,
            )
        ]
        if not grouped:
            controls.append(empty_state("No activity has been recorded yet.", self.palette))
        for title, entries in grouped.items():
            controls.append(caption(title, self.palette))
            controls.extend(DashboardView(self.config, "watching", entries, None, None, None, None).activity_feed(entries, compact=True).content.controls[1].controls)
        return ft.Column(controls, spacing=18, scroll=ft.ScrollMode.AUTO, expand=True)

    def grouped(self) -> dict[str, list[dict]]:
        groups: dict[str, list[dict]] = {}
        today = datetime.now().date()
        for entry in reversed(self.activity):
            try:
                day = datetime.fromisoformat(entry.get("time", "")).date()
            except ValueError:
                day = today
            if day == today:
                label = "Today"
            elif (today - day).days == 1:
                label = "Yesterday"
            else:
                label = "Earlier this week"
            groups.setdefault(label, []).append(entry)
        return groups
