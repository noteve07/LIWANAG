"""Utility script to snapshot the barangays table from Supabase into a local JSON file."""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_PATH = BASE_DIR / "barangays.json"


def load_environment() -> None:
    """Load environment variables from a nearby .env or the system."""
    load_dotenv()


def get_supabase_credentials() -> tuple[str | None, str | None]:
    """Retrieve Supabase REST credentials from the environment, if available."""
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = (
        os.environ.get("SUPABASE_KEY")
        or os.environ.get("SUPABASE_ANON_KEY")
        or os.environ.get("SUPABASE_API_KEY")
    )

    if not supabase_url or not supabase_key:
        print(
            "⚠️  Missing Supabase configuration. Set SUPABASE_URL and either "
            "SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY before running this script."
        )
        return None, None

    return supabase_url.rstrip("/"), supabase_key


def fetch_barangays(supabase_url: str, supabase_key: str) -> list[dict[str, Any]]:
    """Fetch all barangay rows via Supabase REST."""
    endpoint = f"{supabase_url}/rest/v1/barangays?select=*"
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Accept": "application/json",
    }

    response = requests.get(endpoint, headers=headers, timeout=30)
    try:
        response.raise_for_status()
    except requests.HTTPError as exc:  # pragma: no cover - propagated for clarity
        detail = exc.response.text if exc.response else ""
        raise RuntimeError(
            f"Supabase request failed: {exc.response.status_code if exc.response else 'unknown'} {detail}"
        ) from exc

    payload = response.json()
    if not isinstance(payload, list):
        raise RuntimeError("Unexpected response payload when fetching barangays")
    return payload


def write_output(barangays: list[dict[str, Any]]) -> None:
    OUTPUT_PATH.write_text(json.dumps(barangays, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Saved {len(barangays)} barangay rows to {OUTPUT_PATH}")


def main() -> None:
    load_environment()
    supabase_url, supabase_key = get_supabase_credentials()
    if not supabase_url or not supabase_key:
        return

    barangays = fetch_barangays(supabase_url, supabase_key)
    write_output(barangays)


if __name__ == "__main__":
    main()
