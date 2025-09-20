import os
import json
from supabase import create_client, Client
from shapely.geometry import LineString


# supabase credentials
url = os.environ.get('SUPABASE_URL')
key = os.environ.get('SUPABASE_KEY')

supabase: Client = create_client(url, key)

# load geojson
with open("balanga_streets.geojson", "r", encoding="utf-8") as f:
    data = json.load(f)


i = 1
for feature in data["features"]:
    name = feature["properties"].get("name")
    coords = feature["geometry"]["coordinates"]
    print(f"Inserting ({i}): {name}...")

    # convert coords to LineString
    line = LineString(coords)

    # wkt representation for PostGIS
    linestring_wkt = line.wkt
    meters = None

    # unsert into Supabase
    supabase.table("streets").insert({
        "name": name,
        "meters": meters,
        "linestring": linestring_wkt,
        "barangay_id": None
    }).execute()
    print(f"Inserted ({i}): {name}")
    i += 1

print("Done inserting features into Supabase")
