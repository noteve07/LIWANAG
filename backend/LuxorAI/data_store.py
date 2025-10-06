"""Rule-based data layer for Luxor AI."""
from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

INTENT_KEYWORDS = {
    "illumination", "lux", "lighting", "street", "streets", "barangay", "barangays",
    "sensor", "sensors", "reading", "readings", "light", "lights", "coverage",
    "lamp", "lamps", "intensity", "brightness", "data", "details", "list", "show",
    "all", "available", "how many", "count", "number"
}

import pandas as pd
import numpy as np
def _to_native(value: Any) -> Any:
    """Convert pandas/numpy objects into plain Python types for JSON serialization."""
    if isinstance(value, pd.Timestamp):
        if pd.isna(value):  # type: ignore[arg-type]
            return None
        return value.to_pydatetime().isoformat()
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, np.generic):
        return value.item()
    if isinstance(value, (set, tuple)):
        return [_to_native(item) for item in value]
    if isinstance(value, list):
        return [_to_native(item) for item in value]
    return value

try:
    from shapely.geometry import shape  # type: ignore
except Exception:
    shape = None


def _extract_numbers(text: str) -> List[int]:
    return [int(v) for v in re.findall(r"\d+", text)]


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip()).lower()


def _limit(sequence: Iterable[Any], limit: int) -> List[Any]:
    if limit <= 0:
        return list(sequence)
    out: List[Any] = []
    for idx, item in enumerate(sequence):
        if idx >= limit:
            break
        out.append(item)
    return out


def _flatten_coords(geometry: Dict[str, Any]) -> Optional[Dict[str, float]]:
    if not geometry:
        return None
    coords = geometry.get("coordinates")
    if not coords:
        return None

    lats: List[float] = []
    lons: List[float] = []

    def _walk(node: Any) -> None:
        if isinstance(node, (list, tuple)):
            if node and isinstance(node[0], (float, int)) and len(node) >= 2:
                lon, lat = node[0], node[1]
                lons.append(float(lon))
                lats.append(float(lat))
            else:
                for child in node:
                    _walk(child)

    _walk(coords)
    if not lats or not lons:
        return None

    return {
        "lat_min": min(lats),
        "lat_max": max(lats),
        "lon_min": min(lons),
        "lon_max": max(lons),
    }


def _geometry_area(geometry: Dict[str, Any]) -> Optional[float]:
    if geometry and shape is not None:
        try:
            return float(shape(geometry).area)
        except Exception:
            return None
    return None


