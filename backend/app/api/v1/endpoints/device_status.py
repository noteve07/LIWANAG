from datetime import datetime
from fastapi import APIRouter, HTTPException

from app.core.database import supabase

router = APIRouter()


@router.get("/device-status/{device_id}")
async def get_device_status(device_id: int):
    """
    Get current status of a specific device.
    """
    try:
        device = supabase.table("sensor_devices").select("*").eq("device_id", device_id).execute()
        
        if not device.data:
            raise HTTPException(status_code=404, detail=f"Device {device_id} not found")
        
        device_info = device.data[0]
        last_seen = datetime.fromisoformat(device_info["last_seen"])
        time_since_last_seen = datetime.now() - last_seen
        
        return {
            "device_id": device_info["device_id"],
            "name": device_info["name"],
            "status": device_info["status"],
            "last_seen": device_info["last_seen"],
            "minutes_since_last_seen": int(time_since_last_seen.total_seconds() / 60),
            "battery_level": device_info.get("battery_level"),
            "data_points_collected": device_info.get("data_points_collected", 0)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print("GET DEVICE STATUS ERROR:\n", error_traceback)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
