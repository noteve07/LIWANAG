import folium

# Sample data - This is what you would get from your database (illumination_values table)
# Format: [{'lat': 14.68124, 'lon': 120.53679, 'lux': 5.5}, ...]
list_of_points_from_db = [
    {'lat': 14.68124, 'lon': 120.53679, 'lux': 5.5},   # Poorly-lit
    {'lat': 14.68130, 'lon': 120.53680, 'lux': 0.5},   # Poorly-lit (broken light)
    {'lat': 14.68250, 'lon': 120.53720, 'lux': 15.2},  # Moderately-lit
    {'lat': 14.68260, 'lon': 120.53725, 'lux': 18.7},  # Moderately-lit
    {'lat': 14.68310, 'lon': 120.53800, 'lux': 45.0},  # Well-lit
    {'lat': 14.68315, 'lon': 120.53805, 'lux': 52.3},  # Well-lit
    {'lat': 14.68000, 'lon': 120.53500, 'lux': 3.2},   # Poorly-lit (different area)
    {'lat': 14.68400, 'lon': 120.53900, 'lux': 25.1},  # Well-lit
]

# 1. Create a map centered on Balanga
balanga_coords = [14.682, 120.537]  # Adjusted center to fit our points
my_map = folium.Map(location=balanga_coords, zoom_start=15)

# 2. Add a title to the map
title_html = '''
             <h3 align="center" style="font-size:16px"><b>LIWANAG: Balanga City Street Light Analysis</b></h3>
             '''
my_map.get_root().html.add_child(folium.Element(title_html))

# 3. Create a feature group to hold our markers (optional, but keeps things organized)
feature_group = folium.FeatureGroup(name="Light Readings")

# 4. Plot each point from our database
for point in list_of_points_from_db:
    # Choose color based on lux value
    if point['lux'] > 20:
        color = 'green'  # Well-lit
        status = "Well-lit"
    elif point['lux'] < 10:
        color = 'red'    # Poorly-lit
        status = "Poorly-lit"
    else:
        color = 'orange' # Moderately-lit
        status = "Moderately-lit"
    
    # Create a marker for each point
    folium.CircleMarker(
        location=[point['lat'], point['lon']],
        radius=6,
        color=color,
        weight=1,  # border thickness
        fill=True,
        fillColor=color,
        fillOpacity=0.7,
        popup=f"Lux: {point['lux']} | Status: {status}" # Click to see the value
    ).add_to(feature_group)

# 5. Add the feature group to the map
feature_group.add_to(my_map)

# 6. Add a legend to the map (so we know what the colors mean)
legend_html = '''
<div style="position: fixed; 
            bottom: 50px; left: 50px; width: 150px; height: 90px; 
            border:2px solid grey; z-index:9999; font-size:14px;
            background-color:white;
            ">
&nbsp; <b>Light Intensity</b> <br>
&nbsp; <i style="background:red; width:15px; height:15px; display:inline-block;"></i> &nbsp; Poorly-lit (<10 lux)<br>
&nbsp; <i style="background:orange; width:15px; height:15px; display:inline-block;"></i> &nbsp; Moderate (10-20 lux)<br>
&nbsp; <i style="background:green; width:15px; height:15px; display:inline-block;"></i> &nbsp; Well-lit (>20 lux)<br>
</div>
'''
my_map.get_root().html.add_child(folium.Element(legend_html))

# 7. Save the map to an HTML file and open it
my_map.save("balanga_lights_map.html")
print("Map saved to 'balanga_lights_map.html'! Open this file in your browser to view the interactive map.")