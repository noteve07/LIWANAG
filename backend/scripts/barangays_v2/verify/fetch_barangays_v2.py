import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

# load env
load_dotenv()
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# fetch all barangays
response = supabase.table("barangays_v2").select("*").execute()

features = []
for row in response.data:
    geom = row.get("geom_geojson")
    if not geom:
        continue

    # parse string into dict if necessary
    if isinstance(geom, str):
        geom = json.loads(geom)

    feature = {
        "type": "Feature",
        "geometry": geom,  # now proper dict
        "properties": {
            "id": row.get("id"),
            "name": row.get("name"),
        }
    }
    features.append(feature)

geojson = {
    "type": "FeatureCollection",
    "features": features
}

with open("fetched_barangays_v2.json", "w", encoding="utf-8") as f:
    json.dump(geojson, f, ensure_ascii=False, indent=2)

print("✅ saved fetched_barangays_v2.json (with proper geometry objects)")
