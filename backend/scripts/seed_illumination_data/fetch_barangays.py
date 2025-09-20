# fetch_barangays.py
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

def fetch_barangays_data():
    """Fetch all barangays data from Supabase and save to JSON"""
    try:
        print("🔄 Fetching barangays data from Supabase...")
        
        # Fetch all barangays from the barangays table
        response = supabase.table("barangays").select("*").execute()
        barangays_data = response.data
        
        print(f"✅ Fetched {len(barangays_data)} barangays from Supabase")
        
        # Display sample data
        if barangays_data:
            print("\n📋 Sample barangays data:")
            for i, barangay in enumerate(barangays_data[:3]):  # Show first 3 records
                print(f"   {i+1}. ID: {barangay.get('id')}, Name: {barangay.get('name', 'Unnamed')}")
        
        # Save to JSON file
        output_file = "barangays.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(barangays_data, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Barangays data saved to {output_file}")
        
        # Show statistics
        print(f"\n📊 Statistics:")
        print(f"   - Total barangays: {len(barangays_data)}")
        
        if barangays_data:
            # Show available fields
            sample_barangay = barangays_data[0]
            available_fields = list(sample_barangay.keys())
            print(f"   - Available fields: {', '.join(available_fields)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error fetching barangays data: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Starting barangays data fetch...")
    
    if fetch_barangays_data():
        print("🎉 Barangays data fetch completed successfully!")
    else:
        print("❌ Barangays data fetch failed!")
        return False
    
    return True

if __name__ == "__main__":
    main()
