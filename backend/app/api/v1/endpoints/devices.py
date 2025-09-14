from datetime import datetime
from fastapi import APIRouter, HTTPException

from core.database import supabase

router = APIRouter()


@router.get("/devices")
async def get_all_devices():
    """
    Get list of all devices with their current status.
    """
    try:
        devices = supabase.table("sensor_devices").select("*").execute()
        
        device_list = []
        current_time = datetime.now()
        
        for device in devices.data:
            last_seen = datetime.fromisoformat(device["last_seen"])
            time_since_last_seen = current_time - last_seen
            
            device_list.append({
                "device_id": device["device_id"],
                "name": device["name"],
                "status": device["status"],
                "last_seen": device["last_seen"],
                "minutes_since_last_seen": int(time_since_last_seen.total_seconds() / 60),
                "battery_level": device.get("battery_level"),
                "data_points_collected": device.get("data_points_collected", 0)
            })
        
        # Sort by device_id
        device_list.sort(key=lambda x: x["device_id"])
        
        return {
            "total_devices": len(device_list),
            "online_devices": len([d for d in device_list if d["status"] == "online"]),
            "offline_devices": len([d for d in device_list if d["status"] == "offline"]),
            "devices": device_list
        }
        
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print("LIST DEVICES ERROR:\n", error_traceback)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
