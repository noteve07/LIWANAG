from fastapi import APIRouter, HTTPException
from core.database import supabase

router = APIRouter()

@router.get("/check-supabase")
async def check_supabase():
    try:
        data = supabase.table('sensor_data').select("*").execute()
        print("MY LOG:", data)
        return {"data": data.data, "count": data.count}
    except Exception as e:
        print(f"Error fetching data: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")
