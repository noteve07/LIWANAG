#!/usr/bin/env python3
"""
Insert illumination data into Supabase illumination_data_test table
This script reads illumination_data.json and inserts it into the database
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

def load_illumination_data():
    """Load illumination data from JSON file"""
    try:
        with open('illumination_data.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        return data.get('illumination_data', [])
    except Exception as e:
        print(f"❌ Error loading illumination_data.json: {e}")
        return []

def prepare_illumination_records(illumination_data):
    """Prepare illumination data for database insertion"""
    records = []
    
    for point in illumination_data:
        record = {
            'lat': point['lat'],
            'lon': point['lon'],
            'lux': int(round(point['lux'])),  # Convert to integer
            'street_id': point['street_id'],
            'barangay_id': point['barangay_id'],
            'geo_hash': None  # Set geo_hash to null
        }
        records.append(record)
    
    return records

def insert_illumination_data():
    """Insert illumination data into Supabase"""
    print("🔄 Loading illumination data...")
    
    # Load illumination data
    illumination_data = load_illumination_data()
    if not illumination_data:
        print("❌ No illumination data found!")
        return False
    
    print(f"📊 Loaded {len(illumination_data)} illumination points")
    
    # Create Supabase client
    print("🔄 Connecting to Supabase...")
    supabase = create_supabase_client()
    if not supabase:
        return False
    
    # Prepare records for insertion
    print("🔄 Preparing records for insertion...")
    records = prepare_illumination_records(illumination_data)
    
    # Insert in batches
    batch_size = 1000
    total_inserted = 0
    total_batches = (len(records) + batch_size - 1) // batch_size
    
    print(f"🔄 Inserting {len(records)} records in {total_batches} batches...")
    
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        
        try:
            print(f"   Inserting batch {batch_num}/{total_batches} ({len(batch)} records)...")
            
            response = supabase.from_('illumination_data_test').insert(batch).execute()
            
            if response.data:
                total_inserted += len(batch)
                print(f"   ✅ Batch {batch_num} inserted successfully")
            else:
                print(f"   ❌ Batch {batch_num} failed to insert")
                
        except Exception as e:
            print(f"   ❌ Error inserting batch {batch_num}: {e}")
            continue
    
    print(f"\n📈 Insertion Summary:")
    print(f"   Total records processed: {len(records)}")
    print(f"   Successfully inserted: {total_inserted}")
    print(f"   Failed: {len(records) - total_inserted}")
    
    if total_inserted > 0:
        print(f"\n✅ Successfully inserted {total_inserted} illumination points into 'illumination_data_test' table!")
        
        # Verify insertion
        try:
            print("🔄 Verifying insertion...")
            verify_response = supabase.from_('illumination_data_test').select('*', count='exact').limit(5).execute()
            
            if verify_response.data:
                print(f"✅ Verification successful! Found {verify_response.count} total records in table")
                print("📋 Sample records:")
                for i, record in enumerate(verify_response.data[:3]):
                    print(f"   {i+1}. Lat: {record['lat']}, Lon: {record['lon']}, Lux: {record['lux']}, Street: {record['street_id']}, Barangay: {record['barangay_id']}")
            else:
                print("⚠️  Could not verify insertion")
                
        except Exception as e:
            print(f"⚠️  Verification failed: {e}")
        
        return True
    else:
        print("❌ No records were inserted!")
        return False

def main():
    """Main function"""
    print("🔄 Inserting Illumination Data into Supabase")
    print("=" * 50)
    
    try:
        success = insert_illumination_data()
        
        if success:
            print(f"\n🎉 Illumination data insertion completed!")
        else:
            print(f"\n❌ Illumination data insertion failed!")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
