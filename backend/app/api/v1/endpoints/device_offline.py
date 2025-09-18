from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from typing import Optional

from app.core.database import supabase
from app.models.sensor_device import DeviceOfflinePayload, DeviceStatus

router = APIRouter()


@router.post("/device-offline")
async def device_offline(payload: DeviceOfflinePayload):
    """
    Called by ESP32 before shutting down or when going offline.
    Updates device status to offline with timestamp and reason.
    """
    if not payload or not payload.device_id:
        raise HTTPException(status_code=400, detail="Device ID is required")
    
    try:
        # Check if device exists
        existing_device = supabase.table("sensor_devices").select("*").eq("device_id", payload.device_id).execute()
        
        if not existing_device.data:
            raise HTTPException(status_code=404, detail=f"Device {payload.device_id} not found")
        
        current_time = datetime.now()
        
        # Update device to offline status
        update_data = {
            "status": DeviceStatus.OFFLINE,
            "last_seen": current_time.isoformat(),
        }
        
        # Update battery level if provided
        if payload.battery_level is not None:
            update_data["battery_level"] = payload.battery_level
        
        response = supabase.table("sensor_devices").update(update_data).eq("device_id", payload.device_id).execute()
        
        print(f"Device {payload.device_id} set to offline")
        return {
            "status": "success",
            "message": f"Device {payload.device_id} marked as offline",
            "device_id": payload.device_id,
            "last_seen": current_time.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print("DEVICE OFFLINE ERROR:\n", error_traceback)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.post("/check-offline-devices")
async def check_offline_devices(timeout_minutes: int = 5):
    """
    Check for devices that haven't been seen for X minutes and mark them offline.
    This can be called periodically by a cron job or manually.
    """
    try:
        cutoff_time = datetime.now() - timedelta(minutes=timeout_minutes)
        
        # Find devices that are online but haven't been seen recently
        stale_devices = supabase.table("sensor_devices").select("*").eq("status", DeviceStatus.ONLINE).lt("last_seen", cutoff_time.isoformat()).execute()
        
        offline_count = 0
        offline_devices = []
        
        for device in stale_devices.data:
            # Mark as offline due to timeout
            supabase.table("sensor_devices").update({
                "status": DeviceStatus.OFFLINE,
            }).eq("device_id", device["device_id"]).execute()
            
            print(f"Device {device['device_id']} ({device['name']}) marked offline due to timeout")
            offline_count += 1
            offline_devices.append({
                "device_id": device["device_id"],
                "name": device["name"],
                "last_seen": device["last_seen"]
            })
        
        return {
            "status": "success",
            "message": f"Checked for stale devices",
            "devices_marked_offline": offline_count,
            "timeout_minutes": timeout_minutes,
            "offline_devices": offline_devices
        }
        
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print("CHECK OFFLINE ERROR:\n", error_traceback)
        raise HTTPException(status_code=500, detail=f"Error checking offline devices: {str(e)}")


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
