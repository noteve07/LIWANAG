import json
import math
import os
import random
from collections import Counter, defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, Iterable, List, Optional, Set, Tuple

# Type aliases for readability
LatLon = Tuple[float, float]
Polyline = List[LatLon]
Polylines = List[Polyline]
PolygonRings = List[Polyline]
Multipolygon = List[PolygonRings]

# --- Configuration constants -------------------------------------------------

POINT_SPACING_METERS = 12  # spacing between generated points along a street
NEIGHBOR_DISTANCE_METERS = 18  # threshold for considering streets as neighbors
ENDPOINT_JOIN_THRESHOLD_METERS = 6  # maximum distance to treat endpoints as touching
INTERSECTION_TOLERANCE_METERS = 6  # tolerance for segment intersection in meters
SEGMENT_ASSIGNMENT_THRESHOLD_METERS = 40  # max distance to attach a point to a segment
RESIDENTIAL_SURVEY_PROBABILITY = 0.65  # chance a connected residential street is surveyed
RESIDENTIAL_UNSURVEYED_PROBABILITY = 0.25  # chance a residential street has no coverage at all

FULLY_SURVEYED_CATEGORIES = {"main_road", "highway"}
CATEGORY_ALIASES = {
    "main road": "main_road",
    "primary": "main_road",
    "primary road": "main_road",
    "primary_road": "main_road",
    "secondary": "main_road",
    "secondary road": "main_road",
    "motorway": "highway",
    "trunk": "highway",
    "trunk road": "highway",
    "res": "residential",
    "residential": "residential",
}
DEFAULT_CATEGORY = "residential"

# --- Lux model setup ----------------------------------------------------------

CATEGORY_LUX_BANDS = {
    "residential": {
        "critical": (0, 5),
        "low": (5, 10),
        "moderate": (10, 20),
        "standard": (20, 40),
    },
    "main_road": {
        "critical": (0, 10),
        "low": (10, 20),
        "moderate": (20, 30),
        "standard": (30, 50),
    },
    "highway": {
        "critical": (0, 15),
        "low": (15, 30),
        "moderate": (30, 50),
        "standard": (50, 100),
    },
}

CATEGORY_ZONE_WEIGHTS = {
    "residential": [
        {"standard": 0.35, "moderate": 0.35, "low": 0.2, "critical": 0.1},
        {"moderate": 0.4, "standard": 0.3, "low": 0.25, "critical": 0.05},
        {"standard": 0.45, "moderate": 0.35, "low": 0.15, "critical": 0.05},
        {"moderate": 0.4, "standard": 0.3, "low": 0.2, "critical": 0.1},
    ],
    "main_road": [
        {"standard": 0.45, "moderate": 0.35, "low": 0.15, "critical": 0.05},
        {"standard": 0.5, "moderate": 0.35, "low": 0.1, "critical": 0.05},
        {"standard": 0.55, "moderate": 0.3, "low": 0.1, "critical": 0.05},
        {"moderate": 0.4, "standard": 0.4, "low": 0.15, "critical": 0.05},
    ],
    "highway": [
        {"standard": 0.5, "moderate": 0.3, "low": 0.15, "critical": 0.05},
        {"standard": 0.55, "moderate": 0.3, "low": 0.1, "critical": 0.05},
        {"standard": 0.6, "moderate": 0.25, "low": 0.1, "critical": 0.05},
        {"moderate": 0.45, "standard": 0.4, "low": 0.1, "critical": 0.05},
    ],
}

# --- Utility functions --------------------------------------------------------

