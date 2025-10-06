import asyncio
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(
    os.environ.get("SUPABASE_URL"),
    os.environ.get("SUPABASE_KEY")
)

async def recreate_street_segments():
    """Completely recreate street_segments_v2 from scratch"""
    
    print("🔄 Recreating street_segments_v2 from scratch...")
    
    try:
        # Step 1: Clear existing data
        supabase.table("street_segments_v2").delete().neq("id", 0).execute()
        print("✅ Cleared existing segments")
        
        # Step 2: Run the PostGIS intersection query
        create_query = """
        INSERT INTO street_segments_v2 (street_name, barangay_id, segment_geom, segment_length, original_street_id)
        SELECT 
            s.name as street_name,
            b.id as barangay_id,
            ST_Intersection(s.geometry, b.boundary) as segment_geom,
            ST_Length(ST_Intersection(s.geometry, b.boundary)) as segment_length,
            s.id as original_street_id
        FROM streets s
        CROSS JOIN barangays_v2 b
        WHERE ST_Intersects(s.geometry, b.boundary)
          AND ST_Length(ST_Intersection(s.geometry, b.boundary)) > 0;
        """
        
        result = supabase.rpc('exec_sql', {'query': create_query}).execute()
        print("✅ Created street segments via PostGIS intersection")
        
        # Step 3: Add road categories
        category_query = """
        UPDATE street_segments_v2 ss
        SET road_category = s.road_category
        FROM streets s
        WHERE ss.original_street_id = s.id;
        """
        
        result = supabase.rpc('exec_sql', {'query': category_query}).execute()
        print("✅ Added road categories")
        
        # Step 4: Verify
        count_result = supabase.table("street_segments_v2").select("id", count="exact").execute()
        print(f"✅ Created {count_result.count} street segments")
        
    except Exception as e:
        print(f"💥 Error: {e}")

async def main():
    await recreate_street_segments()

if __name__ == "__main__":
    asyncio.run(main())