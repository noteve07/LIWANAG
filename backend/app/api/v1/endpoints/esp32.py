# app/api/v1/endpoints/esp32.py
# - /sensor-data
# - /device-online
# - /device-offline

from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException

from app.core.database import supabase
from app.models.sensor_data import (
    SensorData,
    SensorDemo,
    SensorDemoBatchPayload,
)
from app.models.sensor_device import DeviceOfflinePayload, SensorDevice, DeviceOnlinePayload, DeviceStatus
from pydantic import BaseModel
from shapely.geometry import Point

from app.services.geospatial import (
    classify_lux,
    degrees_to_meters,
    determine_barangay,
    determine_nearest_street,
)

router = APIRouter()


# Mission control models
class MissionControlPayload(BaseModel):
    device_id: int
    on_mission: bool

# Bulk data models
class BulkDataItem(BaseModel):
    lat: float
    lon: float
    lux: float
    sensor: str = "Alpha"

class BulkDataPayload(BaseModel):
    device_id: int
    data: list[BulkDataItem]



@router.post("/sensor-data")
async def receive_sensor_data(data: SensorData):
    """
    Receives data from an ESP32 sensor unit.
    Stores the data in Supabase database.
    """
    try: 
        print(f"RECEIVED DATA: {data}")

        point = Point(data.lon, data.lat)

        barangay_record = determine_barangay(point)
        street_info = determine_nearest_street(point)

        barangay_id = barangay_record.get("id") if barangay_record else None
        barangay_name = barangay_record.get("name") if barangay_record else None

        street_record = street_info[0] if street_info else None
        street_distance = street_info[1] if street_info else None
        street_id = street_record.get("id") if street_record else None
        street_name = street_record.get("name") if street_record else None
        road_category = (street_record or {}).get("road_category") or "residential"

        classification = classify_lux(road_category, data.lux)

        print(
            "Resolved Barangay:",
            f"{barangay_name or 'Unknown'} (ID: {barangay_id or 'N/A'})",
        )

        if street_record and street_distance is not None:
            approx_distance = degrees_to_meters(street_distance, data.lat)
            print(
                "Resolved Street:",
                f"{street_name or '<unnamed>'} (ID: {street_id})",
                f"~{approx_distance:.2f} m away",
            )
        else:
            print("Resolved Street: None found")

        print(f"Road Category: {road_category}")
        print(f"Lux Classification: {classification}")

        timestamp = data.timestamp
        if timestamp.tzinfo is not None:
            timestamp = timestamp.replace(tzinfo=None)

        timestamp_iso = timestamp.isoformat()
        uploaded_at_iso = datetime.now().isoformat()

        record = {
            "lat": data.lat,
            "lon": data.lon,
            "lux": int(data.lux),
            "sensor_name": data.sensor_name,
            "timestamp": timestamp_iso,
            "uploaded_at": uploaded_at_iso,
            "barangay_id": barangay_id,
            "street_id": street_id,
            "road_category": road_category,
            "classification": classification,
        }

        response = supabase.table("sensor_data").insert(record).execute()

        # check if insert was successful
        if response.data:
            print("DATA INSERTED TO SUPABASE SUCCESSFULLY")
            return {
                "status": "success",
                "message": "Data stored in Supabase",
                "inserted_data": response.data
            }
        else:
            raise Exception("Insert failed: No data returned from Supabase")
    
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print("FULL ERROR TRACEBACK:\n", error_traceback)
        
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sensor-demo")
async def receive_sensor_demo_data(data: SensorDemo):
    """
    Receives demo sensor data from ESP32.
    Stores lux, lat, lon data to sensor_demo table in Supabase.
    Sensor field is always set to 'Alpha'.
    """
    try:
        print(f"RECEIVED DEMO DATA: {data}")

        # prepare the data for supabase insertion
        record = data.model_dump()
        record["timestamp"] = datetime.now().isoformat()

        # insert into supabase sensor_demo table
        response = supabase.table("sensor_demo").insert(record).execute()

        # check if insert was successful
        if response.data:
            print("DEMO DATA INSERTED TO SUPABASE SUCCESSFULLY")
            return {
                "status": "success",
                "message": "Demo sensor data stored in Supabase",
                "inserted_data": response.data
            }
        else:
            raise Exception("Insert failed: No data returned from Supabase")
    
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print("DEMO DATA ERROR TRACEBACK:\n", error_traceback)
        
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sensor-demo-batch")
async def receive_sensor_demo_batch(payload: SensorDemoBatchPayload):
    """
    Receives batched demo data from ESP32.
    Persists multiple readings to sensor_demo table in Supabase.
    """
    if not payload.readings:
        raise HTTPException(status_code=400, detail="No readings provided")

    try:
        print(
            f"RECEIVED DEMO BATCH: {len(payload.readings)} readings from device {payload.device_id}"
        )

        base_time = datetime.now()
        extended_records = []

        for index, reading in enumerate(payload.readings):
            timestamp = (base_time + timedelta(milliseconds=index)).isoformat()

            record = {
                "lat": reading.lat,
                "lon": reading.lon,
                "lux": float(reading.lux),
                "sensor": payload.sensor,
                "timestamp": timestamp,
                "device_id": payload.device_id,
            }

            if reading.timestamp is not None:
                record["device_timestamp_ms"] = reading.timestamp
            if reading.gps_fix is not None:
                record["gps_fix"] = reading.gps_fix

            extended_records.append(record)

        response = supabase.table("sensor_demo").insert(extended_records).execute()

        error_detail = getattr(response, "error", None)

        if error_detail:
            print(
                "⚠️ Extended batch insert failed, retrying without optional fields",
                error_detail,
            )

            minimal_records = [
                {
                    "lat": reading["lat"],
                    "lon": reading["lon"],
                    "lux": reading["lux"],
                    "sensor": reading["sensor"],
                    "timestamp": reading["timestamp"],
                }
                for reading in extended_records
            ]

            response = supabase.table("sensor_demo").insert(minimal_records).execute()

        if response.data:
            print("DEMO BATCH DATA INSERTED TO SUPABASE SUCCESSFULLY")
            return {
                "status": "success",
                "message": f"Demo batch data stored in Supabase: {len(payload.readings)} records",
                "records_processed": len(response.data),
                "device_id": payload.device_id,
            }

        raise Exception("Batch insert failed: No data returned from Supabase")

    except HTTPException:
        raise
    except Exception as e:
        import traceback

        error_traceback = traceback.format_exc()
        print("DEMO BATCH ERROR TRACEBACK:\n", error_traceback)

        raise HTTPException(status_code=500, detail=str(e))


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
                "installed_at": current_time.isoformat(),
                "device_data": response.data[0] if response.data else None
            }
            
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print("DEVICE ONLINE ERROR:\n", error_traceback)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")




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


