from __future__ import annotations

import re
import json
import shutil
import sys
from pathlib import Path

import gspread
from google.auth.exceptions import RefreshError
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow

from .storage import ROOT_DIR, TOKEN_PATH


SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
]


class AuthError(RuntimeError):
    pass


def credentials_path() -> Path:
    return ROOT_DIR / "credentials.json"


def bundled_credentials_path() -> Path:
    base_dir = Path(getattr(sys, "_MEIPASS", ROOT_DIR))
    return base_dir / "assets" / "oauth_client.json"


def active_credentials_path() -> Path:
    external = credentials_path()
    if external.exists():
        return external
    return bundled_credentials_path()


def validate_client_config(data: dict) -> None:
    client = data.get("installed") or data.get("web")
    if not isinstance(client, dict):
        raise AuthError("Paste or choose a Google OAuth client JSON file, not an API key.")
    required = ["client_id", "client_secret", "auth_uri", "token_uri"]
    missing = [key for key in required if not client.get(key)]
    if missing:
        raise AuthError(f"OAuth client JSON is missing: {', '.join(missing)}")


def credentials_configured() -> bool:
    path = active_credentials_path()
    if not path.exists():
        return False
    try:
        validate_client_config(json.loads(path.read_text(encoding="utf-8")))
        return True
    except (OSError, json.JSONDecodeError, AuthError):
        return False


def save_credentials_file(source_path: str) -> None:
    source = Path(source_path)
    if not source.exists():
        raise AuthError("Selected credentials file was not found.")
    try:
        data = json.loads(source.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise AuthError("Selected file is not valid JSON.") from exc
    validate_client_config(data)
    shutil.copyfile(source, credentials_path())


def save_credentials_json(raw_json: str) -> None:
    if not raw_json.strip():
        raise AuthError("Paste the OAuth client JSON from Google Cloud.")
    try:
        data = json.loads(raw_json)
    except json.JSONDecodeError as exc:
        raise AuthError("Pasted credentials are not valid JSON.") from exc
    validate_client_config(data)
    credentials_path().write_text(json.dumps(data, indent=2), encoding="utf-8")


def sheet_id_from_url(url: str) -> str:
    if not url:
        return ""
    match = re.search(r"/spreadsheets/d/([a-zA-Z0-9-_]+)", url)
    if match:
        return match.group(1)
    if re.fullmatch(r"[a-zA-Z0-9-_]{20,}", url.strip()):
        return url.strip()
    return ""


def load_credentials() -> Credentials | None:
    if TOKEN_PATH.exists():
        return Credentials.from_authorized_user_file(str(TOKEN_PATH), SCOPES)
    return None


def save_credentials(creds: Credentials) -> None:
    TOKEN_PATH.write_text(creds.to_json(), encoding="utf-8")


def get_credentials(interactive: bool = False) -> Credentials:
    creds = load_credentials()
    if creds and creds.valid:
        return creds
    if creds and creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            save_credentials(creds)
            return creds
        except RefreshError as exc:
            if not interactive:
                raise AuthError("Google session expired. Reconnect your account.") from exc
    if not interactive:
        raise AuthError("Google account is not connected.")
    path = active_credentials_path()
    if not path.exists():
        raise AuthError("Google OAuth client is missing.")
    flow = InstalledAppFlow.from_client_secrets_file(str(path), SCOPES)
    creds = flow.run_local_server(port=0, prompt="consent")
    save_credentials(creds)
    return creds


def get_client(interactive: bool = False) -> gspread.Client:
    return gspread.authorize(get_credentials(interactive=interactive))


def connect_google() -> tuple[str, gspread.Client]:
    client = get_client(interactive=True)
    email = ""
    try:
        about = client.http_client.request("get", "https://www.googleapis.com/drive/v3/about?fields=user")
        email = about.json().get("user", {}).get("emailAddress", "")
    except Exception:
        email = "connected-account"
    return email, client


def fetch_sheet_metadata(sheet_url: str) -> dict[str, object]:
    sheet_id = sheet_id_from_url(sheet_url)
    if not sheet_id:
        raise AuthError("Enter a valid Google Sheet URL.")
    client = get_client(interactive=False)
    spreadsheet = client.open_by_key(sheet_id)
    return {
        "sheet_id": sheet_id,
        "title": spreadsheet.title,
        "worksheets": [ws.title for ws in spreadsheet.worksheets()],
    }


def disconnect() -> None:
    TOKEN_PATH.unlink(missing_ok=True)