def normalize_category(value: Optional[str]) -> str:
    if not value:
        return DEFAULT_CATEGORY
    key = value.strip().lower()
    return CATEGORY_ALIASES.get(key, key)


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two WGS84 coordinates in meters."""
    R = 6371000.0
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def interpolate_point(lat1: float, lon1: float, lat2: float, lon2: float, fraction: float) -> LatLon:
    lat = lat1 + (lat2 - lat1) * fraction
    lon = lon1 + (lon2 - lon1) * fraction
    return lat, lon


def pick_band_for_zone(category_key: str, zone_index: int) -> str:
    zone_weights = CATEGORY_ZONE_WEIGHTS.get(category_key) or CATEGORY_ZONE_WEIGHTS["residential"]
    weights = zone_weights[min(zone_index, len(zone_weights) - 1)]
    bands, probs = zip(*weights.items())
    return random.choices(bands, probs)[0]


def clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def generate_realistic_lux_pattern(street_length: float, point_index: int, total_points: int, road_category: str) -> float:
    category_key = normalize_category(road_category)
    bands = CATEGORY_LUX_BANDS.get(category_key, CATEGORY_LUX_BANDS["residential"])
    total_points = max(total_points, 1)
    progress = point_index / total_points
    zone_index = min(3, int(progress * 4))
    band_name = pick_band_for_zone(category_key, zone_index)
    band_min, band_max = bands[band_name]
    base_value = random.uniform(band_min, band_max)
    lux = base_value * random.uniform(0.9, 1.1)
    if zone_index == 0:
        lux *= random.uniform(1.0, 1.05)
    elif zone_index == 3:
        lux *= random.uniform(0.95, 1.02)
    lux = clamp(lux, band_min, band_max)
    return round(max(0, lux), 2)


def meters_per_degree_lat(lat: float) -> float:
    lat_rad = math.radians(lat)
    return 111132.92 - 559.82 * math.cos(2 * lat_rad) + 1.175 * math.cos(4 * lat_rad)


def meters_per_degree_lon(lat: float) -> float:
    lat_rad = math.radians(lat)
    return 111412.84 * math.cos(lat_rad) - 93.5 * math.cos(3 * lat_rad)


def point_segment_distance(lat: float, lon: float, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    if lat1 == lat2 and lon1 == lon2:
        return calculate_distance(lat, lon, lat1, lon1)
    lat_ref = (lat + lat1 + lat2) / 3.0
    m_lat = meters_per_degree_lat(lat_ref)
    m_lon = meters_per_degree_lon(lat_ref)
    x0 = (lon - lon1) * m_lon
    y0 = (lat - lat1) * m_lat
    x1 = 0.0
    y1 = 0.0
    x2 = (lon2 - lon1) * m_lon
    y2 = (lat2 - lat1) * m_lat
    seg_len_sq = x2 * x2 + y2 * y2
    if seg_len_sq == 0:
        return math.hypot(x0, y0)
    t = max(0.0, min(1.0, ((x0 - x1) * (x2 - x1) + (y0 - y1) * (y2 - y1)) / seg_len_sq))
    proj_x = x1 + t * (x2 - x1)
    proj_y = y1 + t * (y2 - y1)
    return math.hypot(x0 - proj_x, y0 - proj_y)


def distance_point_to_polyline(lat: float, lon: float, polylines: Polylines) -> float:
    best = float("inf")
    for line in polylines:
        if len(line) < 2:
            continue
        for idx in range(len(line) - 1):
            lat1, lon1 = line[idx]
            lat2, lon2 = line[idx + 1]
            dist = point_segment_distance(lat, lon, lat1, lon1, lat2, lon2)
            if dist < best:
                best = dist
    return best


def geometry_to_polylines(geometry: Optional[Dict[str, Any]]) -> Polylines:
    if not geometry:
        return []
    geom_type = geometry.get("type")
    coordinates = geometry.get("coordinates") or []
    if geom_type == "LineString":
        return [
            [(coord[1], coord[0]) for coord in coordinates if isinstance(coord, (list, tuple)) and len(coord) >= 2]
        ]
    if geom_type == "MultiLineString":
        polylines: Polylines = []
        for line in coordinates:
            polylines.append(
                [(coord[1], coord[0]) for coord in line if isinstance(coord, (list, tuple)) and len(coord) >= 2]
            )
        return polylines
    return []


def geometry_to_multipolygon(geometry: Optional[Dict[str, Any]]) -> List[Multipolygon]:
    if not geometry:
        return []
    geom_type = geometry.get("type")
    coordinates = geometry.get("coordinates") or []
    polygons: List[Multipolygon] = []
    if geom_type == "Polygon":
        rings: Multipolygon = []
        for ring in coordinates:
            rings.append([(coord[1], coord[0]) for coord in ring])
        polygons.append(rings)
    elif geom_type == "MultiPolygon":
        for polygon in coordinates:
            rings: Multipolygon = []
            for ring in polygon:
                rings.append([(coord[1], coord[0]) for coord in ring])
            polygons.append(rings)
    return polygons


def total_length(polylines: Polylines) -> float:
    distance_sum = 0.0
    for line in polylines:
        for idx in range(len(line) - 1):
            distance_sum += calculate_distance(*line[idx], *line[idx + 1])
    return distance_sum

def latlon_to_xy(lat: float, lon: float, ref_lat: float, ref_lon: float) -> Tuple[float, float]:
    m_lat = meters_per_degree_lat(ref_lat)
    m_lon = meters_per_degree_lon(ref_lat)
    x = (lon - ref_lon) * m_lon
    y = (lat - ref_lat) * m_lat
    return x, y


def orientation(p: Tuple[float, float], q: Tuple[float, float], r: Tuple[float, float]) -> int:
    val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1])
    if abs(val) < 1e-6:
        return 0
    return 1 if val > 0 else 2


def on_segment(p: Tuple[float, float], q: Tuple[float, float], r: Tuple[float, float]) -> bool:
    return (
        min(p[0], r[0]) - 1e-6 <= q[0] <= max(p[0], r[0]) + 1e-6
        and min(p[1], r[1]) - 1e-6 <= q[1] <= max(p[1], r[1]) + 1e-6
    )


def segments_intersect(p1: LatLon, p2: LatLon, p3: LatLon, p4: LatLon) -> bool:
    ref_lat = (p1[0] + p2[0] + p3[0] + p4[0]) / 4.0
    ref_lon = (p1[1] + p2[1] + p3[1] + p4[1]) / 4.0
    a1 = latlon_to_xy(*p1, ref_lat, ref_lon)
    a2 = latlon_to_xy(*p2, ref_lat, ref_lon)
    b1 = latlon_to_xy(*p3, ref_lat, ref_lon)
    b2 = latlon_to_xy(*p4, ref_lat, ref_lon)

    o1 = orientation(a1, a2, b1)
    o2 = orientation(a1, a2, b2)
    o3 = orientation(b1, b2, a1)
    o4 = orientation(b1, b2, a2)

    if o1 != o2 and o3 != o4:
        return True

    if o1 == 0 and on_segment(a1, b1, a2):
        return True
    if o2 == 0 and on_segment(a1, b2, a2):
        return True
    if o3 == 0 and on_segment(b1, a1, b2):
        return True
    if o4 == 0 and on_segment(b1, a2, b2):
        return True

    return False


def endpoints_touch(p1: LatLon, p2: LatLon, p3: LatLon, p4: LatLon) -> bool:
    return (
        calculate_distance(*p1, *p3) <= ENDPOINT_JOIN_THRESHOLD_METERS
        or calculate_distance(*p1, *p4) <= ENDPOINT_JOIN_THRESHOLD_METERS
        or calculate_distance(*p2, *p3) <= ENDPOINT_JOIN_THRESHOLD_METERS
        or calculate_distance(*p2, *p4) <= ENDPOINT_JOIN_THRESHOLD_METERS
    )


def segments_connect(segment_a: Tuple[LatLon, LatLon], segment_b: Tuple[LatLon, LatLon]) -> bool:
    a1, a2 = segment_a
    b1, b2 = segment_b
    if segments_intersect(a1, a2, b1, b2):
        return True
    if endpoints_touch(a1, a2, b1, b2):
        return True
    return False


def bounding_boxes_close(
    bbox_a: Tuple[float, float, float, float],
    bbox_b: Tuple[float, float, float, float],
    margin_meters: float = NEIGHBOR_DISTANCE_METERS,
) -> bool:
    if not bbox_a or not bbox_b:
        return False
    min_lat_a, min_lon_a, max_lat_a, max_lon_a = bbox_a
    min_lat_b, min_lon_b, max_lat_b, max_lon_b = bbox_b

    center_lat = (max_lat_a + min_lat_a + max_lat_b + min_lat_b) / 4.0
    lat_margin = margin_meters / meters_per_degree_lat(center_lat)
    lon_margin = margin_meters / meters_per_degree_lon(center_lat)

    expanded_a = (
        min_lat_a - lat_margin,
        min_lon_a - lon_margin,
        max_lat_a + lat_margin,
        max_lon_a + lon_margin,
    )
    expanded_b = (
        min_lat_b - lat_margin,
        min_lon_b - lon_margin,
        max_lat_b + lat_margin,
        max_lon_b + lon_margin,
    )

    if expanded_a[2] < expanded_b[0] or expanded_b[2] < expanded_a[0]:
        return False
    if expanded_a[3] < expanded_b[1] or expanded_b[3] < expanded_a[1]:
        return False
    return True


# --- Data classes -------------------------------------------------------------


@dataclass
class Street:
    id: int
    name: str
    road_category: str
    polylines: Polylines
    length_m: float
    bbox: Tuple[float, float, float, float]
    segments: List[Tuple[LatLon, LatLon]] = field(default_factory=list)
    vertices: List[LatLon] = field(default_factory=list)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Street":
        polylines = geometry_to_polylines(data.get("geometry"))
        category = normalize_category(data.get("road_category"))
        length_m = total_length(polylines)
        name = data.get("name") or f"Street {data.get('id')}"
        street_id = int(data.get("id"))
        segments: List[Tuple[LatLon, LatLon]] = []
        vertices: List[LatLon] = []
        for line in polylines:
            vertices.extend(line)
            for idx in range(len(line) - 1):
                segments.append((line[idx], line[idx + 1]))
        if vertices:
            lat_values = [pt[0] for pt in vertices]
            lon_values = [pt[1] for pt in vertices]
            bbox = (min(lat_values), min(lon_values), max(lat_values), max(lon_values))
        else:
            bbox = (0.0, 0.0, 0.0, 0.0)
        return cls(
            id=street_id,
            name=name,
            road_category=category,
            polylines=polylines,
            length_m=length_m,
            bbox=bbox,
            segments=segments,
            vertices=vertices,
        )


@dataclass
class StreetSegment:
    id: int
    street_id: Optional[int]
    barangay_id: Optional[int]
    road_category: str
    polylines: Polylines
    length_m: float

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "StreetSegment":
        polylines = geometry_to_polylines(data.get("segment_geom") or data.get("geometry"))
        length_m = total_length(polylines)
        street_id = data.get("original_street_id") or data.get("street_id")
        try:
            street_id_int = int(street_id) if street_id is not None else None
        except (TypeError, ValueError):
            street_id_int = None
        return cls(
            id=int(data.get("id")),
            street_id=street_id_int,
            barangay_id=data.get("barangay_id"),
            road_category=normalize_category(data.get("road_category")),
            polylines=polylines,
            length_m=length_m,
        )


@dataclass
class Barangay:
    id: int
    name: str
    polygons: List[Multipolygon]
    bbox: Tuple[float, float, float, float]

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Barangay":
        geometry = data.get("boundary") or data.get("geometry")
        polygons = geometry_to_multipolygon(geometry)
        lat_values = []
        lon_values = []
        for polygon in polygons:
            for ring in polygon:
                for lat, lon in ring:
                    lat_values.append(lat)
                    lon_values.append(lon)
        if lat_values and lon_values:
            bbox = (min(lat_values), min(lon_values), max(lat_values), max(lon_values))
        else:
            bbox = (0.0, 0.0, 0.0, 0.0)
        return cls(
            id=int(data.get("id")),
            name=data.get("name") or f"Barangay {data.get('id')}",
            polygons=polygons,
            bbox=bbox,
        )


@dataclass
class SurveyPlan:
    surveyed_residential: Set[int]
    unsurveyed_residential: Set[int]
    connected_residential: Set[int]
    disconnected_residential: Set[int]


# --- Spatial helper functions -------------------------------------------------


def build_street_adjacency(streets: List[Street]) -> Dict[int, Set[int]]:
    adjacency: Dict[int, Set[int]] = {street.id: set() for street in streets}
    total = len(streets)
    for idx in range(total):
        street_a = streets[idx]
        if not street_a.segments:
            continue
        for jdx in range(idx + 1, total):
            street_b = streets[jdx]
            if not street_b.segments:
                continue
            if not bounding_boxes_close(street_a.bbox, street_b.bbox):
                continue
            connected = False
            for segment_a in street_a.segments:
                for segment_b in street_b.segments:
                    if segments_connect(segment_a, segment_b):
                        connected = True
                        break
                if connected:
                    break
            if connected:
                adjacency[street_a.id].add(street_b.id)
                adjacency[street_b.id].add(street_a.id)
    return adjacency


# --- Barangay membership ------------------------------------------------------


def point_in_ring(lon: float, lat: float, ring: Polyline) -> bool:
    inside = False
    if not ring:
        return False
    num = len(ring)
    for idx in range(num):
        lon1, lat1 = ring[idx][1], ring[idx][0]
        lon2, lat2 = ring[(idx + 1) % num][1], ring[(idx + 1) % num][0]
        if ((lat1 > lat) != (lat2 > lat)):
            intersect = (lon2 - lon1) * (lat - lat1) / (lat2 - lat1 + 1e-12) + lon1
            if intersect > lon:
                inside = not inside
    return inside


def point_in_polygon(lon: float, lat: float, polygon: Multipolygon) -> bool:
    if not polygon:
        return False
    outer = polygon[0]
    if not point_in_ring(lon, lat, outer):
        return False
    for hole in polygon[1:]:
        if point_in_ring(lon, lat, hole):
            return False
    return True


def find_barangay_id(lat: float, lon: float, barangays: List[Barangay]) -> Optional[int]:
    for barangay in barangays:
        min_lat, min_lon, max_lat, max_lon = barangay.bbox
        if not (min_lat - 1e-6 <= lat <= max_lat + 1e-6 and min_lon - 1e-6 <= lon <= max_lon + 1e-6):
            continue
        for polygon in barangay.polygons:
            if point_in_polygon(lon, lat, polygon):
                return barangay.id
    return None


# --- Segment assignment -------------------------------------------------------


def assign_segment_id(lat: float, lon: float, segments: List[StreetSegment]) -> Optional[int]:
    best_id: Optional[int] = None
    best_distance = float("inf")
    for segment in segments:
        if not segment.polylines:
            continue
        distance = distance_point_to_polyline(lat, lon, segment.polylines)
        if distance < best_distance:
            best_distance = distance
            best_id = segment.id
    if best_distance <= SEGMENT_ASSIGNMENT_THRESHOLD_METERS:
        return best_id
    return None


# --- Coverage planning --------------------------------------------------------


def compute_connectivity(streets: List[Street], adjacency: Dict[int, Set[int]]) -> SurveyPlan:
    street_by_id = {street.id: street for street in streets}
    start_ids = {
        street.id
        for street in streets
        if normalize_category(street.road_category) in FULLY_SURVEYED_CATEGORIES
    }
    visited: Set[int] = set(start_ids)
    queue: deque[int] = deque(start_ids)
    while queue:
        current = queue.popleft()
        for neighbor in adjacency.get(current, set()):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
    residential_like = {
        street.id
        for street in streets
        if normalize_category(street.road_category) not in FULLY_SURVEYED_CATEGORIES
    }
    connected_residential = residential_like & visited
    disconnected_residential = residential_like - connected_residential
    surveyed_residential: Set[int] = set()
    unsurveyed_residential: Set[int] = set(disconnected_residential)
    if connected_residential:
        for street_id in connected_residential:
            if random.random() < RESIDENTIAL_SURVEY_PROBABILITY:
                surveyed_residential.add(street_id)
            else:
                unsurveyed_residential.add(street_id)
        if not surveyed_residential:
            promoted = random.choice(list(connected_residential))
            surveyed_residential.add(promoted)
            unsurveyed_residential.discard(promoted)
    return SurveyPlan(
        surveyed_residential=surveyed_residential,
        unsurveyed_residential=unsurveyed_residential,
        connected_residential=connected_residential,
        disconnected_residential=disconnected_residential,
    )


# --- Data generation ----------------------------------------------------------


def generate_points_for_street(
    street: Street,
    barangays: List[Barangay],
    street_segments: List[StreetSegment],
) -> List[Dict[str, Any]]:
    points: List[Dict[str, Any]] = []
    last_point: Optional[LatLon] = None
    for line in street.polylines:
        if len(line) < 2:
            continue
        for idx in range(len(line) - 1):
            start = line[idx]
            end = line[idx + 1]
            segment_distance = calculate_distance(*start, *end)
            if segment_distance == 0:
                continue
            intervals = max(1, int(segment_distance / POINT_SPACING_METERS))
            for step in range(intervals + 1):
                fraction = step / intervals if intervals else 0.0
                lat, lon = interpolate_point(*start, *end, fraction)
                lat = round(lat, 6)
                lon = round(lon, 6)
                if last_point and abs(last_point[0] - lat) < 1e-6 and abs(last_point[1] - lon) < 1e-6:
                    continue
                barangay_id = find_barangay_id(lat, lon, barangays)
                segment_id = assign_segment_id(lat, lon, street_segments)
                points.append(
                    {
                        "lat": lat,
                        "lon": lon,
                        "street_id": street.id,
                        "street_name": street.name,
                        "barangay_id": barangay_id,
                        "street_segment_id": segment_id,
                        "road_category": street.road_category,
                    }
                )
                last_point = (lat, lon)
    return points


def apply_coverage(points: List[Dict[str, Any]], road_category: str) -> Tuple[List[Dict[str, Any]], bool, float]:
    if not points:
        return [], True, 0.0
    category_key = normalize_category(road_category)
    if category_key in FULLY_SURVEYED_CATEGORIES:
        return points, False, 1.0
    if random.random() < RESIDENTIAL_UNSURVEYED_PROBABILITY:
        return [], True, 0.0
    total = len(points)
    coverage_ratio = random.uniform(0.45, 0.8)
    window_length = max(1, int(total * coverage_ratio))
    start_index = random.randint(0, max(0, total - window_length))
    keep_ranges = [(start_index, start_index + window_length)]
    if total - window_length > 6 and random.random() < 0.25:
        second_ratio = random.uniform(0.2, 0.45)
        second_length = max(1, int(total * second_ratio))
        valid_starts = [
            idx
            for idx in range(0, total - second_length + 1)
            if idx + second_length <= keep_ranges[0][0] or idx >= keep_ranges[0][1]
        ]
        if valid_starts:
            second_start = random.choice(valid_starts)
            keep_ranges.append((second_start, second_start + second_length))
    kept: List[Dict[str, Any]] = []
    for idx, point in enumerate(points):
        if any(start <= idx < end for start, end in keep_ranges):
            kept.append(point)
    actual_ratio = len(kept) / total if total else 0.0
    return kept, False, actual_ratio


# --- File loading -------------------------------------------------------------


def load_json_file(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def load_streets(base_dir: str) -> List[Street]:
    raw = load_json_file(os.path.join(base_dir, "new_streets.json"))
    items = raw.get("streets") if isinstance(raw, dict) else raw
    streets = [Street.from_dict(item) for item in items]
    return streets


def load_segments(base_dir: str) -> Dict[int, List[StreetSegment]]:
    raw = load_json_file(os.path.join(base_dir, "street_segments.json"))
    items = raw.get("street_segments") if isinstance(raw, dict) else raw
    segments = [StreetSegment.from_dict(item) for item in items]
    by_street: Dict[int, List[StreetSegment]] = defaultdict(list)
    for segment in segments:
        if segment.street_id is not None:
            by_street[segment.street_id].append(segment)
    return by_street


def load_barangays(base_dir: str) -> List[Barangay]:
    raw = load_json_file(os.path.join(base_dir, "barangays.json"))
    return [Barangay.from_dict(item) for item in raw]


# --- Generation orchestrator --------------------------------------------------


def generate_illumination_data() -> bool:
    base_dir = os.path.dirname(__file__)
    print("🔄 Loading local datasets (streets, street segments, barangays)...")
    streets = load_streets(base_dir)
    barangays = load_barangays(base_dir)
    segments_by_street = load_segments(base_dir)
    print(f"📊 Loaded {len(streets)} streets from new_streets.json")
    print(f"📊 Loaded {len(barangays)} barangays from barangays.json")
    adjacency = build_street_adjacency(streets)
    plan = compute_connectivity(streets, adjacency)
    print(f"🛣️  Residential streets connected to main roads: {len(plan.connected_residential)}")
    print(f"🚫 Residential streets disconnected: {len(plan.disconnected_residential)}")
    all_points: List[Dict[str, Any]] = []
    unsurveyed_streets: Set[int] = set(plan.unsurveyed_residential)
    coverage_records: List[Dict[str, Any]] = []
    category_counts: Counter = Counter()
    coverage_totals: Counter = Counter()
    point_counter = 0
    for street in streets:
        category = normalize_category(street.road_category)
        segments = segments_by_street.get(street.id, [])
        raw_points = generate_points_for_street(street, barangays, segments)
        points_possible = len(raw_points)
        should_survey = (
            category in FULLY_SURVEYED_CATEGORIES
            or street.id in plan.surveyed_residential
        )
        if not should_survey:
            coverage_records.append(
                {
                    "street_id": street.id,
                    "street_name": street.name,
                    "road_category": category,
                    "coverage_ratio": 0.0,
                    "points_possible": points_possible,
                    "points_generated": 0,
                }
            )
            if points_possible:
                print(
                    f"   No vehicle data for street {street.id} ({street.name}) [{category}] — 0/{points_possible} points kept"
                )
            unsurveyed_streets.add(street.id)
            category_counts[category] += 1
            coverage_totals[category] += 0.0
            continue
        if not raw_points:
            coverage_records.append(
                {
                    "street_id": street.id,
                    "street_name": street.name,
                    "road_category": category,
                    "coverage_ratio": 0.0,
                    "points_possible": 0,
                    "points_generated": 0,
                }
            )
            print(f"⚠️  No geometry-based points generated for street {street.id} ({street.name})")
            unsurveyed_streets.add(street.id)
            category_counts[category] += 1
            coverage_totals[category] += 0.0
            continue
        kept_points, was_unsurveyed, coverage_ratio = apply_coverage(raw_points, category)
        if was_unsurveyed or not kept_points:
            coverage_records.append(
                {
                    "street_id": street.id,
                    "street_name": street.name,
                    "road_category": category,
                    "coverage_ratio": 0.0,
                    "points_possible": points_possible,
                    "points_generated": 0,
                }
            )
            print(
                f"   No vehicle data for street {street.id} ({street.name}) [{category}] — 0/{points_possible} points kept"
            )
            unsurveyed_streets.add(street.id)
            category_counts[category] += 1
            coverage_totals[category] += 0.0
            continue
        if coverage_ratio < 0.999:
            print(
                f"   Partial coverage for street {street.id} ({street.name}) [{category}] — kept {len(kept_points)}/{points_possible}"
            )
        else:
            print(
                f"   Generated {len(kept_points)} points for street {street.id} ({street.name}) [{category}]"
            )
        total_points_now = len(kept_points)
        street_length = street.length_m or (total_points_now * POINT_SPACING_METERS)
        for idx, point in enumerate(kept_points):
            point["lux"] = generate_realistic_lux_pattern(street_length, idx, total_points_now, category)
            point["id"] = f"{street.id}_{point_counter}"
            point_counter += 1
            all_points.append(point)
        coverage_records.append(
            {
                "street_id": street.id,
                "street_name": street.name,
                "road_category": category,
                "coverage_ratio": round(coverage_ratio, 3),
                "points_possible": points_possible,
                "points_generated": total_points_now,
            }
        )
        category_counts[category] += 1
        coverage_totals[category] += coverage_ratio
    metadata: Dict[str, Any] = {
        "total_points": len(all_points),
        "total_streets": len(streets),
        "interval_meters": POINT_SPACING_METERS,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "streets_unsurveyed": sorted(unsurveyed_streets),
        "residential_connectivity": {
            "connected": sorted(plan.connected_residential),
            "disconnected": sorted(plan.disconnected_residential),
        },
        "coverage_stats": {
            "streets_total": len(streets),
            "streets_with_data": len(streets) - len(unsurveyed_streets),
            "streets_unsurveyed": len(unsurveyed_streets),
            "average_coverage_by_category": {
                category: (coverage_totals[category] / category_counts[category]) if category_counts[category] else 0.0
                for category in category_counts
            },
        },
        "segment_coverage": coverage_records,
        "sources": {
            "streets": "new_streets.json",
            "street_segments": "street_segments.json",
            "barangays": "barangays.json",
        },
    }
    lux_values = [point["lux"] for point in all_points]
    if lux_values:
        print("\n📈 Lux Distribution:")
        print(f"   - Min: {min(lux_values):.1f} lux")
        print(f"   - Max: {max(lux_values):.1f} lux")
        print(f"   - Average: {sum(lux_values) / len(lux_values):.1f} lux")
        points_by_category = Counter(point.get("road_category", "unknown") for point in all_points)
        print("   - Points by road category:")
        for category, count in points_by_category.most_common():
            print(f"     • {category}: {count}")
    else:
        print("⚠️  No illumination data points were generated!")
    output_path = os.path.join(base_dir, "new_illumination_data.json")
    with open(output_path, "w", encoding="utf-8") as handle:
        json.dump({"illumination_data": all_points, "metadata": metadata}, handle, indent=2, ensure_ascii=False)
    print(f"\n💾 Generated {len(all_points)} illumination data points")
    if streets:
        avg_points = len(all_points) / max(1, len(streets) - len(unsurveyed_streets))
        print(f"📊 Average points per surveyed street: {avg_points:.1f}")
    return True


# --- CLI entry point ---------------------------------------------------------


def main() -> bool:
    print("🚀 Starting illumination data generation from streets.json...")
    success = generate_illumination_data()
    if success:
        print("🎉 Illumination data generation completed successfully!")
        print("📁 Data saved to new_illumination_data.json")
    else:
        print("❌ Illumination data generation failed!")
    return success


if __name__ == "__main__":
    main()
