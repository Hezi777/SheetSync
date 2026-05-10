from __future__ import annotations

import threading

import flet as ft

from core.google_auth import AuthError, connect_google, credentials_configured, fetch_sheet_metadata, save_credentials_file, save_credentials_json, sheet_id_from_url
from core.storage import AppConfig, save_config
from .components import app_textfield, badge, border_all, card, file_label, icon, outline_button, primary_button, toast
from .theme import body, caption, display, heading, tokens


class Onboarding:
    def __init__(self, page: ft.Page, config: AppConfig, on_done):
        self.page = page
        self.config = config
        self.on_done = on_done
        self.step = self.initial_step()
        self.sheet_title = ""
        self.worksheets: list[str] = []
        self.credentials_json = ""
        self.file_picker = ft.FilePicker()
        if self.page is not None:
            self.page.services.append(self.file_picker)

    def step_ids(self) -> list[str]:
        ids = ["google", "files", "preferences"]
        if not credentials_configured():
            ids.insert(0, "credentials")
        return ids

    def initial_step(self) -> int:
        ids = self.step_ids()
        if "credentials" in ids:
            return 0
        if not self.config.google_email:
            return ids.index("google")
        if not (self.config.excel_path and self.config.sheet_url):
            return ids.index("files")
        return ids.index("preferences")

    @property
    def palette(self):
        return tokens(self.config.theme)

    def dots(self) -> ft.Row:
        return ft.Row(
            [
                ft.Container(width=8, height=8, border_radius=999, bgcolor=self.palette["accent"] if i == self.step else self.palette["border"])
                for i in range(len(self.step_ids()))
            ],
            alignment=ft.MainAxisAlignment.CENTER,
            spacing=8,
        )

    def render(self) -> ft.Control:
        step_map = {
            "credentials": self.step_credentials,
            "google": self.step_google,
            "files": self.step_files,
            "preferences": self.step_preferences,
        }
        content = step_map[self.step_ids()[self.step]]()
        onboarding_card = ft.Container(
            width=584,
            content=card(ft.Column([self.dots(), content], spacing=28), self.palette, padding=32),
        )
        return ft.Container(
            expand=True,
            bgcolor=self.palette["bg"],
            alignment=ft.Alignment(0, 0),
            padding=24,
            content=ft.Row(
                controls=[
                    ft.Column(
                        controls=[onboarding_card],
                        alignment=ft.MainAxisAlignment.CENTER,
                        horizontal_alignment=ft.CrossAxisAlignment.CENTER,
                    )
                ],
                alignment=ft.MainAxisAlignment.CENTER,
                vertical_alignment=ft.CrossAxisAlignment.CENTER,
                expand=True,
            ),
        )

    def refresh(self):
        self.page.horizontal_alignment = ft.CrossAxisAlignment.CENTER
        self.page.vertical_alignment = ft.MainAxisAlignment.CENTER
        self.page.padding = 0
        self.page.controls.clear()
        self.page.add(self.render())
        self.page.update()

    def step_credentials(self) -> ft.Control:
        configured = credentials_configured()
        paste_field = ft.TextField(
            label="Paste OAuth client JSON",
            value=self.credentials_json,
            multiline=True,
            min_lines=4,
            max_lines=7,
            on_change=lambda e: setattr(self, "credentials_json", e.control.value),
            border_radius=8,
            border_color=self.palette["border"],
            focused_border_color=self.palette["accent"],
            filled=True,
            fill_color=self.palette["surface_elevated"],
            color=self.palette["text"],
            hint_text='{"installed": {"client_id": "...", "client_secret": "..."}}',
        )
        return ft.Column(
            [
                display("Set up Google access", self.palette),
                body("Use a Google OAuth Desktop client. An API key cannot read and write your private Google Sheets as you, so SheetSync needs OAuth credentials.", self.palette, self.palette["text_muted"]),
                ft.Container(
                    content=ft.Column(
                        [
                            heading("Steps in Google Cloud", self.palette),
                            ft.Row(
                                [
                                    caption("1. Go to", self.palette),
                                    ft.TextButton(
                                        "console.cloud.google.com",
                                        url="https://console.cloud.google.com",
                                        style=ft.ButtonStyle(color=self.palette["accent"], padding=ft.Padding(0, 0, 0, 0)),
                                    ),
                                    caption("and create or select a project.", self.palette),
                                ],
                                spacing=4,
                                wrap=True,
                            ),
                            caption("2. Enable Google Sheets API and Google Drive API.", self.palette),
                            caption("3. Open APIs & Services -> Credentials.", self.palette),
                            caption("4. Create OAuth Client ID -> Desktop app.", self.palette),
                            caption("5. Download the JSON file, then choose it below or paste its contents.", self.palette),
                        ],
                        spacing=8,
                    ),
                    padding=16,
                    border=border_all(1, self.palette["border"]),
                    border_radius=8,
                    bgcolor=self.palette["surface_elevated"],
                ),
                outline_button("Choose credentials.json", self.palette, self.pick_credentials_file, "UPLOAD_FILE", expand=True),
                paste_field,
                primary_button("Save pasted credentials", self.palette, self.save_pasted_credentials, "SAVE", expand=True),
                badge("OAuth credentials saved", self.palette, self.palette["success"]) if configured else caption("No OAuth credentials saved yet.", self.palette),
                ft.Row([primary_button("Next", self.palette, lambda _: self.go(1), "ARROW_FORWARD", expand=True)], spacing=12),
            ],
            width=520,
            spacing=14,
            horizontal_alignment=ft.CrossAxisAlignment.STRETCH,
        )

    def step_google(self) -> ft.Control:
        connected = bool(self.config.google_email)
        actions = []
        if self.step > 0:
            actions.append(outline_button("Back", self.palette, lambda _: self.go(self.step - 1), "ARROW_BACK", expand=True))
        actions.append(primary_button("Next", self.palette, lambda _: self.go(self.step + 1), "ARROW_FORWARD", expand=True))

        def connect(_):
            def work():
                try:
                    email, _ = connect_google()
                    self.config.google_email = email
                    save_config(self.config)
                    toast(self.page, "Google account connected", "success")
                except AuthError as exc:
                    toast(self.page, str(exc), "error")
                self.refresh()

            threading.Thread(target=work, daemon=True).start()

        return ft.Column(
            [
                display("Connect your Google account", self.palette),
                body("SheetSync needs access to read and update the Google Sheet you choose.", self.palette, self.palette["text_muted"]),
                primary_button("Continue with Google", self.palette, connect, "GOOGLE", expand=True),
                badge(f"Connected: {self.config.google_email}", self.palette, self.palette["success"]) if connected else ft.Container(),
                ft.Row(actions, spacing=12),
            ],
            width=480,
            spacing=18,
            horizontal_alignment=ft.CrossAxisAlignment.STRETCH,
        )

    def step_files(self) -> ft.Control:
        sheet_url = app_textfield("Google Sheet URL", self.config.sheet_url, self.palette, self.sheet_url_changed, suffix=ft.IconButton(icon("CONTENT_PASTE", 18, self.palette["text_muted"])))
        match_mode = ft.Dropdown(
            label="Match rows by",
            value=self.config.match_mode,
            options=[ft.DropdownOption(v) for v in ["Row position", "Column value"]],
            on_select=lambda e: self.set_config("match_mode", e.control.value),
            border_color=self.palette["border"],
            bgcolor=self.palette["surface_elevated"],
            color=self.palette["text"],
        )
        match = app_textfield("Column name", self.config.match_column, self.palette, lambda e: self.set_config("match_column", e.control.value))
        worksheet = ft.Dropdown(
            label="Tab name",
            value=self.config.worksheet_name or (self.worksheets[0] if self.worksheets else None),
            options=[ft.DropdownOption(w) for w in self.worksheets],
            on_select=lambda e: self.set_config("worksheet_name", e.control.value),
            border_color=self.palette["border"],
            bgcolor=self.palette["surface_elevated"],
            color=self.palette["text"],
        )
        return ft.Column(
            [
                display("Choose your files", self.palette),
                ft.Container(content=file_label(self.config.excel_path, self.palette), padding=12, border=border_all(1, self.palette["border"]), border_radius=8),
                outline_button("Choose Excel file", self.palette, self.pick_excel_file, "FOLDER_OPEN", expand=True),
                sheet_url,
                caption(f"Fetched sheet: {self.sheet_title}", self.palette) if self.sheet_title else caption("Paste a Google Sheet URL to fetch tab names.", self.palette),
                worksheet if self.worksheets else ft.ProgressBar(width=480, visible=False),
                match_mode,
                caption("Row position syncs row 2 to row 2, row 3 to row 3, and so on.", self.palette) if self.config.match_mode != "Column value" else caption("Column name that uniquely identifies rows (e.g., ID, Email)", self.palette),
                match if self.config.match_mode == "Column value" else ft.Container(),
                ft.Row(
                    [
                        outline_button("Back", self.palette, lambda _: self.go(self.step - 1), "ARROW_BACK", expand=True),
                        primary_button("Next", self.palette, lambda _: self.go(self.step + 1), "ARROW_FORWARD", expand=True),
                    ],
                    spacing=12,
                ),
            ],
            width=480,
            spacing=14,
            horizontal_alignment=ft.CrossAxisAlignment.STRETCH,
        )

    def step_preferences(self) -> ft.Control:
        direction = ft.SegmentedButton(
            selected=[self.config.sync_direction],
            segments=[ft.Segment(value=v, label=ft.Text(v)) for v in ["Bidirectional", "Excel -> Sheets", "Sheets -> Excel"]],
            on_change=lambda e: self.set_config("sync_direction", self.selected_direction(e.control.selected)),
        )
        conflict = ft.Dropdown(
            label="Conflict resolution",
            value=self.config.conflict_resolution,
            options=[ft.DropdownOption(v) for v in ["Last modified wins", "Excel wins", "Sheets wins"]],
            on_select=lambda e: self.set_config("conflict_resolution", e.control.value),
            border_color=self.palette["border"],
            bgcolor=self.palette["surface_elevated"],
        )
        return ft.Column(
            [
                display("Sync preferences", self.palette),
                direction,
                conflict,
                ft.Switch(label="Start on system boot", value=self.config.start_on_boot, on_change=lambda e: self.set_config("start_on_boot", e.control.value)),
                ft.Switch(label="Show notifications", value=self.config.notifications, on_change=lambda e: self.set_config("notifications", e.control.value)),
                ft.Switch(label="Minimize to tray on close", value=self.config.minimize_to_tray, on_change=lambda e: self.set_config("minimize_to_tray", e.control.value)),
                ft.Row(
                    [
                        outline_button("Back", self.palette, lambda _: self.go(self.step - 1), "ARROW_BACK", expand=True),
                        primary_button("Finish setup", self.palette, self.finish, "CHECK", expand=True),
                    ],
                    spacing=12,
                ),
            ],
            width=480,
            spacing=18,
            horizontal_alignment=ft.CrossAxisAlignment.STRETCH,
        )

    async def pick_excel_file(self, _=None):
        files = await self.file_picker.pick_files(allowed_extensions=["xlsx"], allow_multiple=False)
        if files:
            self.config.excel_path = files[0].path
            save_config(self.config)
            self.refresh()

    def sheet_url_changed(self, event):
        self.config.sheet_url = event.control.value
        self.config.sheet_id = sheet_id_from_url(self.config.sheet_url)
        save_config(self.config)
        if self.config.sheet_id:
            def work():
                try:
                    data = fetch_sheet_metadata(self.config.sheet_url)
                    self.config.sheet_id = str(data["sheet_id"])
                    self.sheet_title = str(data["title"])
                    self.worksheets = list(data["worksheets"])
                    if self.worksheets and not self.config.worksheet_name:
                        self.config.worksheet_name = self.worksheets[0]
                    save_config(self.config)
                except Exception as exc:
                    toast(self.page, str(exc), "error")
                self.refresh()
            threading.Thread(target=work, daemon=True).start()

    def set_config(self, key: str, value):
        setattr(self.config, key, value)
        save_config(self.config)
        if key == "match_mode":
            self.refresh()

    def selected_direction(self, selected):
        if isinstance(selected, str):
            return selected
        if selected:
            return list(selected)[0]
        return self.config.sync_direction

    def go(self, step: int):
        step = max(0, min(step, len(self.step_ids()) - 1))
        self.step = step
        self.refresh()

    def finish(self, _):
        self.config.setup_complete = True
        save_config(self.config)
        self.on_done()
    async def pick_credentials_file(self, _=None):
        files = await self.file_picker.pick_files(allowed_extensions=["json"], allow_multiple=False)
        if not files:
            return
        try:
            save_credentials_file(files[0].path)
            toast(self.page, "OAuth credentials saved", "success")
        except AuthError as exc:
            toast(self.page, str(exc), "error")
        self.refresh()

    def save_pasted_credentials(self, _):
        try:
            save_credentials_json(self.credentials_json)
            self.credentials_json = ""
            toast(self.page, "OAuth credentials saved", "success")
        except AuthError as exc:
            toast(self.page, str(exc), "error")
        self.refresh()
