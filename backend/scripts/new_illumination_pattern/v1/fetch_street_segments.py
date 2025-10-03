"""Utility script to snapshot the street_segments table from Supabase into a local JSON file."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import requests

from fetch_barangays import load_environment, get_supabase_credentials  # reuse helpers

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_PATH = BASE_DIR / "street_segments.json"


def fetch_street_segments(supabase_url: str, supabase_key: str) -> list[dict[str, Any]]:
    """Fetch all street segment rows via Supabase REST."""
    endpoint = f"{supabase_url}/rest/v1/street_segments?select=*"
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Accept": "application/json",
    }

    response = requests.get(endpoint, headers=headers, timeout=60)
    response.raise_for_status()

    payload = response.json()
    if not isinstance(payload, list):
        raise RuntimeError("Unexpected response payload when fetching street segments")
    return payload


def write_output(street_segments: list[dict[str, Any]]) -> None:
    OUTPUT_PATH.write_text(
        json.dumps(street_segments, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Saved {len(street_segments)} street segment rows to {OUTPUT_PATH}")


def main() -> None:
    load_environment()
    supabase_url, supabase_key = get_supabase_credentials()
    if not supabase_url or not supabase_key:
        return
    street_segments = fetch_street_segments(supabase_url, supabase_key)
    write_output(street_segments)


if __name__ == "__main__":
    main()
