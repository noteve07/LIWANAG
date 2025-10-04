import json
import os
from supabase import create_client
from dotenv import load_dotenv

# load environment variables
load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

supabase = create_client(url, key)

# fetch barangays
response = supabase.table("barangays").select("id, name, geom_geojson").execute()

features = []
for row in response.data:
    features.append({
        "type": "Feature",
        "geometry": json.loads(row["geom_geojson"]),
        "properties": {
            "id": row["id"],
            "name": row["name"]
        }
    })

geojson = {
    "type": "FeatureCollection",
    "features": features
}

with open("barangays.json", "w") as f:
    json.dump(geojson, f, indent=2)

print("✅ Saved barangays.json as FeatureCollection with", len(features), "barangays")
