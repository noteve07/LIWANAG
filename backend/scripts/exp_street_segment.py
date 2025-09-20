# generate_geodata.py
import os
import json
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase = create_client(url, key)

def fetch_data_and_save():
    try:
        print("Fetching data from Supabase...")
        
        # Fetch barangays data
        barangays_response = supabase.table("barangays").select("id, name, boundary").execute()
        barangays = barangays_response.data
        print(f"Fetched {len(barangays)} barangays")
        
        # Fetch street segments data
        streets_response = supabase.table("street_segments").select("id, street_name, barangay_id, segment_geom").execute()
        street_segments = streets_response.data
        print(f"Fetched {len(street_segments)} street segments")
        
        # Save to JSON files
        with open("barangays.json", "w") as f:
            json.dump(barangays, f, indent=2)
        
        with open("street_segments.json", "w") as f:
            json.dump(street_segments, f, indent=2)
        
        print("Data saved to barangays.json and street_segments.json")
        
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    fetch_data_and_save()