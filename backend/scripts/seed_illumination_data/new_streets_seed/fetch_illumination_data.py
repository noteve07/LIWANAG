#!/usr/bin/env python3
"""
Fetch illumination data from Supabase illumination_data table
This script fetches all illumination data and saves it to illumination_data_new.json
"""

import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
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

def fetch_illumination_data():
    """Fetch illumination data from Supabase"""
    try:
        print("🔄 Connecting to Supabase...")
        supabase = create_supabase_client()
        if not supabase:
            return []

        print("Fetching data from 'illumination_data' table...")
        response = supabase.from_('illumination_data').select('*').execute()
        data = response.data
        print(f"✅ Fetched {len(data)} illumination records.")
        
        return data
    except Exception as e:
        print(f"❌ Error fetching illumination data: {e}")
        return []

def save_to_json(data, filename):
    """Save data to a JSON file"""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"✅ Data saved to {filename}")
    except Exception as e:
        print(f"❌ Error saving data to {filename}: {e}")

def main():
    """Main function"""
    print("🔄 Fetching Illumination Data from Supabase")
    print("=" * 50)
    
    illumination_data = fetch_illumination_data()
    if illumination_data:
        save_to_json(illumination_data, 'illumination_data_new.json')
        
        # Display some statistics
        total_points = len(illumination_data)
        unique_streets = len(set(record.get('street_id') for record in illumination_data if record.get('street_id')))
        unique_barangays = len(set(record.get('barangay_id') for record in illumination_data if record.get('barangay_id')))
        
        # Calculate lux statistics
        lux_values = [record.get('lux') for record in illumination_data if record.get('lux') is not None]
        min_lux = min(lux_values) if lux_values else 0
        max_lux = max(lux_values) if lux_values else 0
        avg_lux = sum(lux_values) / len(lux_values) if lux_values else 0
        
        print(f"\n📊 Statistics:")
        print(f"Total illumination points: {total_points}")
        print(f"Unique streets: {unique_streets}")
        print(f"Unique barangays: {unique_barangays}")
        print(f"Lux range: {min_lux} - {max_lux}")
        print(f"Average lux: {avg_lux:.2f}")
        
        # Display sample data
        print("\n📋 Sample Illumination Data:")
        for i, record in enumerate(illumination_data[:3]):
            print(f"  ID: {record.get('id')}, Lat: {record.get('lat')}, Lon: {record.get('lon')}")
            print(f"  Lux: {record.get('lux')}, Street ID: {record.get('street_id')}, Barangay ID: {record.get('barangay_id')}")
            if record.get('geo_hash'):
                print(f"  Geo Hash: {record.get('geo_hash')}")
            if i < len(illumination_data[:3]) - 1:
                print("-" * 30)
    else:
        print("No illumination data fetched.")

if __name__ == "__main__":
    main()
