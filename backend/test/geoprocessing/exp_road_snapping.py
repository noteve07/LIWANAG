import geohash2 as gh
import folium
from shapely.geometry import Point, LineString, shape
from shapely.ops import nearest_points
import json

# --- 1. LOAD ROAD DATA --- 
def load_streets(geojson_path):
    """Load street segments from GeoJSON file"""
    with open(geojson_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    street_segments = []
    for feature in data['features']:
        # Convert GeoJSON geometry to a Shapely LineString
        line = shape(feature['geometry'])
        street_segments.append({
            'line': line,
            'properties': feature['properties']  # Store road name etc.
        })
    return street_segments

# Load your road data
street_data = load_streets('balanga_road1.geojson')
street_segments = [item['line'] for item in street_data]  # Just the geometry for snapping

# --- 2. SNAP TO ROAD FUNCTION ---
def snap_to_street(point_lat, point_lon, street_segments, max_distance=50.0):
    """Snap a point to the nearest street segment within max_distance meters"""
    gps_point = Point(point_lon, point_lat)  # Shapely uses (x, y) = (lon, lat)
    
    closest_street = None
    min_distance = float('inf')
    snapped_point = None
    
    for street in street_segments:
        # Find the nearest point on this street segment to our GPS point
        nearest_pt = nearest_points(street, gps_point)[0]
        distance = gps_point.distance(nearest_pt)
        
        # Check if this is the closest street so far
        if distance < min_distance:
            min_distance = distance
            snapped_point = nearest_pt
            
    # Return the snapped coordinate if within threshold, else original
    if min_distance <= max_distance:
        return snapped_point.y, snapped_point.x, min_distance  # Returns (lat, lon, distance)
    else:
        return point_lat, point_lon, min_distance  # Too far, return original

# --- 3. PROCESS DATA WITH SNAPPING ---
illumination_values_db = {}
new_readings_night1 = [
    {'lat': 14.679869, 'lon': 120.542106, 'lux': 10, 'timestamp': '2024-09-16T20:05:00Z', 'device_id': 'puv_alpha'},
    {'lat': 14.679863, 'lon': 120.542117, 'lux': 20, 'timestamp': '2024-09-16T20:05:05Z', 'device_id': 'puv_alpha'},
    {'lat': 14.679783, 'lon': 120.542153, 'lux': 30, 'timestamp': '2024-09-16T20:05:10Z', 'device_id': 'puv_alpha'},
]

print("--- PROCESSING NIGHT 1 DATA WITH ROAD SNAPPING ---")
processed_readings = []

for reading in new_readings_night1:
    original_lat, original_lon = reading['lat'], reading['lon']
    
    # SNAP TO ROAD before processing!
    snapped_lat, snapped_lon, snap_distance = snap_to_street(
        original_lat, original_lon, street_segments, max_distance=20.0
    )
    
    print(f"Original: ({original_lat}, {original_lon}) | Snapped: ({snapped_lat}, {snapped_lon}) | Distance: {snap_distance:.2f}m")
    
    # Use the SNAPPED coordinates for everything else
    reading_geohash = gh.encode(snapped_lat, snapped_lon, precision=10)
    
    # Store for visualization
    processed_readings.append({
        'original': (original_lat, original_lon),
        'snapped': (snapped_lat, snapped_lon),
        'distance': snap_distance,
        'geohash': reading_geohash,
        'data': reading
    })
    
    # Check if this geohash exists in our DB
    existing_data = illumination_values_db.get(reading_geohash)
    
    # Rest of your processing logic...
    if existing_data is None:
        illumination_values_db[reading_geohash] = {
            'lat': snapped_lat,
            'lon': snapped_lon,
            'lux': reading['lux'],
            'timestamp': reading['timestamp'],
            'device_id': reading['device_id']
        }
        print(f"  -> NEW LOCATION. Added to DB.\n")
    else:
        print(f"  -> DUPLICATE LOCATION. Checking timestamps...")
        if reading['timestamp'] > existing_data['timestamp']:
            illumination_values_db[reading_geohash].update({
                'lat': snapped_lat,
                'lon': snapped_lon,
                'lux': reading['lux'],
                'timestamp': reading['timestamp'],
                'device_id': reading['device_id']
            })
            print(f"     -> UPDATED with newer data.\n")
        else:
            print(f"     -> OLD DATA. Ignored.\n")

# --- 4. VISUALIZE WITH FOLIUM ---
print("\n--- CREATING VISUALIZATION ---")

# Create map centered on first point
map_center = [new_readings_night1[0]['lat'], new_readings_night1[0]['lon']]
my_map = folium.Map(location=map_center, zoom_start=17)

# Add title
title_html = '<h3 align="center" style="font-size:16px"><b>LIWANAG: Road Snapping Test</b></h3>'
my_map.get_root().html.add_child(folium.Element(title_html))

# Add roads to map
for street in street_data:
    # Convert LineString to lat/lon pairs for Folium
    line_coords = [(coord[1], coord[0]) for coord in street['line'].coords]
    folium.PolyLine(
        line_coords,
        color='blue',
        weight=3,
        opacity=0.7,
        popup=street['properties'].get('name', 'Unnamed Road')
    ).add_to(my_map)

# Plot original vs snapped points
for reading in processed_readings:
    orig_lat, orig_lon = reading['original']
    snap_lat, snap_lon = reading['snapped']
    
    # Original point (red)
    folium.CircleMarker(
        location=[orig_lat, orig_lon],
        radius=5,
        color='red',
        fill=True,
        fillColor='red',
        fillOpacity=0.7,
        popup=f"Original: Lux={reading['data']['lux']}"
    ).add_to(my_map)
    
    # Snapped point (green)
    folium.CircleMarker(
        location=[snap_lat, snap_lon],
        radius=6,
        color='green',
        fill=True,
        fillColor='green',
        fillOpacity=0.9,
        popup=f"Snapped: Lux={reading['data']['lux']}, Dist={reading['distance']:.1f}m"
    ).add_to(my_map)
    
    # Line connecting original to snapped
    folium.PolyLine(
        locations=[[orig_lat, orig_lon], [snap_lat, snap_lon]],
        color='gray',
        weight=2,
        opacity=0.5
    ).add_to(my_map)

# Add legend
legend_html = '''
<div style="position: fixed; bottom: 50px; left: 50px; width: 220px; height: 120px; 
            border:2px solid grey; z-index:9999; font-size:14px; background-color:white;">
&nbsp; <b>Legend</b> <br>
&nbsp; <i style="background:red; width:15px; height:15px; display:inline-block;"></i> &nbsp; Original GPS Point<br>
&nbsp; <i style="background:green; width:15px; height:15px; display:inline-block;"></i> &nbsp; Snapped to Road<br>
&nbsp; <i style="background:blue; width:15px; height:15px; display:inline-block;"></i> &nbsp; Roads from GeoJSON<br>
</div>
'''
my_map.get_root().html.add_child(folium.Element(legend_html))

# Save map
my_map.save("road_snapping_test.html")
print("Visualization saved to 'road_snapping_test.html'!")
print("Open this file in your browser to see the results.")