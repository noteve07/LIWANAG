from datetime import datetime
from fastapi import APIRouter, HTTPException

from app.core.database import supabase
from app.models.sensor_data import SensorData

router = APIRouter()



@router.post("/receive-sensor-data")
async def receive_sensor_data(data: SensorData):
    """
    Receives data from an ESP32 sensor unit.
    Stores the data in Supabase database.
    """
    try: 
        print(f"RECEIVED DATA: {data}")

        # prepare the data for supabase insertion
        record = data.model_dump()
        record["timestamp"] = record["timestamp"].isoformat()
        record["uploaded_at"] = datetime.now().isoformat()

        # insert into supabase
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