class LuxorDataStore:
    """Loads the Luxor datasets and supports rule-based lookups."""

    def __init__(
        self,
        data_dir: Optional[Path | str] = None,
        sample_size: Optional[int] = None,
    ) -> None:
        base_dir = Path(data_dir) if data_dir else Path(__file__).resolve().parent / "data"
        if not base_dir.exists():
            raise FileNotFoundError(f"Data directory not found: {base_dir}")
        self.data_dir = base_dir
        self.sample_size = sample_size if sample_size is not None else 0

        # Load data with better error handling
        self.illumination_df = self._load_illumination()
        self.barangay_df = self._load_barangays()
        self.street_df = self._load_streets()

        print(f"Loaded {len(self.barangay_df)} barangays, {len(self.street_df)} streets, {len(self.illumination_df)} illumination records")

    def _load_illumination(self) -> pd.DataFrame:
        """Load illumination data with robust error handling."""
        path = self.data_dir / "illumination_data.json"
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if not isinstance(data, list):
                print(f"Warning: illumination_data.json should be a list, got {type(data)}")
                return pd.DataFrame()
            
            limited_data = _limit(data, self.sample_size) if self.sample_size else data
            df = pd.DataFrame(limited_data)
            
            # Basic column processing
            if not df.empty:
                if "created_at" in df.columns:
                    df["created_at"] = pd.to_datetime(df["created_at"], errors="coerce")
                if "lux" in df.columns:
                    df["lux"] = pd.to_numeric(df["lux"], errors="coerce")
            
            return df
            
        except Exception as e:
            print(f"Error loading illumination data: {e}")
            return pd.DataFrame()

    def _load_barangays(self) -> pd.DataFrame:
        """Load barangay data with simplified structure."""
        path = self.data_dir / "barangay.json"
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if not isinstance(data, list):
                print(f"Warning: barangay.json should be a list, got {type(data)}")
                return pd.DataFrame()

            records: List[Dict[str, Any]] = []
            for raw in _limit(data, self.sample_size) if self.sample_size else data:
                # Simplified - don't require geometry
                records.append({
                    "id": raw.get("id"),
                    "name": raw.get("name"),
                    "name_normalized": _normalize(raw.get("name", "")),
                    "raw": raw,  # Keep original data
                })
                
            return pd.DataFrame(records)
            
        except Exception as e:
            print(f"Error loading barangay data: {e}")
            return pd.DataFrame()

    def _load_streets(self) -> pd.DataFrame:
        """Load street data supporting both simple JSON and GeoJSON."""
        path = self.data_dir / "streets_segment.json"
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            records: List[Dict[str, Any]] = []

            # Handle both GeoJSON FeatureCollection and simple list
            if isinstance(data, dict) and "features" in data:
                # GeoJSON format
                features = data.get("features", [])
                for feature in _limit(features, self.sample_size) if self.sample_size else features:
                    props = feature.get("properties", {})
                    records.append({
                        "id": props.get("id"),
                        "name": props.get("name") or props.get("street_name") or str(props.get("id")),
                        "name_normalized": _normalize(str(props.get("name") or props.get("street_name") or "")),
                        "road_category": props.get("road_category"),
                        "raw": feature,
                    })
            elif isinstance(data, list):
                # Simple list format
                for item in _limit(data, self.sample_size) if self.sample_size else data:
                    records.append({
                        "id": item.get("id"),
                        "name": item.get("name") or item.get("street_name") or str(item.get("id")),
                        "name_normalized": _normalize(str(item.get("name") or item.get("street_name") or "")),
                        "road_category": item.get("road_category"),
                        "raw": item,
                    })
            else:
                print(f"Warning: Unsupported streets_segment.json format: {type(data)}")
                return pd.DataFrame()
                
            return pd.DataFrame(records)
            
        except Exception as e:
            print(f"Error loading street data: {e}")
            return pd.DataFrame()

    def search(self, question: str, limit: int = 5) -> Dict[str, List[Dict[str, Any]]]:
        """Return relevant rows with more lenient matching."""
        question_norm = _normalize(question)
        
        # Always return barangays and streets for list queries
        is_list_query = any(keyword in question_norm for keyword in ["list", "all", "show", "available", "how many", "count"])
        
        if is_list_query:
            # For list queries, return all available data
            return {
                "illumination": self._get_all_illumination(limit),
                "barangays": self._get_all_barangays(limit),
                "streets": self._get_all_streets(limit),
            }
        
        # For other queries, use the existing logic
        matched_numbers = set(_extract_numbers(question))
        barangay_ids = self._match_by_name(self.barangay_df, question_norm)
        street_ids = self._match_by_name(self.street_df, question_norm)

        keyword_hit = any(keyword in question_norm for keyword in INTENT_KEYWORDS)
        has_intent = bool(barangay_ids or street_ids or matched_numbers or keyword_hit)

        if not has_intent:
            return {"illumination": [], "barangays": [], "streets": []}

        illum_records = self._search_illumination(barangay_ids, street_ids, matched_numbers, set(), limit)
        barangay_records = self._select_records(self.barangay_df, barangay_ids, limit)
        street_records = self._select_records(self.street_df, street_ids, limit)

        return {
            "illumination": illum_records,
            "barangays": barangay_records,
            "streets": street_records,
        }

    def _get_all_barangays(self, limit: int) -> List[Dict[str, Any]]:
        """Get all barangays for list queries."""
        if self.barangay_df.empty:
            return []
        records = []
        for row in self.barangay_df.head(limit).itertuples():
            records.append({
                "id": _to_native(getattr(row, "id", None)),
                "name": _to_native(getattr(row, "name", None)),
            })
        return records

    def _get_all_streets(self, limit: int) -> List[Dict[str, Any]]:
        """Get all streets for list queries."""
        if self.street_df.empty:
            return []
        records = []
        for row in self.street_df.head(limit).itertuples():
            records.append({
                "id": _to_native(getattr(row, "id", None)),
                "name": _to_native(getattr(row, "name", None)),
                "road_category": _to_native(getattr(row, "road_category", None)),
            })
        return records

    def _get_all_illumination(self, limit: int) -> List[Dict[str, Any]]:
        """Get sample illumination data for list queries."""
        if self.illumination_df.empty:
            return []
        records = []
        for row in self.illumination_df.head(limit).itertuples():
            records.append({
                "id": _to_native(getattr(row, "id", None)),
                "lux": _to_native(getattr(row, "lux", None)),
                "street_id": _to_native(getattr(row, "street_id", None)),
                "barangay_id": _to_native(getattr(row, "barangay_id", None)),
                "sensor": _to_native(getattr(row, "sensor", None)),
            })
        return records

    def _match_by_name(self, df: pd.DataFrame, question_norm: str) -> List[int]:
        if df.empty or "name_normalized" not in df.columns:
            return []
        hits: List[int] = []
        for row in df.itertuples():
            try:
                name_norm = getattr(row, "name_normalized", "")
                row_id = int(getattr(row, "id", 0))
                if name_norm and name_norm in question_norm:
                    hits.append(row_id)
            except (AttributeError, ValueError):
                continue
        return hits

    def _search_illumination(
        self,
        barangay_ids: List[int],
        street_ids: List[int],
        matched_numbers: set[int],
        sensor_hits: set[str],
        limit: int,
    ) -> List[Dict[str, Any]]:
        if self.illumination_df.empty:
            return []

        df = self.illumination_df.copy()

        # Apply filters
        filters = []
        if barangay_ids and "barangay_id" in df.columns:
            filters.append(df["barangay_id"].isin(barangay_ids))
        if street_ids and "street_id" in df.columns:
            filters.append(df["street_id"].isin(street_ids))
        if matched_numbers:
            number_filters = []
            if "id" in df.columns:
                number_filters.append(df["id"].isin(matched_numbers))
            if "street_id" in df.columns:
                number_filters.append(df["street_id"].isin(matched_numbers))
            if "barangay_id" in df.columns:
                number_filters.append(df["barangay_id"].isin(matched_numbers))
            if number_filters:
                filters.append(pd.concat(number_filters, axis=1).any(axis=1))
        if sensor_hits and "sensor" in df.columns:
            filters.append(df["sensor"].str.lower().isin(sensor_hits))

        if filters:
            combined_filter = pd.concat(filters, axis=1).all(axis=1)
            df = df[combined_filter]

        if df.empty:
            # Fallback: return some data
            df = self.illumination_df.head(limit)

        # Sort and limit
        if "lux" in df.columns:
            df = df.sort_values(by="lux", ascending=False)
        df = df.head(limit)

        # Convert to records
        records = []
        for row in df.itertuples():
            records.append({
                "id": _to_native(getattr(row, "id", None)),
                "lux": _to_native(getattr(row, "lux", None)),
                "street_id": _to_native(getattr(row, "street_id", None)),
                "barangay_id": _to_native(getattr(row, "barangay_id", None)),
                "sensor": _to_native(getattr(row, "sensor", None)),
                "created_at": _to_native(getattr(row, "created_at", None)),
            })
        return records

    def _select_records(self, df: pd.DataFrame, ids: List[int], limit: int) -> List[Dict[str, Any]]:
        if df.empty:
            return []
        
        if ids:
            result_df = df[df["id"].isin(ids)]
        else:
            result_df = df
            
        result_df = result_df.head(limit)
        records = []
        for row in result_df.itertuples():
            records.append({
                "id": _to_native(getattr(row, "id", None)),
                "name": _to_native(getattr(row, "name", None)),
                "road_category": _to_native(getattr(row, "road_category", None)) if hasattr(row, "road_category") else None,
            })
        return records