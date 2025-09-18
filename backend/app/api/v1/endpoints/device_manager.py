# app/api/v1/endpoints/device_manager.py
# - /devices
# - /device-status/{device_id}
# - /check-offline-devices

from datetime import datetime, timedelta    
from fastapi import APIRouter, HTTPException

from app.core.database import supabase
from app.models.sensor_device import DeviceStatus

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