@router.get("/start-mission")
async def start_mission(device_id: int = 1001):
    """
    Check if mission should be started for specific device (Backend → ESP32).
    Returns true/false based on on_mission column in database.
    """
    try:
        # Get device mission status from database
        device = supabase.table("sensor_devices").select("on_mission, device_id, name").eq("device_id", device_id).execute()
        
        if not device.data:
            # Device not found, return false
            print(f"⚠️ Device {device_id} not found for mission check")
            return {
                "status": False,
                "message": f"Device {device_id} not found",
                "mission_active": False
            }
        
        mission_active = device.data[0].get("on_mission", False)
        device_name = device.data[0].get("name", f"Device-{device_id}")
        
        print(f"📋 Mission check for {device_name} (ID: {device_id}): {'ACTIVE' if mission_active else 'INACTIVE'}")
        
        return {
            "status": mission_active,
            "message": f"Mission status for device {device_id}",
            "mission_active": mission_active,
            "device_id": device_id,
            "device_name": device_name
        }
        
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print("START MISSION ERROR:\n", error_traceback)
        raise HTTPException(status_code=500, detail=f"Error checking mission status: {str(e)}")


@router.get("/stop-mission")
async def stop_mission(device_id: int = 1001):
    """
    Check if mission should be stopped for specific device (Backend → ESP32).
    Returns true/false - true means STOP the mission, false means CONTINUE.
    """
    try:
        # Get device mission status from database
        device = supabase.table("sensor_devices").select("on_mission, device_id, name").eq("device_id", device_id).execute()
        
        if not device.data:
            # Device not found, tell it to stop
            print(f"⚠️ Device {device_id} not found for stop-mission check")
            return {
                "status": True,  # Tell ESP32 to stop since device not found
                "message": f"Device {device_id} not found - stopping mission",
                "should_stop": True
            }
        
        mission_active = device.data[0].get("on_mission", False)
        device_name = device.data[0].get("name", f"Device-{device_id}")
        
        # If mission is NOT active, ESP32 should stop
        should_stop = not mission_active
        
        print(f"🛑 Stop-mission check for {device_name} (ID: {device_id}): {'STOP' if should_stop else 'CONTINUE'}")
        
        return {
            "status": should_stop,
            "message": f"Stop mission status for device {device_id}",
            "should_stop": should_stop,
            "device_id": device_id,
            "device_name": device_name,
            "mission_active": mission_active
        }
        
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print("STOP MISSION ERROR:\n", error_traceback)
        raise HTTPException(status_code=500, detail=f"Error checking stop mission status: {str(e)}")


