from __future__ import annotations

import threading
import time
from pathlib import Path
from typing import Callable

import flet as ft

from .theme import caption, heading, tokens


LUCIDE_PATHS = {
    "arrow-back": '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    "arrow-forward": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    "check": '<path d="M20 6 9 17l-5-5"/>',
    "check-circle": '<path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/>',
    "circle": '<circle cx="12" cy="12" r="10"/>',
    "download": '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
    "file": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v6h6"/><path d="M10 13h4"/><path d="M10 17h4"/>',
    "folder-open": '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6A2 2 0 0 1 18.46 20H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4.9a2 2 0 0 1 1.69.9L13 6h5a2 2 0 0 1 2 2v2"/>',
    "grid": '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    "home": '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/>',
    "info": '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    "inbox": '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    "list": '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
    "login": '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/>',
    "logout": '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
    "moon": '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    "pause": '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
    "play": '<polygon points="6 3 20 12 6 21 6 3"/>',
    "save": '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>',
    "search": '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    "settings": '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.72l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"/><circle cx="12" cy="12" r="3"/>',
    "sun": '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    "sync": '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
    "trash": '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    "upload-file": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="m9 15 3-3 3 3"/>',
    "x-circle": '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>',
}

ICON_ALIASES = {
    "ARROW_BACK": "arrow-back",
    "ARROW_FORWARD": "arrow-forward",
    "CHECK": "check",
    "CONTENT_PASTE": "file",
    "DARK_MODE": "moon",
    "DELETE_FOREVER": "trash",
    "DESCRIPTION_OUTLINED": "file",
    "DOWNLOAD": "download",
    "ERROR_OUTLINE": "x-circle",
    "FOLDER_OPEN": "folder-open",
    "GRID_ON_OUTLINED": "grid",
    "HOME_OUTLINED": "home",
    "INFO_OUTLINE": "info",
    "INBOX_OUTLINED": "inbox",
    "LIGHT_MODE": "sun",
    "LIST_ALT_OUTLINED": "list",
    "LOGIN": "login",
    "LOGOUT": "logout",
    "PAUSE": "pause",
    "PLAY_ARROW": "play",
    "SAVE": "save",
    "SEARCH": "search",
    "SETTINGS_OUTLINED": "settings",
    "SYNC": "sync",
    "UPLOAD_FILE": "upload-file",
}


def icon(name: str, size: int = 18, color: str = "#FAFAFA") -> ft.Image:
    key = ICON_ALIASES.get(name, name).lower()
    if key not in LUCIDE_PATHS:
        key = "circle"
    return ft.Image(src=f"icons/lucide/{key}.svg", width=size, height=size, color=color, color_blend_mode=ft.BlendMode.SRC_IN)


def google_logo(size: int = 18) -> ft.Image:
    return ft.Image(src="icons/google.svg", width=size, height=size)


def border_all(width: int, color: str) -> ft.Border:
    side = ft.BorderSide(width, color)
    return ft.Border(side, side, side, side)


def border_left(width: int, color: str) -> ft.Border:
    empty = ft.BorderSide(0, "transparent")
    return ft.Border(empty, empty, empty, ft.BorderSide(width, color))


def padding_symmetric(horizontal: int, vertical: int) -> ft.Padding:
    return ft.Padding(horizontal, vertical, horizontal, vertical)


def card(content: ft.Control, palette: dict[str, str], padding: int = 24, clickable: bool = False, on_click=None) -> ft.Container:
    return ft.Container(
        content=content,
        padding=padding,
        bgcolor=palette["surface"],
        border=border_all(1, palette["border_subtle"]),
        border_radius=12,
        shadow=ft.BoxShadow(blur_radius=2, spread_radius=0, color="#11000000", offset=ft.Offset(0, 1)),
        animate=ft.Animation(180, ft.AnimationCurve.EASE_OUT),
        ink=clickable,
        on_click=on_click,
    )


def badge(label: str, palette: dict[str, str], color: str | None = None, bg: str | None = None) -> ft.Container:
    color = color or palette["text_muted"]
    bg = bg or palette["surface_elevated"]
    return ft.Container(
        content=ft.Text(label, size=12, weight=ft.FontWeight.W_500, color=color),
        bgcolor=bg,
        border=border_all(1, palette["border"]),
        border_radius=999,
        padding=padding_symmetric(horizontal=10, vertical=4),
    )


def primary_button(label: str, palette: dict[str, str], on_click=None, icon_name: str | None = None, expand: bool = False) -> ft.ElevatedButton:
    is_google = icon_name == "GOOGLE"
    return ft.ElevatedButton(
        content=label,
        icon=google_logo(18) if icon_name == "GOOGLE" else icon(icon_name, 18, "#FFFFFF") if icon_name else None,
        on_click=on_click,
        expand=expand,
        style=ft.ButtonStyle(
            bgcolor="#FFFFFF" if is_google else palette["accent"],
            color="#18181B" if is_google else "#FFFFFF",
            shape=ft.RoundedRectangleBorder(radius=8),
            padding=padding_symmetric(horizontal=18, vertical=16),
        ),
    )


