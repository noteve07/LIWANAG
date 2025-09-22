#!/usr/bin/env python3
"""
Update lux values from illumination_data_prev table and save to illumination_data table
This script:
1. Fetches all rows from illumination_data_prev table
2. Converts lux values from 0-1000 range to 0-25 range with 2 decimal places
3. Assigns sensor names based on street_id consistently
4. Saves updated rows to illumination_data table
"""

import os
import random
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Supabase configuration from environment variables
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')

# Sensor names
SENSOR_NAMES = ['Beta', 'Charlie', 'Delta', 'Echo', 'Foxtrot']

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

def convert_lux_value(old_lux):
    """
    Convert lux value from 0-1000 range to 0-25 range with 2 decimal places
    Mapping:
    0-200 -> 0-5
    200-400 -> 6-10
    400-600 -> 11-15
    600-800 -> 16-20
    800-1000 -> 21-25
    """
    # Ensure old_lux is within expected range
    old_lux = max(0, min(1000, old_lux))
    
    if old_lux <= 200:
        # 0-200 -> 0-5
        new_lux = (old_lux / 200) * 5
    elif old_lux <= 400:
        # 200-400 -> 6-10
        new_lux = 5 + ((old_lux - 200) / 200) * 5
    elif old_lux <= 600:
        # 400-600 -> 11-15
        new_lux = 10 + ((old_lux - 400) / 200) * 5
    elif old_lux <= 800:
        # 600-800 -> 16-20
        new_lux = 15 + ((old_lux - 600) / 200) * 5
    else:
        # 800-1000 -> 21-25
        new_lux = 20 + ((old_lux - 800) / 200) * 5
    
    return round(new_lux, 2)

def get_sensor_name_for_street(street_id, street_sensor_map):
    """
    Get consistent sensor name for a street_id
    All points with the same street_id get the same sensor name
    """
    if street_id not in street_sensor_map:
        # Assign a random sensor name for this street_id
        street_sensor_map[street_id] = random.choice(SENSOR_NAMES)
    
    return street_sensor_map[street_id]

def fetch_illumination_data_prev():
    """Fetch all data from illumination_data_prev table"""
    supabase = create_supabase_client()
    if not supabase:
        return None
    
    try:
        print("🔄 Fetching data from illumination_data_prev table...")
        
        # Fetch all data
        response = supabase.table('illumination_data_prev').select('*').execute()
        
        if response.data:
            print(f"✅ Fetched {len(response.data)} rows from illumination_data_prev")
            return response.data
        else:
            print("❌ No data found in illumination_data_prev table")
            return []
            
    except Exception as e:
        print(f"❌ Error fetching data from illumination_data_prev: {e}")
        return None

def process_and_save_data(data):
    """Process the data and save to illumination_data table"""
    supabase = create_supabase_client()
    if not supabase:
        return False
    
    try:
        print("🔄 Processing data and converting lux values...")
        
        # Keep track of sensor assignments per street_id
        street_sensor_map = {}
        processed_data = []
        
        for row in data:
            # Convert lux value
            old_lux = row.get('lux', 0)
            new_lux = convert_lux_value(old_lux)
            
            # Get sensor name for this street_id
            street_id = row.get('street_id')
            sensor_name = get_sensor_name_for_street(street_id, street_sensor_map)
            
            # Create new row with updated lux and sensor
            new_row = {
                'lat': row.get('lat'),
                'lon': row.get('lon'),
                'lux': new_lux,
                'street_id': street_id,
                'barangay_id': row.get('barangay_id'),
                'sensor': sensor_name
            }
            
            processed_data.append(new_row)
        
        print(f"✅ Processed {len(processed_data)} rows")
        print(f"📊 Sensor assignments: {len(street_sensor_map)} unique streets")
        
        # Clear existing data in illumination_data table (optional - comment out if you want to append)
        print("🗑️ Clearing existing data in illumination_data table...")
        delete_response = supabase.table('illumination_data').delete().neq('id', 0).execute()
        print("✅ Cleared existing data")
        
        # Insert new data in batches
        batch_size = 1000
        total_inserted = 0
        
        for i in range(0, len(processed_data), batch_size):
            batch = processed_data[i:i + batch_size]
            
            print(f"🔄 Inserting batch {i//batch_size + 1} ({len(batch)} rows)...")
            
            response = supabase.table('illumination_data').insert(batch).execute()
            
            if response.data:
                total_inserted += len(batch)
                print(f"✅ Inserted batch {i//batch_size + 1} successfully")
            else:
                print(f"❌ Failed to insert batch {i//batch_size + 1}")
                return False
        
        print(f"🎉 Successfully inserted {total_inserted} rows into illumination_data table")
        
        # Print summary of sensor assignments
        print("\n📋 Sensor Assignment Summary:")
        for street_id, sensor in sorted(street_sensor_map.items()):
            count = sum(1 for row in processed_data if row['street_id'] == street_id)
            print(f"  Street ID {street_id}: {sensor} ({count} points)")
        
        return True
        
    except Exception as e:
        print(f"❌ Error processing and saving data: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Starting lux value update process...")
    
    # Step 1: Fetch data from illumination_data_prev
    data = fetch_illumination_data_prev()
    if not data:
        print("❌ Failed to fetch data. Exiting.")
        return False
    
    # Step 2: Process and save data
    success = process_and_save_data(data)
    if success:
        print("🎉 Lux update process completed successfully!")
    else:
        print("❌ Lux update process failed!")
    
    return success

if __name__ == "__main__":
    main()
