from fastapi import APIRouter
from .endpoints import sensor_data

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(sensor_data.router, tags=["sensor-data"])
