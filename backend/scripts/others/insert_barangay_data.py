import json
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# load supabase creds
load_dotenv()
url = os.environ["SUPABASE_URL"]
key = os.environ["SUPABASE_KEY"]
supabase: Client = create_client(url, key)

# read geojson
with open("../src/balanga_barangay.geojson", "r") as f:
    geojson = json.load(f)

# insert features
for feature in geojson["features"]:
    name = feature["properties"].get("name")
    geometry = feature["geometry"] 
    try:
        res = supabase.table("barangays").insert({
            "name": name, 
            "boundary": geometry 
        }).execute()
        print("inserted:", name)
    except Exception as e:
        print("error with", name, e)