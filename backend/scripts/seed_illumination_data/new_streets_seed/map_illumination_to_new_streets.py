#!/usr/bin/env python3
"""
Map illumination data to new streets using geometry
This script updates the street_id in illumination data to match the new streets table
by finding which street geometry each illumination point falls within.
"""

import json
import math
from shapely.geometry import Point, LineString, MultiLineString
from shapely.ops import nearest_points

def load_json_file(filename):
    """Load JSON file"""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Error loading {filename}: {e}")
        return None

def save_json_file(data, filename):
    """Save JSON file"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"✅ Saved {filename}")
        return True
    except Exception as e:
        print(f"❌ Error saving {filename}: {e}")
        return False

def point_to_shapely_point(lat, lon):
    """Convert lat/lon to Shapely Point"""
    return Point(lon, lat)

def geometry_to_shapely(geom_data):
    """Convert GeoJSON geometry to Shapely geometry"""
    if geom_data['type'] == 'MultiLineString':
        lines = []
        for line in geom_data['coordinates']:
            lines.append(LineString(line))
        return MultiLineString(lines)
    elif geom_data['type'] == 'LineString':
        return LineString(geom_data['coordinates'])
    else:
        return None

def find_nearest_street(illumination_point, streets_data):
    """Find the nearest street for an illumination point"""
    point = point_to_shapely_point(illumination_point['lat'], illumination_point['lon'])
    
    min_distance = float('inf')
    nearest_street_id = None
    
    for street in streets_data:
        if street.get('geometry'):
            street_geom = geometry_to_shapely(street['geometry'])
            if street_geom:
                # Calculate distance from point to street geometry
                distance = point.distance(street_geom)
                
                if distance < min_distance:
                    min_distance = distance
                    nearest_street_id = street['id']
    
    return nearest_street_id, min_distance

def map_illumination_to_streets():
    """Map illumination data to new streets"""
    print("🔄 Loading data files...")
    
    # Load illumination data
    illumination_data = load_json_file('illumination_data.json')
    if not illumination_data:
        return False
    
    # Load new streets data
    streets_data = load_json_file('streets_new.json')
    if not streets_data:
        return False
    
    print(f"📊 Loaded {len(illumination_data['illumination_data'])} illumination points")
    print(f"📊 Loaded {len(streets_data)} streets")
    
    # Process each illumination point
    updated_count = 0
    total_points = len(illumination_data['illumination_data'])
    
    print("🔄 Mapping illumination points to streets...")
    
    for i, point in enumerate(illumination_data['illumination_data']):
        if i % 1000 == 0:
            print(f"   Processing point {i+1}/{total_points}...")
        
        # Find nearest street
        nearest_street_id, distance = find_nearest_street(point, streets_data)
        
        if nearest_street_id:
            old_street_id = point['street_id']
            point['street_id'] = nearest_street_id
            
            if old_street_id != nearest_street_id:
                updated_count += 1
                if updated_count <= 10:  # Show first 10 updates
                    print(f"   Point {point['id']}: {old_street_id} -> {nearest_street_id} (distance: {distance:.6f})")
        else:
            print(f"   ⚠️  Could not find street for point {point['id']}")
    
    print(f"✅ Updated {updated_count} illumination points")
    
    # Save updated illumination data
    output_file = 'illumination_data_mapped.json'
    if save_json_file(illumination_data, output_file):
        print(f"💾 Updated illumination data saved to {output_file}")
        
        # Show statistics
        street_id_counts = {}
        for point in illumination_data['illumination_data']:
            street_id = point['street_id']
            street_id_counts[street_id] = street_id_counts.get(street_id, 0) + 1
        
        print(f"\n📈 Statistics:")
        print(f"   Total points: {len(illumination_data['illumination_data'])}")
        print(f"   Updated points: {updated_count}")
        print(f"   Unique streets: {len(street_id_counts)}")
        
        # Show top 10 streets by point count
        sorted_streets = sorted(street_id_counts.items(), key=lambda x: x[1], reverse=True)
        print(f"\n📋 Top 10 streets by illumination points:")
        for street_id, count in sorted_streets[:10]:
            street_name = next((s['name'] for s in streets_data if s['id'] == street_id), 'Unknown')
            print(f"   Street {street_id} ({street_name}): {count} points")
        
        return True
    
    return False

def main():
    """Main function"""
    print("🔄 Mapping Illumination Data to New Streets")
    print("=" * 50)
    
    try:
        # Install shapely if not available
        try:
            import shapely
        except ImportError:
            print("📦 Installing shapely...")
            import subprocess
            subprocess.check_call(['pip', 'install', 'shapely'])
            print("✅ Shapely installed")
        
        success = map_illumination_to_streets()
        
        if success:
            print(f"\n🎉 Successfully mapped illumination data to new streets!")
            print("📁 Output file: illumination_data_mapped.json")
        else:
            print(f"\n❌ Failed to map illumination data!")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
