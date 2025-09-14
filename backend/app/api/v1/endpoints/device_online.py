from datetime import datetime
from fastapi import APIRouter, HTTPException

from core.database import supabase
from models.sensor_device import SensorDevice, DeviceOnlinePayload, DeviceStatus

router = APIRouter()


@router.post("/device-online")
async def device_online(payload: DeviceOnlinePayload):
    """
    Called by ESP32 when it connects to WiFi.
    ESP32 only needs to send: device_id, name, and optionally battery_level.
    Backend handles: timestamps, status, data_points_collected initialization.
    
    If device_id doesn't exist in Supabase, adds it.
    If device_id exists, updates its status to online and last_seen timestamp.
    """
    if not payload or not payload.device_id:
        raise HTTPException(status_code=400, detail="Device ID is required")
    
    try:
        # Check if device already exists in Supabase
        existing_device = supabase.table("sensor_devices").select("*").eq("device_id", payload.device_id).execute()
        
        current_time = datetime.now()
        
        if existing_device.data:
            # Device exists - update status to online, last_seen, and optionally battery_level
            update_data = {
                "status": DeviceStatus.ONLINE,
                "last_seen": current_time.isoformat()
            }
            
            # Update battery level if provided
            if payload.battery_level is not None:
                update_data["battery_level"] = payload.battery_level
            
            response = supabase.table("sensor_devices").update(update_data).eq("device_id", payload.device_id).execute()
            
            print(f"Device {payload.device_id} status updated to online")
            return {
                "status": "success", 
                "message": f"Device {payload.device_id} status updated to online",
                "action": "updated",
                "device_id": payload.device_id,
                "last_seen": current_time.isoformat()
            }
        else:
            # Device doesn't exist - create new SensorDevice and add to database
            new_device = SensorDevice(
                device_id=payload.device_id,
                name=payload.name,
                status=DeviceStatus.ONLINE,
                last_seen=current_time,
                installed_at=current_time,
                battery_level=payload.battery_level,
                data_points_collected=0
            )
            
            # Convert to dict for Supabase insertion with proper serialization
            device_dict = new_device.model_dump()
            device_dict["last_seen"] = device_dict["last_seen"].isoformat()
            device_dict["installed_at"] = device_dict["installed_at"].isoformat()
            
            response = supabase.table("sensor_devices").insert(device_dict).execute()
            
            print(f"New device {payload.device_id} added to database")
            return {
                "status": "success", 
                "message": f"Device {payload.device_id} added to database and set online",
                "action": "created",
                "device_id": payload.device_id,
                "installed_date": current_time.isoformat(),
                "device_data": response.data[0] if response.data else None
            }
            
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print("DEVICE ONLINE ERROR:\n", error_traceback)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

