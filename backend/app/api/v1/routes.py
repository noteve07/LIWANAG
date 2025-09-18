from fastapi import APIRouter
from .endpoints import check_supabase
from .endpoints import device_manager
from .endpoints import esp32

api_router = APIRouter()

api_router.include_router(check_supabase.router, tags=["Database"])
api_router.include_router(esp32.router, tags=["ESP32 Connections"])
api_router.include_router(device_manager.router, tags=["Device Management"])
