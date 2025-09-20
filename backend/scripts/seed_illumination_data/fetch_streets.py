# fetch_streets.py
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
    """Fetch all streets data from Supabase and save to JSON"""
    try:
        print("🔄 Fetching streets data from Supabase...")
        
        # Fetch all streets from the streets table
        response = supabase.table("streets").select("*").execute()
        streets_data = response.data
        
        print(f"✅ Fetched {len(streets_data)} streets from Supabase")
        
        # Display sample data
        if streets_data:
            print("\n📋 Sample streets data:")
            for i, street in enumerate(streets_data[:3]):  # Show first 3 records
                print(f"   {i+1}. ID: {street.get('id')}, Name: {street.get('name', 'Unnamed')}, Meters: {street.get('meters')}")
        
        # Save to JSON file
        output_file = "streets.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(streets_data, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Streets data saved to {output_file}")
        
        # Show statistics
        named_streets = [s for s in streets_data if s.get('name')]
        unnamed_streets = [s for s in streets_data if not s.get('name')]
        
        print(f"\n📊 Statistics:")
        print(f"   - Total streets: {len(streets_data)}")
        print(f"   - Named streets: {len(named_streets)}")
        print(f"   - Unnamed streets: {len(unnamed_streets)}")
        
        if streets_data:
            total_meters = sum(s.get('meters', 0) for s in streets_data if s.get('meters'))
            print(f"   - Total length: {total_meters:.2f} meters")
            print(f"   - Average length: {total_meters/len(streets_data):.2f} meters")
        
        return True
        
    except Exception as e:
        print(f"❌ Error fetching streets data: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Starting streets data fetch...")
    
    if fetch_streets_data():
        print("🎉 Streets data fetch completed successfully!")
    else:
        print("❌ Streets data fetch failed!")
        return False
    
    return True

if __name__ == "__main__":
    main()
