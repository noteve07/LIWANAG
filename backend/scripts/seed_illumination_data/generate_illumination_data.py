# generate_illumination_data.py
import os
import json
import random
import math
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
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

def generate_realistic_lux_pattern(segment_length, point_index, total_points):
    """Generate realistic illumination pattern along a street segment"""
    
    # Base illumination levels (realistic street lighting) - Updated to 0-1000 range
    base_levels = {
        'very_dark': (1, 50),        # Very dark areas (0-200 range)
        'dark': (50, 150),           # Dark areas (0-200 range)
        'dim': (150, 300),           # Dim lighting (200-400 range)
        'adequate': (300, 500),      # Adequate lighting (200-400 range)
        'good': (500, 700),          # Good lighting (400-600 range)
        'bright': (700, 850),        # Bright areas (600-800 range)
        'very_bright': (850, 1000)   # Very bright areas (800-1000 range)
    }
    
    # Create realistic patterns along the street
    # Simulate different lighting zones
    zone_length = segment_length / 4  # Divide into 4 zones
    
    if point_index * 10 < zone_length:
        # Zone 1: Start of street (often dimmer)
        pattern = random.choices(
            ['very_dark', 'dark', 'dim', 'adequate'],
            weights=[0.3, 0.4, 0.2, 0.1]
        )[0]
    elif point_index * 10 < zone_length * 2:
        # Zone 2: Middle-dark (mixed lighting)
        pattern = random.choices(
            ['dark', 'dim', 'adequate', 'good'],
            weights=[0.2, 0.4, 0.3, 0.1]
        )[0]
    elif point_index * 10 < zone_length * 3:
        # Zone 3: Middle-bright (main lighting)
        pattern = random.choices(
            ['dim', 'adequate', 'good', 'bright'],
            weights=[0.1, 0.3, 0.4, 0.2]
        )[0]
    else:
        # Zone 4: End of street (often brighter)
        pattern = random.choices(
            ['adequate', 'good', 'bright', 'very_bright'],
            weights=[0.1, 0.3, 0.4, 0.2]
        )[0]
    
    # Add some randomness and smooth transitions
    base_min, base_max = base_levels[pattern]
    
    # Add gradual transitions between zones
    transition_factor = 1.0
    if point_index > 0 and point_index < total_points - 1:
        # Smooth transitions between points
        transition_factor = 0.8 + (random.random() * 0.4)  # 0.8 to 1.2
    
    # Generate final lux value
    lux = random.uniform(base_min, base_max) * transition_factor
    
    # Ensure realistic bounds (0-1000 range)
    lux = max(1, min(1000, lux))
    
    return round(lux, 2)

def generate_illumination_points_along_segment(segment_coords, street_id, barangay_id, segment_length):
    """Generate illumination data points along a street segment"""
    data_points = []
    
    if not segment_coords or len(segment_coords) < 2:
        return data_points
    
    # Handle MultiLineString (multiple line segments)
    if isinstance(segment_coords[0][0], list):
        # MultiLineString: process each line segment
        for line_segment in segment_coords:
            data_points.extend(generate_points_for_line_segment(
                line_segment, street_id, barangay_id, segment_length
            ))
    else:
        # Single LineString
        data_points.extend(generate_points_for_line_segment(
            segment_coords, street_id, barangay_id, segment_length
        ))
    
    return data_points

def generate_points_for_line_segment(coords, street_id, barangay_id, segment_length):
    """Generate points for a single line segment"""
    data_points = []
    point_index = 0
    
    for i in range(len(coords) - 1):
        lat1, lon1 = coords[i][1], coords[i][0]  # Convert from [lon, lat] to [lat, lon]
        lat2, lon2 = coords[i + 1][1], coords[i + 1][0]
        
        # Calculate total distance of this segment
        segment_distance = calculate_distance(lat1, lon1, lat2, lon2)
        
        if segment_distance == 0:
            continue
            
        # Calculate number of points needed for this segment (every 10 meters)
        num_points = int(segment_distance / 10)
        
        # Generate points along this segment
        for j in range(num_points + 1):  # +1 to include the end point
            fraction = j / num_points if num_points > 0 else 0
            lat, lon = interpolate_point(lat1, lon1, lat2, lon2, fraction)
            
            # Generate realistic lux value
            lux = generate_realistic_lux_pattern(segment_length, point_index, num_points)
            
            data_point = {
                "id": f"{street_id}_{barangay_id}_{len(data_points)}",
                "lat": round(lat, 6),
                "lon": round(lon, 6),
                "lux": lux,
                "street_id": street_id,
                "barangay_id": barangay_id
            }
            
            data_points.append(data_point)
            point_index += 1
    
    return data_points

