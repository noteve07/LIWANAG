from fastapi import APIRouter, HTTPException
from app.core.database import supabase

router = APIRouter()

@router.get("/illumination-data-demo")
async def get_illumination_data_demo():
    """
    Fetch illumination data from the illumination_data_test table for demo purposes
    """
    try:
        # Fetch data from illumination_data_test table
        response = supabase.table('illumination_data_test').select("*").execute()
        
        if not response.data:
            return {"data": [], "count": 0, "message": "No illumination data found"}
        
        # Transform data to match expected frontend format
        illumination_data = []
        for record in response.data:
            # Ensure all required fields are present
            illumination_point = {
                "id": record.get("id"),
                "lat": record.get("lat"),
                "lon": record.get("lon"), 
                "lux": record.get("lux"),
                "street_id": record.get("street_id"),
                "barangay_id": record.get("barangay_id"),
                "sensor": record.get("sensor"),
                "created_at": record.get("created_at")
            }
            illumination_data.append(illumination_point)
        
        return {
            "data": illumination_data,
            "count": len(illumination_data),
            "message": f"Successfully fetched {len(illumination_data)} illumination points from demo dataset"
        }
        
    except Exception as e:
        print(f"Error fetching illumination demo data: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error fetching illumination demo data: {str(e)}"
        )


@router.get("/illumination-data-demo-v2")
async def get_illumination_data_v2():
    """
    Fetch illumination data from the illumination_data_v2 table with enhanced fields
    including classification and road_type
    """
    try:
        # Fetch data from the updated illumination_data_v2 table
        response = supabase.table('illumination_data_v2').select("*").execute()
        
        if not response.data:
            return {"data": [], "count": 0, "message": "No illumination data found in v2 dataset"}
        
        # Transform data to match expected frontend format with added v2 fields
        illumination_data = []
        for record in response.data:
            # Ensure all required fields are present including new v2 fields
            illumination_point = {
                "id": record.get("id"),
                "lat": record.get("lat"),
                "lon": record.get("lon"), 
                "lux": record.get("lux"),
                "street_id": record.get("street_id"),
                "barangay_id": record.get("barangay_id"),
                "sensor": record.get("sensor"),
                "created_at": record.get("created_at"),
                # New v2 fields
                "classification": record.get("classification"),
                "road_type": record.get("road_type")
            }
            illumination_data.append(illumination_point)
        
        return {
            "data": illumination_data,
            "count": len(illumination_data),
            "message": f"Successfully fetched {len(illumination_data)} illumination points from v2 dataset"
        }
        
    except Exception as e:
        print(f"Error fetching illumination v2 data: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error fetching illumination v2 data: {str(e)}"
        )
