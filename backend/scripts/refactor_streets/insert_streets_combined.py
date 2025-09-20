# insert_streets_combined.py
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

def load_and_insert_data():
    """Load data from streets_combined.json and insert into Supabase"""
    try:
        print("🔄 Loading data from streets_combined.json...")
        
        # Load JSON data
        with open('streets_combined.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"📊 Found {len(data['street_wholes'])} whole streets")
        print(f"📊 Found {len(data['streets_null'])} unnamed streets")
        
        # Prepare data for insertion
        combined_data = []
        
        # Process street_wholes
        for street in data['street_wholes']:
            combined_data.append({
                'name': street.get('name'),
                'meters': street.get('total_length'),
                'geometry': street['geometry']
            })
        
        # Process streets_null
        for street in data['streets_null']:
            # Convert linestring to geometry format
            geometry = {
                'type': 'MultiLineString',
                'coordinates': [street['linestring']['coordinates']],
                'crs': street['linestring'].get('crs', {
                    'type': 'name',
                    'properties': {'name': 'EPSG:4326'}
                })
            }
            
            combined_data.append({
                'name': street.get('name'),
                'meters': None,  # No meters for unnamed streets
                'geometry': geometry
            })
        
        print(f"📝 Prepared {len(combined_data)} records for insertion")
        
        # Insert data in batches
        batch_size = 100
        total_inserted = 0
        
        for i in range(0, len(combined_data), batch_size):
            batch = combined_data[i:i + batch_size]
            
            try:
                result = supabase.table('streets_combined').insert(batch).execute()
                total_inserted += len(batch)
                print(f"✅ Inserted batch {i//batch_size + 1}: {len(batch)} records")
                
            except Exception as e:
                print(f"⚠️  Error inserting batch {i//batch_size + 1}: {e}")
                # Try inserting one by one to identify problematic records
                for record in batch:
                    try:
                        supabase.table('streets_combined').insert(record).execute()
                        total_inserted += 1
                    except Exception as single_error:
                        print(f"❌ Failed to insert record: {record.get('name', 'Unnamed')} - {single_error}")
        
        print(f"🎉 Successfully inserted {total_inserted} records into streets_combined table")
        return True
        
    except Exception as e:
        print(f"❌ Error loading and inserting data: {e}")
        return False

def verify_data():
    """Verify the inserted data"""
    try:
        print("🔍 Verifying inserted data...")
        
        # Count total records
        total_count = supabase.table('streets_combined').select('id', count='exact').execute()
        
        # Count records with names vs unnamed
        named_count = supabase.table('streets_combined').select('id', count='exact').not_.is_('name', 'null').execute()
        unnamed_count = supabase.table('streets_combined').select('id', count='exact').is_('name', 'null').execute()
        
        print(f"📊 Total records: {total_count.count}")
        print(f"📊 Named streets: {named_count.count}")
        print(f"📊 Unnamed streets: {unnamed_count.count}")
        
        # Show sample records
        sample_named = supabase.table('streets_combined').select('name, meters').not_.is_('name', 'null').limit(3).execute()
        sample_unnamed = supabase.table('streets_combined').select('name, meters').is_('name', 'null').limit(3).execute()
        
        print("\n📋 Sample named streets:")
        for record in sample_named.data:
            print(f"   - {record['name']} (Length: {record['meters']}m)")
        
        print("\n📋 Sample unnamed streets:")
        for record in sample_unnamed.data:
            print(f"   - Unnamed (Length: {record['meters']}m)")
        
        return True
        
    except Exception as e:
        print(f"❌ Error verifying data: {e}")
        return False

def main():
    """Main function to insert data"""
    print("🚀 Starting streets_combined data insertion...")
    
    # Step 1: Insert data
    if not load_and_insert_data():
        print("❌ Failed to insert data. Exiting.")
        return False
    
    # Step 2: Verify data
    if not verify_data():
        print("❌ Failed to verify data.")
        return False
    
    print("🎉 All operations completed successfully!")
    return True

if __name__ == "__main__":
    main()