@router.post("/set-mission")
async def set_mission_status(payload: MissionControlPayload):
    """
    Set mission status for a specific device (Frontend → Backend).
    Updates the on_mission column in sensor_devices table.
    """
    try:
        # Check if device exists
        device = supabase.table("sensor_devices").select("*").eq("device_id", payload.device_id).execute()
        
        if not device.data:
            raise HTTPException(status_code=404, detail=f"Device {payload.device_id} not found")
        
        # Update the on_mission status
        update_data = {
            "on_mission": payload.on_mission,
            "last_seen": datetime.now().isoformat()
        }
        
        response = supabase.table("sensor_devices").update(update_data).eq("device_id", payload.device_id).execute()
        
        action = "started" if payload.on_mission else "stopped"
        print(f"🎯 Mission {action} for device {payload.device_id}")
        
        return {
            "status": "success",
            "message": f"Mission {action} for device {payload.device_id}",
            "device_id": payload.device_id,
            "on_mission": payload.on_mission,
            "updated_at": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print("SET MISSION ERROR:\n", error_traceback)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.post("/device-restart")
async def device_restart(payload: DeviceOnlinePayload):
    """
    Called by ESP32 when it restarts/boots up.
    This automatically sets on_mission = false for the device to prevent
    automatic mission restart after power loss or unexpected reboot.
    Also updates device status and timestamps.
    """
    if not payload or not payload.device_id:
        raise HTTPException(status_code=400, detail="Device ID is required")
    
    try:
        # Check if device exists
        existing_device = supabase.table("sensor_devices").select("*").eq("device_id", payload.device_id).execute()
        
        current_time = datetime.now()
        
        if existing_device.data:
            # Device exists - reset mission status and update info
            update_data = {
                "status": DeviceStatus.ONLINE,
                "last_seen": current_time.isoformat(),
                "on_mission": False  # Always reset mission on restart
            }
            
            # Update battery level if provided
            if payload.battery_level is not None:
                update_data["battery_level"] = payload.battery_level
            
            response = supabase.table("sensor_devices").update(update_data).eq("device_id", payload.device_id).execute()
            
            print(f"🔄 Device {payload.device_id} restarted - mission reset to false")
            return {
                "status": "success", 
                "message": f"Device {payload.device_id} restart processed - mission reset",
                "action": "restart_processed",
                "device_id": payload.device_id,
                "on_mission": False,
                "restart_time": current_time.isoformat()
            }
        else:
            # Device doesn't exist - create new device with mission = false
            new_device = SensorDevice(
                device_id=payload.device_id,
                name=payload.name,
                status=DeviceStatus.ONLINE,
                last_seen=current_time,
                installed_at=current_time,
                battery_level=payload.battery_level,
                data_points_collected=0
            )
            
            # Convert to dict for Supabase insertion
            device_dict = new_device.model_dump()
            device_dict["last_seen"] = device_dict["last_seen"].isoformat()
            device_dict["installed_at"] = device_dict["installed_at"].isoformat()
            device_dict["on_mission"] = False  # Ensure new devices start with mission = false
            
            response = supabase.table("sensor_devices").insert(device_dict).execute()
            
            print(f"🆕 New device {payload.device_id} registered on restart")
            return {
                "status": "success", 
                "message": f"New device {payload.device_id} registered with mission = false",
                "action": "device_created",
                "device_id": payload.device_id,
                "on_mission": False,
                "install_time": current_time.isoformat()
            }
            
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print("DEVICE RESTART ERROR:\n", error_traceback)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.post("/bulk-data")
async def receive_bulk_data(payload: BulkDataPayload):
    """
    Receives bulk sensor data from ESP32 (typically after offline collection).
    Processes multiple data points and stores them in Supabase with timestamps.
    """
    try:
        print(f"RECEIVED BULK DATA: {len(payload.data)} records from device {payload.device_id}")
        
        if not payload.data:
            raise HTTPException(status_code=400, detail="No data provided")
        
        # Prepare bulk data for insertion
        records = []
        current_time = datetime.now()
        
        for i, data_item in enumerate(payload.data):
            record = data_item.model_dump()
            # Add timestamp with slight offset to maintain order
            record["timestamp"] = (current_time + timedelta(seconds=i)).isoformat()
            records.append(record)
        
        # Bulk insert into supabase sensor_demo table
        response = supabase.table("sensor_demo").insert(records).execute()
        
        # Check if insert was successful
        if response.data:
            print(f"BULK DATA INSERTED TO SUPABASE SUCCESSFULLY: {len(response.data)} records")
            return {
                "status": "success",
                "message": f"Bulk data stored in Supabase: {len(response.data)} records",
                "device_id": payload.device_id,
                "records_processed": len(response.data),
                "inserted_data": response.data
            }
        else:
            raise Exception("Bulk insert failed: No data returned from Supabase")
    
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print("BULK DATA ERROR TRACEBACK:\n", error_traceback)
        
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/start-mission-device")
async def start_mission_device(device_id: int):
    """
    Start mission for a specific device (Frontend shortcut).
    """
    payload = MissionControlPayload(device_id=device_id, on_mission=True)
    return await set_mission_status(payload)


@router.post("/stop-mission-device")
async def stop_mission_device(device_id: int):
    """
    Stop mission for a specific device (Frontend shortcut).
    """
    payload = MissionControlPayload(device_id=device_id, on_mission=False)
    return await set_mission_status(payload)
