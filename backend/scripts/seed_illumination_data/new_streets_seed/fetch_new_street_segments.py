#!/usr/bin/env python3
"""
Fetch current street segments data from Supabase
This script fetches data from the current 'street_segments' table and saves it to street_segments_new.json
"""

import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Supabase configuration from environment variables
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')

def create_supabase_client():
    """Create Supabase client"""
    try:
        if not SUPABASE_URL or not SUPABASE_KEY:
            print("❌ Missing Supabase credentials!")
            print("Please set SUPABASE_URL and SUPABASE_KEY environment variables")
            return None
            
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        return supabase
    except Exception as e:
        print(f"❌ Error creating Supabase client: {e}")
        return None

def fetch_street_segments_data():
    """Fetch street segments data from Supabase"""
    try:
        print("🔄 Connecting to Supabase...")
        supabase = create_supabase_client()
        
        if not supabase:
            return None
            
        print("📊 Fetching street segments data...")
        
        # Fetch all street segments data
        response = supabase.table('street_segments').select('*').execute()
        
        if response.data:
            print(f"✅ Successfully fetched {len(response.data)} street segments")
            
            # Save to JSON file
            output_file = 'street_segments_new.json'
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(response.data, f, indent=2, ensure_ascii=False)
            
            print(f"💾 Data saved to {output_file}")
            
            # Show statistics
            total_segments = len(response.data)
            total_length = sum(segment.get('meters', 0) for segment in response.data if segment.get('meters'))
            
            # Count unique streets and barangays
            unique_streets = set(segment.get('original_street_id') for segment in response.data if segment.get('original_street_id'))
            unique_barangays = set(segment.get('barangay_id') for segment in response.data if segment.get('barangay_id'))
            
            print(f"\n📈 Statistics:")
            print(f"   Total Segments: {total_segments}")
            print(f"   Total Length: {total_length:.2f} meters")
            print(f"   Average Length: {total_length/total_segments:.2f} meters per segment")
            print(f"   Unique Streets: {len(unique_streets)}")
            print(f"   Unique Barangays: {len(unique_barangays)}")
            
            # Show sample data
            if response.data:
                print(f"\n📋 Sample Data:")
                sample = response.data[0]
                print(f"   ID: {sample.get('id')}")
                print(f"   Original Street ID: {sample.get('original_street_id')}")
                print(f"   Street Name: {sample.get('street_name')}")
                print(f"   Barangay ID: {sample.get('barangay_id')}")
                print(f"   Meters: {sample.get('meters')}")
                print(f"   Created: {sample.get('created_at')}")
            
            return response.data
        else:
            print("❌ No street segments data found")
            return None
            
    except Exception as e:
        print(f"❌ Error fetching street segments data: {e}")
        return None

def main():
    """Main function"""
    print("🔄 Fetching Current Street Segments Data")
    print("=" * 50)
    
    data = fetch_street_segments_data()
    
    if data:
        print(f"\n🎉 Successfully fetched and saved {len(data)} street segments!")
        print("📁 File: street_segments_new.json")
    else:
        print("\n❌ Failed to fetch street segments data!")

if __name__ == "__main__":
    main()
