# generate_streets_data.py
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

def fetch_streets_data():
    try:
        print("Fetching streets data from Supabase...")
        
        # Fetch streets with barangay information
        response = supabase.table("streets").select("""
            id, 
            name, 
            linestring,
            barangay_id,
            barangays(name)
        """).execute()
        
        streets = response.data
        print(f"Fetched {len(streets)} streets")
        
        # Save to JSON file
        with open("streets_raw.json", "w") as f:
            json.dump(streets, f, indent=2)
        
        print("Data saved to streets.json")
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    fetch_streets_data()