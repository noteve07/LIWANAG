from fastapi import APIRouter
from .endpoints import receive_sensor_data
from .endpoints import check_supabase
from .endpoints import device_online
from .endpoints import device_offline
from .endpoints import devices
from .endpoints import device_status

api_router = APIRouter()

# Include all endpoint routers - one file per endpoint!
api_router.include_router(receive_sensor_data.router, tags=["sensor-data"])
api_router.include_router(check_supabase.router, tags=["database"])
api_router.include_router(device_online.router, tags=["device-management"])
api_router.include_router(device_offline.router, tags=["device-management"])
api_router.include_router(devices.router, tags=["device-management"])
api_router.include_router(device_status.router, tags=["device-management"])
