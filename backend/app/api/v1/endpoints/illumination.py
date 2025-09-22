# app/api/v1/endpoints/illumination.py
# - /illumination-data
# - /illumination-data/barangay/{barangay_id}
# - /illumination-data/street/{street_id}

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.core.database import supabase

router = APIRouter()

@router.get("/illumination-data")
async def get_illumination_data(
    limit: Optional[int] = Query(None, description="Limit number of records returned"),
    offset: Optional[int] = Query(0, description="Offset for pagination"),
    barangay_id: Optional[int] = Query(None, description="Filter by barangay ID"),
    street_id: Optional[int] = Query(None, description="Filter by street ID"),
    sensor: Optional[str] = Query(None, description="Filter by sensor name")
):
    """
    Get illumination data with optional filtering and pagination.
    """
    try:
        # Start building the query
        query = supabase.table("illumination_data").select("*")
        
        # Apply filters
        if barangay_id is not None:
            query = query.eq("barangay_id", barangay_id)
        
        if street_id is not None:
            query = query.eq("street_id", street_id)
            
        if sensor is not None:
            query = query.eq("sensor", sensor)
        
        # Apply pagination
        if limit is not None:
            query = query.limit(limit)
        
        if offset > 0:
            query = query.offset(offset)
        
        # Execute query
        response = query.execute()
        
        # Get total count for pagination info
        count_query = supabase.table("illumination_data").select("*", count="exact")
        if barangay_id is not None:
            count_query = count_query.eq("barangay_id", barangay_id)
        if street_id is not None:
            count_query = count_query.eq("street_id", street_id)
        if sensor is not None:
            count_query = count_query.eq("sensor", sensor)
        
        count_response = count_query.execute()
        total_count = count_response.count
        
        return {
            "data": response.data,
            "pagination": {
                "total_count": total_count,
                "returned_count": len(response.data),
                "offset": offset,
                "limit": limit
            },
            "filters": {
                "barangay_id": barangay_id,
                "street_id": street_id,
                "sensor": sensor
            }
        }
        
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print("ILLUMINATION DATA ERROR:\n", error_traceback)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/illumination-data/barangay/{barangay_id}")
async def get_illumination_data_by_barangay(barangay_id: int):
    """
    Get all illumination data for a specific barangay.
    """
    try:
        response = supabase.table("illumination_data").select("*").eq("barangay_id", barangay_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"No illumination data found for barangay ID {barangay_id}")
        
        # Calculate statistics
        data = response.data
        lux_values = [record.get('lux', 0) for record in data]
        sensors = list(set(record.get('sensor') for record in data if record.get('sensor')))
        
        return {
            "barangay_id": barangay_id,
            "total_points": len(data),
            "sensors": sensors,
            "lux_stats": {
                "min": min(lux_values) if lux_values else 0,
                "max": max(lux_values) if lux_values else 0,
                "average": sum(lux_values) / len(lux_values) if lux_values else 0
            },
            "data": data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print("BARANGAY ILLUMINATION ERROR:\n", error_traceback)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/illumination-data/street/{street_id}")
async def get_illumination_data_by_street(street_id: int):
    """
    Get all illumination data for a specific street.
    """
    try:
        response = supabase.table("illumination_data").select("*").eq("street_id", street_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"No illumination data found for street ID {street_id}")
        
        # Calculate statistics
        data = response.data
        lux_values = [record.get('lux', 0) for record in data]
        sensor = data[0].get('sensor') if data else None  # All points in same street should have same sensor
        
        return {
            "street_id": street_id,
            "total_points": len(data),
            "sensor": sensor,
            "lux_stats": {
                "min": min(lux_values) if lux_values else 0,
                "max": max(lux_values) if lux_values else 0,
                "average": sum(lux_values) / len(lux_values) if lux_values else 0
            },
            "data": data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print("STREET ILLUMINATION ERROR:\n", error_traceback)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/illumination-data/sensors")
async def get_illumination_sensors():
    """
    Get list of all sensors and their statistics.
    """
    try:
        response = supabase.table("illumination_data").select("sensor, lux, street_id").execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="No illumination data found")
        
        # Group by sensor
        sensors_data = {}
        for record in response.data:
            sensor = record.get('sensor')
            lux = record.get('lux', 0)
            street_id = record.get('street_id')
            
            if sensor not in sensors_data:
                sensors_data[sensor] = {
                    'sensor': sensor,
                    'total_points': 0,
                    'lux_values': [],
                    'streets': set()
                }
            
            sensors_data[sensor]['total_points'] += 1
            sensors_data[sensor]['lux_values'].append(lux)
            if street_id:
                sensors_data[sensor]['streets'].add(street_id)
        
        # Calculate statistics for each sensor
        result = []
        for sensor_name, data in sensors_data.items():
            lux_values = data['lux_values']
            result.append({
                'sensor': sensor_name,
                'total_points': data['total_points'],
                'streets_count': len(data['streets']),
                'street_ids': list(data['streets']),
                'lux_stats': {
                    'min': min(lux_values) if lux_values else 0,
                    'max': max(lux_values) if lux_values else 0,
                    'average': round(sum(lux_values) / len(lux_values), 2) if lux_values else 0
                }
            })
        
        # Sort by sensor name
        result.sort(key=lambda x: x['sensor'])
        
        return {
            "total_sensors": len(result),
            "sensors": result
        }
        
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        print("SENSORS ILLUMINATION ERROR:\n", error_traceback)
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
