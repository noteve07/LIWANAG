# fetch_combined_streets.py
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

def fetch_combined_streets():
    try:
        print("🔄 Fetching combined streets data...")
        
        # Fetch from street_wholes table
        whole_response = supabase.table("street_wholes").select("id, name, geometry, total_length").execute()
        street_wholes = whole_response.data
        print(f"✅ Fetched {len(street_wholes)} streets from street_wholes")
        
        # Fetch unnamed streets from streets table
        null_response = supabase.table("streets").select("id, name, linestring, barangay_id").is_("name", "null").execute()
        streets_null = null_response.data
        print(f"✅ Fetched {len(streets_null)} unnamed streets from streets")
        
        # Combine the data
        combined_data = {
            "street_wholes": street_wholes,
            "streets_null": streets_null,
            "metadata": {
                "total_whole_streets": len(street_wholes),
                "total_unnamed_streets": len(streets_null),
                "total_combined": len(street_wholes) + len(streets_null)
            }
        }
        
        # Save to JSON file
        with open("streets_combined.json", "w", encoding="utf-8") as f:
            json.dump(combined_data, f, indent=2, ensure_ascii=False)
        
        print("💾 Combined data saved to streets_combined.json")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    fetch_combined_streets()