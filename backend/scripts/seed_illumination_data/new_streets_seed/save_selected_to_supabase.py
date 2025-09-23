#!/usr/bin/env python3
"""
Save selected points to Supabase illumination_data_test table
This script reads selected_points.json and inserts the points into the illumination_data_test table
"""

import os
import json
import sys
from datetime import datetime
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

def load_selected_points(filename='selected_points.json'):
    """Load selected points from JSON file"""
    try:
        if not os.path.exists(filename):
            print(f"❌ File {filename} not found!")
            return None
            
        with open(filename, 'r') as f:
            data = json.load(f)
            
        # Handle different JSON structures
        if 'points' in data:
            return data['points'], data.get('metadata', {})
        elif isinstance(data, list):
            return data, {}
        else:
            print("❌ Invalid JSON format - expected 'points' array or direct array")
            return None, None
            
    except Exception as e:
        print(f"❌ Error loading selected points: {e}")
        return None, None

def convert_lux_to_0_25_range(lux_value):
    """Convert lux value from 0-1000 range to 0-25 range with 2 decimal places"""
    # Ensure lux is within 0-1000 range
    lux_clamped = max(0, min(1000, lux_value))
    
    # Convert to 0-25 range
    converted_lux = (lux_clamped / 1000) * 25
    
    # Round to 2 decimal places
    return round(converted_lux, 2)

def prepare_records_for_supabase(points, metadata=None):
    """Prepare selected points for Supabase insertion"""
    records = []
    
    for i, point in enumerate(points):
        # Convert lux from 0-1000 range to 0-25 range
        original_lux = float(point['lux'])
        converted_lux = convert_lux_to_0_25_range(original_lux)
        
        # Create record with basic fields for illumination_data_test table
        record = {
            'lat': float(point['lat']),
            'lon': float(point['lon']),
            'lux': converted_lux,  # Use converted lux value
            'street_id': 0,  # Set to 0 as requested
            'barangay_id': 16,  # San Jose barangay ID
            'sensor': f'Alpha_{i+1}',  # Generate sensor name like Alpha_1, Alpha_2, etc.
        }
        
        records.append(record)
    
    return records

def check_table_exists(supabase, table_name='illumination_data_test'):
    """Check if the target table exists"""
    try:
        # Try a simple select query to check if table exists
        response = supabase.from_(table_name).select('id').limit(1).execute()
        return True
    except Exception as e:
        print(f"⚠️  Warning: Could not verify table '{table_name}' exists: {e}")
        return False

def insert_selected_points(filename='selected_points.json', table_name='illumination_data_test'):
    """Insert selected points into Supabase illumination_data_test table"""
    print("🔄 Starting selected points insertion process...")
    print(f"📁 Loading from: {filename}")
    print(f"📊 Target table: {table_name}")
    
    # Load selected points
    points, metadata = load_selected_points(filename)
    if not points:
        print("❌ No points data found!")
        return False
    
    print(f"📊 Loaded {len(points)} selected points")
    if metadata:
        print(f"📋 Export metadata: {metadata.get('exported_by', 'Unknown')} at {metadata.get('exported_at', 'Unknown')}")
    
    # Create Supabase client
    print("🔄 Connecting to Supabase...")
    supabase = create_supabase_client()
    if not supabase:
        return False
    
    # Check if table exists
    print(f"🔍 Checking if table '{table_name}' exists...")
    if check_table_exists(supabase, table_name):
        print(f"✅ Table '{table_name}' is accessible")
    else:
        print(f"⚠️  Warning: Could not verify table '{table_name}' - proceeding anyway")
    
    # Prepare records for insertion
    print("🔄 Preparing records for insertion...")
    records = prepare_records_for_supabase(points, metadata)
    
    # Insert in batches (smaller batches for selected points)
    batch_size = 100
    total_inserted = 0
    total_failed = 0
    total_batches = (len(records) + batch_size - 1) // batch_size
    
    print(f"🔄 Inserting {len(records)} records in {total_batches} batches...")
    
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        
        try:
            print(f"   📤 Inserting batch {batch_num}/{total_batches} ({len(batch)} records)...")
            
            response = supabase.from_(table_name).insert(batch).execute()
            
            if response.data:
                batch_inserted = len(response.data)
                total_inserted += batch_inserted
                print(f"   ✅ Batch {batch_num} inserted successfully ({batch_inserted} records)")
            else:
                total_failed += len(batch)
                print(f"   ❌ Batch {batch_num} failed to insert - no data returned")
                
        except Exception as e:
            total_failed += len(batch)
            print(f"   ❌ Error inserting batch {batch_num}: {e}")
            continue
    
    # Print summary
    print(f"\n📈 Insertion Summary:")
    print(f"   📁 Source file: {filename}")
    print(f"   📊 Table: {table_name}")
    print(f"   📋 Total records processed: {len(records)}")
    print(f"   ✅ Successfully inserted: {total_inserted}")
    print(f"   ❌ Failed: {total_failed}")
    
    if total_inserted > 0:
        print(f"\n🎉 Successfully saved {total_inserted} selected points to Supabase!")
        
        # Show sample of inserted data
        print(f"\n📋 Sample of inserted data:")
        for i, record in enumerate(records[:3]):
            original_point = points[i]
            print(f"   Point {i+1}: Sensor={record['sensor']}, Lat={record['lat']}, Lon={record['lon']}")
            print(f"            Original Lux={original_point['lux']} -> Converted Lux={record['lux']}")
        
        return True
    else:
        print(f"\n❌ No points were inserted successfully!")
        return False

def main():
    """Main function"""
    # Check if custom filename provided
    filename = 'selected_points.json'
    table_name = 'illumination_data_test'
    
    if len(sys.argv) > 1:
        filename = sys.argv[1]
        print(f"📁 Using custom filename: {filename}")
    
    if len(sys.argv) > 2:
        table_name = sys.argv[2]
        print(f"📊 Using custom table: {table_name}")
    
    print("🎯 Selected Points to Supabase Uploader")
    print("=" * 50)
    
    success = insert_selected_points(filename, table_name)
    
    if success:
        print("\n✅ Process completed successfully!")
        exit(0)
    else:
        print("\n❌ Process failed!")
        exit(1)

if __name__ == "__main__":
    main()