def outline_button(label: str, palette: dict[str, str], on_click=None, icon_name: str | None = None, expand: bool = False, color: str | None = None) -> ft.OutlinedButton:
    return ft.OutlinedButton(
        content=label,
        icon=icon(icon_name, 18, color or palette["text"]) if icon_name else None,
        on_click=on_click,
        expand=expand,
        style=ft.ButtonStyle(
            color=color or palette["text"],
            side=ft.BorderSide(1, color or palette["border"]),
            shape=ft.RoundedRectangleBorder(radius=8),
            padding=padding_symmetric(horizontal=18, vertical=16),
        ),
    )


def app_textfield(label: str, value: str, palette: dict[str, str], on_change=None, hint: str = "", password: bool = False, suffix=None, expand: bool = False) -> ft.TextField:
    return ft.TextField(
        label=label,
        value=value,
        hint_text=hint,
        password=password,
        on_change=on_change,
        suffix=suffix,
        expand=expand,
        text_size=14,
        border_radius=8,
        border_color=palette["border"],
        focused_border_color=palette["accent"],
        filled=True,
        fill_color=palette["surface_elevated"],
        color=palette["text"],
        label_style=ft.TextStyle(color=palette["text_muted"], size=12),
    )


def section_card(title: str, content: list[ft.Control], palette: dict[str, str]) -> ft.Container:
    return card(
        ft.Column([heading(title, palette), ft.Column(content, spacing=16)], spacing=18),
        palette,
    )


def status_dot(color: str, pulse: bool = False) -> ft.Container:
    return ft.Container(
        width=10,
        height=10,
        bgcolor=color,
        border_radius=999,
        opacity=0.9,
        animate_opacity=ft.Animation(700, ft.AnimationCurve.EASE_IN_OUT) if pulse else None,
    )


def toast(page: ft.Page, message: str, kind: str = "info", duration: float = 4) -> None:
    palette = tokens(getattr(page, "sheetsync_theme", "dark"))
    colors = {"success": palette["success"], "error": palette["error"], "info": palette["accent"]}
    icons = {"success": "check-circle", "error": "x-circle", "info": "info"}
    item = ft.Container(
        content=ft.Row(
            [icon(icons.get(kind, "info"), 18, colors.get(kind, palette["accent"])), ft.Text(message, color=palette["text"], size=14)],
            spacing=10,
        ),
        bgcolor=palette["surface"],
        border=border_left(4, colors.get(kind, palette["accent"])),
        border_radius=8,
        padding=16,
        shadow=ft.BoxShadow(blur_radius=16, color="#33000000", offset=ft.Offset(0, 8)),
        animate_offset=ft.Animation(220, ft.AnimationCurve.EASE_OUT),
    )
    if not hasattr(page, "toast_stack"):
        page.toast_stack = ft.Column([], spacing=8, right=24, bottom=24)
        page.overlay.append(page.toast_stack)
    page.toast_stack.controls.append(item)
    page.update()

    def dismiss():
        time.sleep(duration)
        try:
            page.toast_stack.controls.remove(item)
            page.update()
        except Exception:
            pass

    threading.Thread(target=dismiss, daemon=True).start()


def file_label(path: str, palette: dict[str, str]) -> ft.Row:
    file_name = Path(path).name if path else "No file selected"
    return ft.Row(
        [
            icon("file", 20, palette["text_muted"]),
            ft.Column(
                [
                    ft.Text(file_name, size=14, weight=ft.FontWeight.W_500, color=palette["text"]),
                    ft.Text(path or "Choose an .xlsx file", size=12, font_family="JetBrains Mono", color=palette["text_muted"], overflow=ft.TextOverflow.ELLIPSIS),
                ],
                spacing=2,
                expand=True,
            ),
        ],
        spacing=12,
    )


def nav_item(label: str, icon_name: str, selected: bool, palette: dict[str, str], on_click: Callable) -> ft.Container:
    return ft.Container(
        content=ft.Row(
            [
                icon(icon_name, 18, palette["text"] if selected else palette["text_muted"]),
                ft.Text(label, size=14, weight=ft.FontWeight.W_500, color=palette["text"] if selected else palette["text_muted"]),
            ],
            spacing=12,
        ),
        padding=padding_symmetric(horizontal=12, vertical=10),
        bgcolor=palette["surface_elevated"] if selected else None,
        border_radius=8,
        ink=True,
        on_click=on_click,
    )


def empty_state(message: str, palette: dict[str, str]) -> ft.Container:
    return ft.Container(
        content=ft.Column(
            [
                icon("inbox", 38, palette["text_subtle"]),
                caption(message, palette),
            ],
            horizontal_alignment=ft.CrossAxisAlignment.CENTER,
            spacing=12,
        ),
        alignment=ft.Alignment(0, 0),
        padding=32,
    )
