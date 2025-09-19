import json
from supabase import create_client, Client
from shapely.geometry import LineString

# --- Supabase connection ---
url = "https://uutyoqzsakmpzbkgooxt.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1dHlvcXpzYWttcHpia2dvb3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NzYwOTgsImV4cCI6MjA3MzM1MjA5OH0.w-vFYJhLleZ4RMrXEU3R6kU9l09qr63v_teQEfmI1nM"  # use service role key for inserting
supabase: Client = create_client(url, key)

# --- Load GeoJSON ---
with open("add_to_supabase.geojson", "r", encoding="utf-8") as f:
    data = json.load(f)

# --- Loop over features ---
i = 1
for feature in data["features"]:
    name = feature["properties"].get("name")
    coords = feature["geometry"]["coordinates"]
    print(f"Inserting ({i}): {name}...")

    # Convert coords to LineString
    line = LineString(coords)

    # WKT representation for PostGIS
    linestring_wkt = line.wkt  # e.g. "LINESTRING(120.54 14.68, 120.54 14.69)"

    # Approximate meters length (using shapely length in degrees is wrong, so you’d usually handle this in PostGIS)
    # -> Better: let PostGIS compute it on insert with ST_Length(ST_GeogFromText(...))
    # For now we just send null, then compute inside SQL if needed
    meters = None

    # Insert into Supabase
    supabase.table("streets").insert({
        "name": name,
        "meters": meters,
        "linestring": linestring_wkt,
        "barangay_id": None
    }).execute()
    print(f"Inserted ({i}): {name}")
    i += 1

print("✅ Done inserting features into Supabase")
