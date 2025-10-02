from __future__ import annotations

import math
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from shapely.geometry import Point, shape
from shapely.geometry.base import BaseGeometry

from app.core.database import supabase

# Simple in-memory cache to reduce Supabase round-trips
_CACHE_TTL = timedelta(minutes=5)
_barangay_cache: Dict[str, Any] = {"data": None, "expires_at": None}
_street_cache: Dict[str, Any] = {"data": None, "expires_at": None}


def _fetch_all_rows(table: str, columns: str, chunk_size: int = 1000) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    start = 0

    while True:
        end = start + chunk_size - 1
        response = supabase.table(table).select(columns).range(start, end).execute()
        batch = response.data or []
        rows.extend(batch)

        if len(batch) < chunk_size:
            break

        start += chunk_size

    return rows


def _geom_from_record(record: Dict[str, Any], field: str) -> Optional[BaseGeometry]:
    geometry_payload = record.get(field)
    if not geometry_payload:
        return None

    try:
        return shape(geometry_payload)
    except Exception:
        return None


def _get_cached_rows(cache: Dict[str, Any], loader) -> List[Dict[str, Any]]:
    now = datetime.utcnow()
    cached = cache.get("data")
    expires_at: Optional[datetime] = cache.get("expires_at")

    if cached is not None and expires_at and expires_at > now:
        return cached

    fresh = loader()
    cache["data"] = fresh
    cache["expires_at"] = now + _CACHE_TTL
    return fresh


def get_barangays() -> List[Dict[str, Any]]:
    return _get_cached_rows(
        _barangay_cache,
        lambda: _fetch_all_rows("barangays", "id, name, boundary"),
    )


def get_streets() -> List[Dict[str, Any]]:
    return _get_cached_rows(
        _street_cache,
        lambda: _fetch_all_rows("streets", "id, name, geometry, road_category"),
    )


def determine_barangay(point: Point) -> Optional[Dict[str, Any]]:
    for record in get_barangays():
        geometry = _geom_from_record(record, "boundary")
        if geometry is None:
            continue

        if geometry.contains(point) or geometry.buffer(1e-9).contains(point):
            return record

    return None


def determine_nearest_street(point: Point) -> Optional[Tuple[Dict[str, Any], float]]:
    nearest: Optional[Tuple[Dict[str, Any], float]] = None

    for record in get_streets():
        geometry = _geom_from_record(record, "geometry")
        if geometry is None:
            continue

        distance = point.distance(geometry)

        if nearest is None or distance < nearest[1]:
            nearest = (record, distance)

    return nearest


def degrees_to_meters(distance_degrees: float, latitude: float) -> float:
    earth_radius = 6_371_000
    lat_rad = math.radians(latitude)
    metres_per_degree_lat = (math.pi * earth_radius) / 180
    metres_per_degree_lon = metres_per_degree_lat * math.cos(lat_rad)
    return distance_degrees * max(metres_per_degree_lat, metres_per_degree_lon)


def classify_lux(road_category: Optional[str], lux: float) -> str:
    category = (road_category or "residential").strip().lower()

    if category == "highway":
        thresholds: List[Tuple[float, str]] = [
            (30, "low"),
            (50, "moderate"),
            (100, "standard"),
        ]
    elif category == "main_road":
        thresholds = [(15, "low"), (30, "moderate"), (50, "standard")]
    else:
        thresholds = [(10, "low"), (20, "moderate"), (30, "standard")]

    for limit, label in thresholds:
        if lux <= limit:
            return label

    return "overlit"
