"""Fetch streets data from Supabase and save to new_streets.json.

The script pulls the ``public.streets`` table (id, name, meters, geometry, road_category)
and writes the result to ``new_streets.json`` located beside this file.

Environment variables required:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY or SUPABASE_ANON_KEY
"""

import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional

from dotenv import load_dotenv
from supabase import create_client

# Load environment variables from .env if present
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    or os.environ.get("SUPABASE_KEY")
    or os.environ.get("SUPABASE_ANON_KEY")
)

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and a Supabase key must be set in the environment")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

PAGE_SIZE = 1000
OUTPUT_FILENAME = "new_streets.json"
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), OUTPUT_FILENAME)


def _parse_linestring_wkt(raw: str) -> Optional[Dict[str, Any]]:
    """Convert a LINESTRING WKT string to GeoJSON-like dict."""
    try:
        coords_part = raw[raw.index("(") + 1 : raw.rindex(")")]
    except ValueError:
        return None

    coordinates: List[List[float]] = []
    for part in coords_part.split(","):
        values = part.strip().split()
        if len(values) < 2:
            continue
        try:
            x = float(values[0])
            y = float(values[1])
        except ValueError:
            continue
        coordinates.append([x, y])

    if not coordinates:
        return None

    return {"type": "LineString", "coordinates": coordinates}


def _parse_multilinestring_wkt(raw: str) -> Optional[Dict[str, Any]]:
    """Convert a MULTILINESTRING WKT string to GeoJSON-like dict."""
    inner = raw[len("MULTILINESTRING") :].strip()
    if not inner.startswith("(") or not inner.endswith(")"):
        return None

    coordinates: List[List[List[float]]] = []
    depth = 0
    buffer = ""
    for char in inner:
        if char == "(":
            depth += 1
            if depth == 2:
                buffer = ""
        elif char == ")":
            if depth == 2:
                line_coords: List[List[float]] = []
                for part in buffer.split(","):
                    values = part.strip().split()
                    if len(values) < 2:
                        continue
                    try:
                        x = float(values[0])
                        y = float(values[1])
                    except ValueError:
                        continue
                    line_coords.append([x, y])
                if line_coords:
                    coordinates.append(line_coords)
                buffer = ""
            depth = max(depth - 1, 0)
        else:
            if depth >= 2:
                buffer += char

    if not coordinates:
        return None

    return {"type": "MultiLineString", "coordinates": coordinates}


def normalize_geometry(value: Any) -> Optional[Dict[str, Any]]:
    """Normalize geometry into a GeoJSON-like dictionary."""
    if value is None:
        return None

    if isinstance(value, dict):
        # Assume already GeoJSON-like
        if value.get("type") and value.get("coordinates") is not None:
            return value
        return None

    if isinstance(value, str):
        text = value.strip()
        if not text:
            return None

        if text.startswith("{") and text.endswith("}"):
            try:
                parsed = json.loads(text)
                if parsed.get("type") and parsed.get("coordinates") is not None:
                    return parsed
            except json.JSONDecodeError:
                return None

        upper = text.upper()
        if upper.startswith("LINESTRING"):
            return _parse_linestring_wkt(text)
        if upper.startswith("MULTILINESTRING"):
            return _parse_multilinestring_wkt(text)

    return None


@dataclass
class StreetRecord:
    id: int
    name: Optional[str]
    meters: Optional[float]
    geometry: Optional[Dict[str, Any]]
    road_category: Optional[str]

    @classmethod
    def from_raw(cls, raw: Dict[str, Any]) -> "StreetRecord":
        geometry = normalize_geometry(raw.get("geometry"))
        meters = raw.get("meters")
        try:
            meters_value = float(meters) if meters is not None else None
        except (TypeError, ValueError):
            meters_value = None

        return cls(
            id=raw.get("id"),
            name=(raw.get("name") or None),
            meters=meters_value,
            geometry=geometry,
            road_category=(raw.get("road_category") or None),
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "meters": self.meters,
            "road_category": self.road_category,
            "geometry": self.geometry,
        }


def fetch_all_streets() -> List[Dict[str, Any]]:
    """Fetch the entire streets table in a paginated fashion."""
    start = 0
    all_rows: List[Dict[str, Any]] = []

    while True:
        end = start + PAGE_SIZE - 1
        response = (
            supabase
            .table("streets")
            .select("id, name, meters, geometry, road_category")
            .range(start, end)
            .order("id", desc=False)
            .execute()
        )

        batch = response.data or []
        if not batch:
            break

        all_rows.extend(batch)

        if len(batch) < PAGE_SIZE:
            break

        start += PAGE_SIZE

    return all_rows


def build_output(records: Iterable[StreetRecord]) -> Dict[str, Any]:
    entries = [record.to_dict() for record in records]
    return {
        "streets": entries,
        "metadata": {
            "total_records": len(entries),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "columns": ["id", "name", "meters", "road_category", "geometry"],
        },
    }


def save_json(payload: Dict[str, Any], path: str) -> None:
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, ensure_ascii=False)


def main() -> None:
    print("🚚 Fetching streets data from Supabase...")

    raw_rows = fetch_all_streets()
    print(f"✅ Retrieved {len(raw_rows)} rows from streets table")

    records = [StreetRecord.from_raw(row) for row in raw_rows]
    payload = build_output(records)

    save_json(payload, OUTPUT_PATH)
    print(f"💾 Saved streets data to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
