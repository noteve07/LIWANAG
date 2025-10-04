# fetch_streets_duplicate.py

import os
import json
from dotenv import load_dotenv
from supabase import create_client

# load env vars
load_dotenv()
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

def fetch_streets():
    resp = supabase.table("streets_duplicate").select(
        "id,name,meters,road_category,created_at,geom_geojson"
    ).execute()
    return resp.data

def save_geojson(rows, out_file="streets_duplicate.geojson"):
    features = []
    for row in rows:
        if row["geom_geojson"]:
            features.append({
                "type": "Feature",
                "geometry": row["geom_geojson"],
                "properties": {
                    "id": row["id"],
                    "name": row["name"],
                    "meters": row["meters"],
                    "road_category": row["road_category"],
                    "created_at": row["created_at"]
                }
            })
    geojson = {
        "type": "FeatureCollection",
        "features": features
    }
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(geojson, f, indent=2)

if __name__ == "__main__":
    streets = fetch_streets()
    save_geojson(streets)
    print("✅ saved to streets_duplicate.geojson")
