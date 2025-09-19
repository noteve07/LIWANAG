import json

def simplify_geojson(input_file, output_file):
    # Load the original GeoJSON
    with open(input_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    simplified_features = []

    for feature in data["features"]:
        name = feature["properties"].get("name")
        geometry = feature["geometry"]

        # Only keep features with a non-null name
        if name:
            simplified_features.append({
                "type": "Feature",
                "properties": {
                    "name": name
                },
                "geometry": geometry
            })

    simplified_geojson = {
        "type": "FeatureCollection",
        "features": simplified_features
    }

    # Save to output file
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(simplified_geojson, f, indent=2)

    print(f"Simplified GeoJSON saved to {output_file}")


# Example usage
simplify_geojson("input.geojson", "output_no_null.geojson")
