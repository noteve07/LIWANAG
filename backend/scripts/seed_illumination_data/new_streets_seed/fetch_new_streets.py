#!/usr/bin/env python3
"""
Fetch current streets data from Supabase
This script fetches data from the current 'streets' table and saves it to streets_new.json
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

def fetch_streets_data():
    """Fetch streets data from Supabase"""
    try:
        print("🔄 Connecting to Supabase...")
        supabase = create_supabase_client()
        
        if not supabase:
            return None
            
        print("📊 Fetching streets data...")
        
        # Fetch all streets data
        response = supabase.table('streets').select('*').execute()
        
        if response.data:
            print(f"✅ Successfully fetched {len(response.data)} streets")
            
            # Save to JSON file
            output_file = 'streets_new.json'
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(response.data, f, indent=2, ensure_ascii=False)
            
            print(f"💾 Data saved to {output_file}")
            
            # Show statistics
            total_streets = len(response.data)
            total_length = sum(street.get('meters', 0) for street in response.data if street.get('meters'))
            
            print(f"\n📈 Statistics:")
            print(f"   Total Streets: {total_streets}")
            print(f"   Total Length: {total_length:.2f} meters")
            print(f"   Average Length: {total_length/total_streets:.2f} meters per street")
            
            # Show sample data
            if response.data:
                print(f"\n📋 Sample Data:")
                sample = response.data[0]
                print(f"   ID: {sample.get('id')}")
                print(f"   Name: {sample.get('name')}")
                print(f"   Meters: {sample.get('meters')}")
                print(f"   Created: {sample.get('created_at')}")
            
            return response.data
        else:
            print("❌ No streets data found")
            return None
            
    except Exception as e:
        print(f"❌ Error fetching streets data: {e}")
        return None

def main():
    """Main function"""
    print("🔄 Fetching Current Streets Data")
    print("=" * 50)
    
    data = fetch_streets_data()
    
    if data:
        print(f"\n🎉 Successfully fetched and saved {len(data)} streets!")
        print("📁 File: streets_new.json")
    else:
        print("\n❌ Failed to fetch streets data!")

if __name__ == "__main__":
    main()
