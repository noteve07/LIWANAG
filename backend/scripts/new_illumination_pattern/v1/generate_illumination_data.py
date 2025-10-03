# generate_illumination_data.py
import os
import json
import random
import math
from datetime import datetime
from collections import Counter

from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
url = os.environ.get("SUPABASE_URL")
key = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    or os.environ.get("SUPABASE_KEY")
    or os.environ.get("SUPABASE_ANON_KEY")
)

if not url or not key:
    raise RuntimeError("SUPABASE_URL and a Supabase key must be set in the environment")

supabase = create_client(url, key)

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in meters using Haversine formula"""
    R = 6371000  # Earth's radius in meters
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat / 2) ** 2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

def interpolate_point(lat1, lon1, lat2, lon2, fraction):
    """Interpolate a point between two coordinates based on fraction (0-1)"""
    lat = lat1 + (lat2 - lat1) * fraction
    lon = lon1 + (lon2 - lon1) * fraction
    return lat, lon

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

POINT_SPACING_METERS = 10
SHORT_SEGMENT_LENGTH_THRESHOLD = 40
MIN_INTERVALS_FOR_SHORT_SEGMENT = 3  # results in at least 4 points (start, 2 midpoints, end)


def pick_band_for_zone(category_key: str, zone_index: int) -> str:
    zone_weights = CATEGORY_ZONE_WEIGHTS.get(category_key) or CATEGORY_ZONE_WEIGHTS["residential"]
    weights = zone_weights[min(zone_index, len(zone_weights) - 1)]
    bands, probs = zip(*weights.items())
    return random.choices(bands, probs)[0]


def clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def generate_realistic_lux_pattern(segment_length, point_index, total_points, road_category):
    """Generate realistic illumination pattern along a street segment"""

    category_key = (road_category or "residential").lower()
    bands = CATEGORY_LUX_BANDS.get(category_key, CATEGORY_LUX_BANDS["residential"])

    # Determine progression along the segment (0.0 -> 1.0)
    total_points = max(total_points, 1)
    progress = point_index / total_points
    zone_index = min(3, int(progress * 4))

    band_name = pick_band_for_zone(category_key, zone_index)
    band_min, band_max = bands[band_name]

    base_value = random.uniform(band_min, band_max)

    # Smooth transitions
    transition_jitter = random.uniform(0.9, 1.1)
    lux = base_value * transition_jitter

    # Slight trend along the street (brighter near the start/end)
    if zone_index == 0:
        lux *= random.uniform(1.0, 1.05)
    elif zone_index == 3:
        lux *= random.uniform(0.95, 1.02)

    lux = clamp(lux, band_min, band_max)

    # Never return negative values
    return round(max(0, lux), 2)

def generate_illumination_points_along_segment(
    segment_coords,
    street_segment_id,
    street_id,
    street_name,
    barangay_id,
    road_category,
    segment_length,
):
    """Generate illumination data points along a street segment"""
    data_points = []
    
    if not segment_coords or len(segment_coords) < 2:
        return data_points
    
    # Handle MultiLineString (multiple line segments)
    if isinstance(segment_coords[0][0], list):
        # MultiLineString: process each line segment
        for line_segment in segment_coords:
            data_points.extend(
                generate_points_for_line_segment(
                    line_segment,
                    street_segment_id,
                    street_id,
                    street_name,
                    barangay_id,
                    road_category,
                    segment_length,
                )
            )
    else:
        # Single LineString
        data_points.extend(
            generate_points_for_line_segment(
                segment_coords,
                street_segment_id,
                street_id,
                street_name,
                barangay_id,
                road_category,
                segment_length,
            )
        )
    
    return data_points

def generate_points_for_line_segment(
    coords,
    street_segment_id,
    street_id,
    street_name,
    barangay_id,
    road_category,
    segment_length,
):
    """Generate points for a single line segment"""
    data_points = []
    point_index = 0

    base_points_for_segment = int(math.ceil(segment_length / POINT_SPACING_METERS)) + 1
    minimum_points = MIN_INTERVALS_FOR_SHORT_SEGMENT + 1 if segment_length <= SHORT_SEGMENT_LENGTH_THRESHOLD else 2
    estimated_points = max(base_points_for_segment, minimum_points)

    for i in range(len(coords) - 1):
        lat1, lon1 = coords[i][1], coords[i][0]  # Convert from [lon, lat] to [lat, lon]
        lat2, lon2 = coords[i + 1][1], coords[i + 1][0]

        # Calculate total distance of this segment
        segment_distance = calculate_distance(lat1, lon1, lat2, lon2)

        if segment_distance == 0:
            continue

        intervals = max(int(math.ceil(segment_distance / POINT_SPACING_METERS)), 1)
        if segment_length <= SHORT_SEGMENT_LENGTH_THRESHOLD:
            intervals = max(intervals, MIN_INTERVALS_FOR_SHORT_SEGMENT)

        points_in_segment = intervals + 1

        for j in range(points_in_segment):
            # Avoid duplicating shared vertices between consecutive line segments
            if data_points and j == 0:
                continue

            fraction = j / (points_in_segment - 1) if points_in_segment > 1 else 0
            lat, lon = interpolate_point(lat1, lon1, lat2, lon2, fraction)

            lux = generate_realistic_lux_pattern(segment_length, point_index, estimated_points, road_category)

            data_point = {
                "id": f"{street_segment_id}_{barangay_id}_{len(data_points)}",
                "lat": round(lat, 6),
                "lon": round(lon, 6),
                "lux": lux,
                "street_id": street_id,
                "street_segment_id": street_segment_id,
                "street_name": street_name,
                "barangay_id": barangay_id,
                "road_category": road_category
            }

            data_points.append(data_point)
            point_index += 1
    
    return data_points

def load_barangays():
    """Load barangays metadata from Supabase"""
    try:
        response = supabase.table('barangays').select('id, name').execute()
        data = response.data or []
        print(f"📊 Retrieved {len(data)} barangays from Supabase")
        return data
    except Exception as e:
        print(f"❌ Error fetching barangays from Supabase: {e}")
        return []


def load_street_segments(allowed_barangay_ids):
    """Load street segments for the allowed barangays from Supabase"""
    if not allowed_barangay_ids:
        return []

    try:
        query = (
            supabase
            .table('street_segments')
            .select('id, original_street_id, street_name, barangay_id, road_category, segment_geom, segment_length')
            .in_('barangay_id', allowed_barangay_ids)
        )
        response = query.execute()
        data = response.data or []
        print(f"📊 Retrieved {len(data)} street segments from Supabase")
        return data
    except Exception as e:
        print(f"❌ Error fetching street segments from Supabase: {e}")
        return []


def load_streets():
    """Load street master data for resolving street IDs"""
    try:
        response = supabase.table('streets').select('id, name, road_category, meters').execute()
        data = response.data or []
        print(f"📊 Retrieved {len(data)} streets from Supabase")

        by_id = {}
        by_name = {}

        for row in data:
            if 'id' not in row:
                continue
            key = str(row['id'])
            by_id[key] = row

            name = (row.get('name') or '').strip().lower()
            if name:
                by_name.setdefault(name, []).append(row)

        return by_id, by_name
    except Exception as e:
        print(f"❌ Error fetching streets from Supabase: {e}")
        return {}, {}


# Allow all barangays (no filter)
ALLOWED_BARANGAYS = None


def parse_geometry(geom_value):
    """Normalize geometry to GeoJSON dict"""
    if not geom_value:
        return None
    if isinstance(geom_value, dict):
        return geom_value
    if isinstance(geom_value, str):
        try:
            return json.loads(geom_value)
        except json.JSONDecodeError:
            print("⚠️  Unable to parse geometry JSON string")
            return None
    print(f"⚠️  Unsupported geometry type: {type(geom_value)}")
    return None


def calculate_segment_length_from_geometry(geometry):
    """Compute segment length from GeoJSON geometry if not provided"""
    if not geometry or 'coordinates' not in geometry:
        return 0

    coords = geometry['coordinates']
    total_length = 0

    if not coords:
        return 0

    # Handle MultiLineString
    if isinstance(coords[0][0], list):
        for line in coords:
            for i in range(len(line) - 1):
                lat1, lon1 = line[i][1], line[i][0]
                lat2, lon2 = line[i + 1][1], line[i + 1][0]
                total_length += calculate_distance(lat1, lon1, lat2, lon2)
    else:  # LineString
        for i in range(len(coords) - 1):
            lat1, lon1 = coords[i][1], coords[i][0]
            lat2, lon2 = coords[i + 1][1], coords[i + 1][0]
            total_length += calculate_distance(lat1, lon1, lat2, lon2)

    return total_length

def generate_illumination_data():
    """Generate illumination data for all street segments"""
    try:
        print("🔄 Loading street segments and barangays data...")
        
        # Load street segments and barangays
        barangays = load_barangays()
        
        if not barangays:
            print("❌ No barangays data found in Supabase.")
            return False


        if ALLOWED_BARANGAYS is None:
            allowed_barangay_ids = [b['id'] for b in barangays]
            print(f"📊 Allowing all barangays ({len(allowed_barangay_ids)})")
        else:
            allowed_barangay_ids = [b['id'] for b in barangays if b['name'] in ALLOWED_BARANGAYS]
            if not allowed_barangay_ids:
                print("❌ No allowed barangays found in the database.")
                return False
            print(f"📊 Allowed barangays: {', '.join(ALLOWED_BARANGAYS)}")
            print(f"📊 Allowed barangay IDs: {allowed_barangay_ids}")

        streets_by_id, streets_by_name = load_streets()
        street_segments = load_street_segments(allowed_barangay_ids)

        if not street_segments:
            print("❌ No street segments returned for the allowed barangays.")
            return False

        print(f"📊 Processing {len(street_segments)} segments from Supabase")
        
        all_illumination_data = []
        
        for segment in street_segments:
            segment_id = segment.get('id')
            street_name = segment.get('street_name') or f"Segment {segment_id}"
            barangay_id = segment.get('barangay_id')
            segment_road_category = (segment.get('road_category') or '').strip().lower()

            resolved_street_id = None
            resolved_street_name = street_name
            resolved_street_meta = None

            original_candidate = segment.get('original_street_id')
            if original_candidate is not None:
                resolved_street_meta = streets_by_id.get(str(original_candidate))
                if resolved_street_meta:
                    resolved_street_id = resolved_street_meta['id']
                    resolved_street_name = resolved_street_meta.get('name') or street_name

            if resolved_street_meta is None and street_name:
                name_key = street_name.strip().lower()
                matches = streets_by_name.get(name_key, [])
                if matches:
                    resolved_street_meta = matches[0]
                    resolved_street_id = resolved_street_meta['id']
                    resolved_street_name = resolved_street_meta.get('name') or street_name

            if resolved_street_id is None:
                resolved_street_id = segment_id

            if resolved_street_meta and resolved_street_meta.get('road_category'):
                road_category = resolved_street_meta['road_category'].strip().lower()
            elif segment_road_category:
                road_category = segment_road_category
            else:
                road_category = 'residential'

            geometry = parse_geometry(segment.get('segment_geom'))

            if not geometry or not geometry.get('coordinates'):
                print(f"⚠️  Skipping segment {segment.get('id')} - no geometry data")
                continue

            # Determine segment length (use stored value if present, else compute)
            total_length = segment.get('segment_length') or calculate_segment_length_from_geometry(geometry)

            if total_length <= 0:
                print(f"⚠️  Skipping segment {segment_id} - invalid length")
                continue

            segment_illumination = generate_illumination_points_along_segment(
                geometry['coordinates'],
                segment_id,
                resolved_street_id,
                resolved_street_name,
                barangay_id,
                road_category,
                total_length
            )

            all_illumination_data.extend(segment_illumination)
            print(
                f"   Generated {len(segment_illumination)} points for segment {segment_id}"
                f" ({resolved_street_name}) [{road_category}]"
            )
        
        # Save to JSON file
        output_data = {
            "illumination_data": all_illumination_data,
            "metadata": {
                "total_points": len(all_illumination_data),
                "total_segments": len(street_segments),
                "interval_meters": 10,
                "generated_at": datetime.utcnow().isoformat() + "Z",
                "allowed_barangays": ALLOWED_BARANGAYS
            }
        }
        
        with open("new_illumination_data.json", "w", encoding="utf-8") as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)

        print(f"💾 Generated {len(all_illumination_data)} illumination data points")
        print(f"📊 Average points per segment: {len(all_illumination_data) / len(street_segments):.1f}")
        
        # Show lux distribution
        if all_illumination_data:
            lux_values = [point['lux'] for point in all_illumination_data]
            print(f"\n📈 Lux Distribution:")
            print(f"   - Min: {min(lux_values):.1f} lux")
            print(f"   - Max: {max(lux_values):.1f} lux")
            print(f"   - Average: {sum(lux_values)/len(lux_values):.1f} lux")

            category_counts = Counter(point.get('road_category', 'unknown') for point in all_illumination_data)
            print("   - Points by road category:")
            for category, count in category_counts.most_common():
                print(f"     • {category}: {count}")
        else:
            print(f"\n⚠️  No illumination data points were generated!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error generating illumination data: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Starting illumination data generation...")
    
    if generate_illumination_data():
        print("🎉 Illumination data generation completed successfully!")
        print("📁 Data saved to new_illumination_data.json")
    else:
        print("❌ Illumination data generation failed!")
        return False
    
    return True

if __name__ == "__main__":
    main()
