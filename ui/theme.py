from __future__ import annotations

import flet as ft


DARK = {
    "bg": "#0A0A0B",
    "surface": "#111113",
    "surface_elevated": "#18181B",
    "border": "#27272A",
    "border_subtle": "#1F1F23",
    "text": "#FAFAFA",
    "text_muted": "#A1A1AA",
    "text_subtle": "#71717A",
    "accent": "#3B82F6",
    "success": "#10B981",
    "warning": "#F59E0B",
    "error": "#EF4444",
}

LIGHT = {
    "bg": "#FFFFFF",
    "surface": "#FAFAFA",
    "surface_elevated": "#F4F4F5",
    "border": "#E4E4E7",
    "border_subtle": "#E4E4E7",
    "text": "#09090B",
    "text_muted": "#52525B",
    "text_subtle": "#71717A",
    "accent": "#2563EB",
    "success": "#10B981",
    "warning": "#F59E0B",
    "error": "#EF4444",
}

SPACING = [4, 8, 12, 16, 20, 24, 32, 48]


def tokens(mode: str) -> dict[str, str]:
    return LIGHT if mode == "light" else DARK


def apply_page_theme(page: ft.Page, mode: str) -> None:
    palette = tokens(mode)
    page.theme_mode = ft.ThemeMode.LIGHT if mode == "light" else ft.ThemeMode.DARK
    page.bgcolor = palette["bg"]
    page.theme = ft.Theme(
        color_scheme_seed=palette["accent"],
        font_family="Inter",
        visual_density=ft.VisualDensity.COMFORTABLE,
    )


def text_style(size: int, weight: ft.FontWeight = ft.FontWeight.W_400, color: str | None = None) -> ft.TextStyle:
    return ft.TextStyle(size=size, weight=weight, color=color)


def display(value: str, palette: dict[str, str]) -> ft.Text:
    return ft.Text(value, size=24, weight=ft.FontWeight.W_600, color=palette["text"])


def heading(value: str, palette: dict[str, str]) -> ft.Text:
    return ft.Text(value, size=18, weight=ft.FontWeight.W_600, color=palette["text"])


def body(value: str, palette: dict[str, str], color: str | None = None) -> ft.Text:
    return ft.Text(value, size=14, color=color or palette["text"])


def caption(value: str, palette: dict[str, str], color: str | None = None) -> ft.Text:
    return ft.Text(value, size=12, weight=ft.FontWeight.W_500, color=color or palette["text_muted"])
