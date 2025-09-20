# generate_data_points.py
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

def generate_lux_value():
    """Generate a realistic street illumination lux value"""
    # Simulate different street illumination conditions
    illumination_type = random.choices(
        ['poor', 'adequate', 'good', 'excellent'],
        weights=[0.3, 0.4, 0.2, 0.1]
    )[0]
    
    if illumination_type == 'poor':
        return random.uniform(1, 10)    # Poor illumination (red)
    elif illumination_type == 'adequate':
        return random.uniform(10, 50)   # Adequate illumination (orange)
    elif illumination_type == 'good':
        return random.uniform(50, 200)  # Good illumination (green)
    else:  # excellent
        return random.uniform(200, 500) # Excellent illumination (bright green)

def generate_data_points_along_street(street_coords, street_id, street_name, interval_meters=10):
    """Generate data points along a street at specified intervals"""
    data_points = []
    
    if not street_coords or len(street_coords) < 2:
        return data_points
    
    # Handle MultiLineString (multiple line segments)
    if isinstance(street_coords[0][0], list):
        # MultiLineString: process each line segment
        for line_segment in street_coords:
            data_points.extend(generate_points_for_line_segment(
                line_segment, street_id, street_name, interval_meters
            ))
    else:
        # Single LineString
        data_points.extend(generate_points_for_line_segment(
            street_coords, street_id, street_name, interval_meters
        ))
    
    return data_points

def generate_points_for_line_segment(coords, street_id, street_name, interval_meters):
    """Generate points for a single line segment"""
    data_points = []
    
    for i in range(len(coords) - 1):
        lat1, lon1 = coords[i][1], coords[i][0]  # Convert from [lon, lat] to [lat, lon]
        lat2, lon2 = coords[i + 1][1], coords[i + 1][0]
        
        # Calculate total distance of this segment
        segment_distance = calculate_distance(lat1, lon1, lat2, lon2)
        
        if segment_distance == 0:
            continue
            
        # Calculate number of points needed for this segment
        num_points = int(segment_distance / interval_meters)
        
        # Generate points along this segment
        for j in range(num_points + 1):  # +1 to include the end point
            fraction = j / num_points if num_points > 0 else 0
            lat, lon = interpolate_point(lat1, lon1, lat2, lon2, fraction)
            
            # Generate lux value
            lux = generate_lux_value()
            
            data_point = {
                "lat": round(lat, 6),
                "lon": round(lon, 6),
                "lux": round(lux, 2),
                "street_id": street_id,
                "barangay_id": None  # You can add barangay_id logic here if needed
            }
            
            data_points.append(data_point)
    
    return data_points

def fetch_and_generate_data_points():
    """Fetch whole streets and generate data points"""
    try:
        print("🔄 Fetching whole streets data...")
        
        # Fetch from street_wholes table
        whole_response = supabase.table("street_wholes").select("id, name, geometry, total_length").execute()
        street_wholes = whole_response.data
        print(f"✅ Fetched {len(street_wholes)} streets from street_wholes")
        
        all_data_points = []
        
        for street in street_wholes:
            print(f"📍 Processing street: {street.get('name', 'Unnamed')} (ID: {street['id']})")
            
            geometry = street.get('geometry')
            if not geometry or not geometry.get('coordinates'):
                print(f"⚠️  Skipping street {street['id']} - no geometry data")
                continue
            
            # Generate data points along this street
            street_data_points = generate_data_points_along_street(
                geometry['coordinates'],
                street['id'],
                street.get('name', 'Unnamed Street'),
                interval_meters=10
            )
            
            all_data_points.extend(street_data_points)
            print(f"   Generated {len(street_data_points)} data points")
        
        # Save to JSON file
        output_data = {
            "data_points": all_data_points,
            "metadata": {
                "total_points": len(all_data_points),
                "total_streets": len(street_wholes),
                "interval_meters": 10,
                "generated_at": "2024-01-01T00:00:00Z"  # You can use datetime.now().isoformat()
            }
        }
        
        with open("street_data_points.json", "w", encoding="utf-8") as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Generated {len(all_data_points)} data points saved to street_data_points.json")
        print(f"📊 Average points per street: {len(all_data_points) / len(street_wholes):.1f}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    fetch_and_generate_data_points()
