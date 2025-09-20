# fetch_street_segments.py
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

def fetch_street_segments_data():
    """Fetch all street segments data from Supabase and save to JSON"""
    try:
        print("🔄 Fetching street segments data from Supabase...")
        
        # Fetch all street segments from the street_segments table
        response = supabase.table("street_segments").select("*").execute()
        street_segments_data = response.data
        
        print(f"✅ Fetched {len(street_segments_data)} street segments from Supabase")
        
        # Display sample data
        if street_segments_data:
            print("\n📋 Sample street segments data:")
            for i, segment in enumerate(street_segments_data[:3]):  # Show first 3 records
                print(f"   {i+1}. ID: {segment.get('id')}, Street ID: {segment.get('street_id')}, Barangay ID: {segment.get('barangay_id')}")
        
        # Save to JSON file
        output_file = "street_segments.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(street_segments_data, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Street segments data saved to {output_file}")
        
        # Show statistics
        print(f"\n📊 Statistics:")
        print(f"   - Total street segments: {len(street_segments_data)}")
        
        if street_segments_data:
            # Show available fields
            sample_segment = street_segments_data[0]
            available_fields = list(sample_segment.keys())
            print(f"   - Available fields: {', '.join(available_fields)}")
            
            # Show unique street IDs and barangay IDs
            unique_street_ids = set(segment.get('street_id') for segment in street_segments_data if segment.get('street_id'))
            unique_barangay_ids = set(segment.get('barangay_id') for segment in street_segments_data if segment.get('barangay_id'))
            
            print(f"   - Unique street IDs: {len(unique_street_ids)}")
            print(f"   - Unique barangay IDs: {len(unique_barangay_ids)}")
            
            # Show relationship analysis
            if unique_street_ids and unique_barangay_ids:
                print(f"\n🔗 Relationship Analysis:")
                print(f"   - Streets with segments: {len(unique_street_ids)}")
                print(f"   - Barangays with segments: {len(unique_barangay_ids)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error fetching street segments data: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Starting street segments data fetch...")
    
    if fetch_street_segments_data():
        print("🎉 Street segments data fetch completed successfully!")
    else:
        print("❌ Street segments data fetch failed!")
        return False
    
    return True

if __name__ == "__main__":
    main()
