from fastapi import APIRouter
from .endpoints import receive_sensor_data
from .endpoints import check_supabase
from .endpoints import device_online

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(receive_sensor_data.router, tags=["receive-sensor-data"])
api_router.include_router(check_supabase.router, tags=["check-supabase"])
api_router.include_router(device_online.router, tags=["device-online"])
