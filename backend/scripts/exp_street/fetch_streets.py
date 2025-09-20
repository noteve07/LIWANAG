import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')

def fetch_streets():
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    response = supabase.table('street_wholes') \
        .select('name, geometry, total_length') \
        .execute()
    
    # Convert to GeoJSON format for Leaflet
    geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "name": street["name"],
                    "length": street["total_length"]
                },
                "geometry": street["geometry"]  # ← NO json.loads() needed!
            }
            for street in response.data
        ]
    }
    
    with open('streets.json', 'w') as f:
        json.dump(geojson, f, indent=2)
    
    print("✅ Saved streets.json!")

if __name__ == '__main__':
    fetch_streets()