def load_street_segments():
    """Load street segments data from JSON file"""
    try:
        with open('street_segments.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Error loading street_segments.json: {e}")
        return []

def load_barangays():
    """Load barangays data to filter by allowed barangays"""
    try:
        with open('barangays.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Error loading barangays.json: {e}")
        return []

# Performance optimization - only process these barangays
ALLOWED_BARANGAYS = [
    'Poblacion',
    'Ibayo', 
    'Tenejero',
    'Talisay',
    'Puerto Rivas Lote',
    'Dona Francisca',
    'Malabia',
    'Cupang West',
    'Cupang North',
    'Bagumbayan',
    'San Jose'
]

def generate_illumination_data():
    """Generate illumination data for all street segments"""
    try:
        print("🔄 Loading street segments and barangays data...")
        
        # Load street segments and barangays
        street_segments = load_street_segments()
        barangays = load_barangays()
        
        if not street_segments:
            print("❌ No street segments data found. Please run fetch_street_segments.py first.")
            return False
        
        if not barangays:
            print("❌ No barangays data found. Please run fetch_barangays.py first.")
            return False
        
        # Get allowed barangay IDs
        allowed_barangay_ids = [b['id'] for b in barangays if b['name'] in ALLOWED_BARANGAYS]
        print(f"📊 Found {len(street_segments)} street segments")
        print(f"📊 Processing only {len(ALLOWED_BARANGAYS)} allowed barangays: {', '.join(ALLOWED_BARANGAYS)}")
        print(f"📊 Allowed barangay IDs: {allowed_barangay_ids}")
        
        # Filter street segments to only allowed barangays
        filtered_segments = [seg for seg in street_segments if seg.get('barangay_id') in allowed_barangay_ids]
        print(f"📊 Filtered to {len(filtered_segments)} segments in allowed barangays")
        
        all_illumination_data = []
        
        for segment in filtered_segments:
            street_id = segment.get('original_street_id')
            barangay_id = segment.get('barangay_id')
            geometry = segment.get('segment_geom')
            
            if not geometry or not geometry.get('coordinates'):
                print(f"⚠️  Skipping segment {segment.get('id')} - no geometry data")
                continue
            
            # Calculate segment length for realistic patterns
            coords = geometry['coordinates']
            if isinstance(coords[0][0], list):
                # MultiLineString
                total_length = 0
                for line in coords:
                    for i in range(len(line) - 1):
                        lat1, lon1 = line[i][1], line[i][0]
                        lat2, lon2 = line[i + 1][1], line[i + 1][0]
                        total_length += calculate_distance(lat1, lon1, lat2, lon2)
            else:
                # LineString
                total_length = 0
                for i in range(len(coords) - 1):
                    lat1, lon1 = coords[i][1], coords[i][0]
                    lat2, lon2 = coords[i + 1][1], coords[i + 1][0]
                    total_length += calculate_distance(lat1, lon1, lat2, lon2)
            
            # Generate illumination points along this segment
            segment_illumination = generate_illumination_points_along_segment(
                geometry['coordinates'],
                street_id,
                barangay_id,
                total_length
            )
            
            all_illumination_data.extend(segment_illumination)
            print(f"   Generated {len(segment_illumination)} points for segment {segment.get('id')}")
        
        # Save to JSON file
        output_data = {
            "illumination_data": all_illumination_data,
            "metadata": {
                "total_points": len(all_illumination_data),
                "total_segments": len(street_segments),
                "interval_meters": 10,
                "generated_at": "2024-01-01T00:00:00Z"
            }
        }
        
        with open("illumination_data.json", "w", encoding="utf-8") as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Generated {len(all_illumination_data)} illumination data points")
        print(f"📊 Average points per segment: {len(all_illumination_data) / len(filtered_segments):.1f}")
        
        # Show lux distribution
        if all_illumination_data:
            lux_values = [point['lux'] for point in all_illumination_data]
            print(f"\n📈 Lux Distribution:")
            print(f"   - Min: {min(lux_values):.1f} lux")
            print(f"   - Max: {max(lux_values):.1f} lux")
            print(f"   - Average: {sum(lux_values)/len(lux_values):.1f} lux")
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
        print("📁 Data saved to illumination_data.json")
    else:
        print("❌ Illumination data generation failed!")
        return False
    
    return True

if __name__ == "__main__":
    main()
