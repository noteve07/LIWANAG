import geohash2 as gh
import folium

# Pseudo Database: Illumination Values Table
illumination_values_db = {}

# Raw Data from Night 1
new_readings_night1 = [
    {'lat': 14.679460, 'lon': 120.542289, 'lux': 10, 'timestamp': '2024-09-16T20:05:00Z', 'device_id': 'puv_alpha'},
    {'lat': 14.679863, 'lon': 120.542117, 'lux': 20, 'timestamp': '2024-09-16T20:05:05Z', 'device_id': 'puv_alpha'},
    {'lat': 14.679783, 'lon': 120.542153, 'lux': 30, 'timestamp': '2024-09-16T20:05:10Z', 'device_id': 'puv_alpha'},
]

print("--- PROCESSING NIGHT 1 DATA ---")
for reading in new_readings_night1:
    # 1. Calculate the geohash for the reading (precision 10 for ~1m accuracy)
    reading_geohash = gh.encode(reading['lat'], reading['lon'], precision=10)
    print(f"Point ({reading['lat']}, {reading['lon']}) -> Geohash: {reading_geohash}")

    # 2. Check if this geohash exists in our DB
    existing_data = illumination_values_db.get(reading_geohash)

    # 3. If it doesn't exist, add it.
    if existing_data is None:
        illumination_values_db[reading_geohash] = {
            'lat': reading['lat'],
            'lon': reading['lon'],
            'lux': reading['lux'],
            'timestamp': reading['timestamp'],
            'device_id': reading['device_id'],
            'geohash': reading_geohash  # Store geohash for reference
        }
        print(f"  -> NEW LOCATION. Added to DB.\n")
    else:
        # 4. If it exists, check if the new data is newer and update if it is.
        print(f"  -> DUPLICATE LOCATION. Checking timestamps...")
        print(f"     Existing Timestamp: {existing_data['timestamp']}")
        print(f"     New Timestamp:      {reading['timestamp']}")
        if reading['timestamp'] > existing_data['timestamp']:
            illumination_values_db[reading_geohash].update({
                'lat': reading['lat'],
                'lon': reading['lon'],
                'lux': reading['lux'],
                'timestamp': reading['timestamp'],
                'device_id': reading['device_id']
            })
            print(f"     -> UPDATED with newer data.\n")
        else:
            print(f"     -> OLD DATA. Ignored.\n")

# Print the final state of our DB after Night 1
print("=== DATABASE AFTER NIGHT 1 ===")
for gh_key, data in illumination_values_db.items():
    print(f"{gh_key}: {data}")

# VISUALIZE WITH FOLIUM
print("\n--- CREATING VISUALIZATION ---")

# Create map centered on the first point
map_center = [new_readings_night1[0]['lat'], new_readings_night1[0]['lon']]
my_map = folium.Map(location=map_center, zoom_start=18)  # High zoom to see details

# Add title
title_html = '<h3 align="center" style="font-size:16px"><b>LIWANAG: Geohash Clustering Test</b></h3>'
my_map.get_root().html.add_child(folium.Element(title_html))

# Plot all ORIGINAL points in blue
for i, reading in enumerate(new_readings_night1):
    folium.CircleMarker(
        location=[reading['lat'], reading['lon']],
        radius=5,
        color='blue',
        fill=True,
        fillColor='blue',
        fillOpacity=0.7,
        popup=f"Original #{i+1}: Lux={reading['lux']}, Time={reading['timestamp']}"
    ).add_to(my_map)

# Plot the PROCESSED points from database (with geohash clustering) in red
for gh_key, data in illumination_values_db.items():
    color = 'green' if data['lux'] > 20 else 'red' if data['lux'] < 10 else 'orange'
    
    folium.CircleMarker(
        location=[data['lat'], data['lon']],
        radius=8,
        color=color,
        fill=True,
        fillColor=color,
        fillOpacity=0.9,
        popup=f"Processed: Lux={data['lux']}, Geohash={gh_key}, Time={data['timestamp']}"
    ).add_to(my_map)

# Add legend
legend_html = '''
<div style="position: fixed; bottom: 50px; left: 50px; width: 220px; height: 120px; 
            border:2px solid grey; z-index:9999; font-size:14px; background-color:white;">
&nbsp; <b>Legend</b> <br>
&nbsp; <i style="background:blue; width:15px; height:15px; display:inline-block;"></i> &nbsp; Original Raw Points<br>
&nbsp; <i style="background:red; width:15px; height:15px; display:inline-block;"></i> &nbsp; Processed: Poorly-lit<br>
&nbsp; <i style="background:orange; width:15px; height:15px; display:inline-block;"></i> &nbsp; Processed: Moderate<br>
&nbsp; <i style="background:green; width:15px; height:15px; display:inline-block;"></i> &nbsp; Processed: Well-lit<br>
</div>
'''
my_map.get_root().html.add_child(folium.Element(legend_html))

# Save map
my_map.save("geohash_test_map.html")
print("Visualization saved to 'geohash_test_map.html'!")
print("Open this file in your browser to see the results.") 