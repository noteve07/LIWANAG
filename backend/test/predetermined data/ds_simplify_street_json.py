import json

# Read the GeoJSON file
with open('input.geojson', 'r') as f:
    data = json.load(f)

# Simplify each feature
simplified_features = []
for feature in data['features']:
    # Keep only the essential properties
    simplified_properties = {
        'name': feature['properties'].get('name'),
        'highway': feature['properties'].get('highway'),
        'osm_id': feature['properties'].get('osm_id')
    }
    
    # Remove None values
    simplified_properties = {k: v for k, v in simplified_properties.items() if v is not None}
    
    # Create simplified feature
    simplified_feature = {
        'type': 'Feature',
        'properties': simplified_properties,
        'geometry': feature['geometry']
    }
    simplified_features.append(simplified_feature)

# Create the simplified GeoJSON
simplified_geojson = {
    'type': 'FeatureCollection',
    'features': simplified_features
}

# Save the simplified GeoJSON
with open('simplified_output.geojson', 'w') as f:
    json.dump(simplified_geojson, f, indent=2)

print("GeoJSON simplified and saved as 'simplified_output.geojson'")