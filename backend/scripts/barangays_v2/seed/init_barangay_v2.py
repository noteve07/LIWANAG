import json
from shapely.geometry import shape, Polygon, MultiPolygon
from supabase import create_client
from dotenv import load_dotenv
import os

# load environment variables
load_dotenv()
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# load geojson file
with open("barangays_geojsonio.json", "r", encoding="utf-8") as f:
    geojson_data = json.load(f)

# group features by id
barangay_dict = {}
for feature in geojson_data["features"]:
    props = feature.get("properties", {})
    bid = props.get("id")
    name = props.get("name")

    if not bid or not name:
        continue

    geom = shape(feature["geometry"])

    if bid not in barangay_dict:
        barangay_dict[bid] = {"name": name, "geoms": []}

    barangay_dict[bid]["geoms"].append(geom)

# insert/upsert into supabase
for bid, data in barangay_dict.items():
    name = data["name"]
    geoms = data["geoms"]

    # always force multipolygon
    polygons = []
    for g in geoms:
        if isinstance(g, Polygon):
            polygons.append(g)
        elif isinstance(g, MultiPolygon):
            polygons.extend([p for p in g.geoms])

    multipoly = MultiPolygon(polygons)

    # shapely multipolygon -> geojson string
    geom_geojson = json.dumps(multipoly.__geo_interface__)

    # upsert into supabase
    supabase.table("barangays_v2").upsert({
        "id": bid,
        "name": name,
        "boundary": geom_geojson
    }).execute()

print("✅ Barangays inserted/updated as MultiPolygons.")
