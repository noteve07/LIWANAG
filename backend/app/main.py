import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.v1.routes import api_router
from app.services.device_scheduler import device_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events"""
    # Startup
    print("🚀 Starting LIWANAG API...")
    print("📡 Initializing device scheduler...")
    await device_scheduler.start()
    
    yield
    
    # Shutdown
    print("🛑 Shutting down LIWANAG API...")
    await device_scheduler.stop()


# create FastAPI application with lifespan management
app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    lifespan=lifespan
)

# add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# include API routes
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

# root endpoint
@app.get("/")
def read_root():
    return {
        "message": "LIWANAG API is running!",
        "endpoints": {
            "device_online": "POST /api/v1/device-online",
            "device_offline": "POST /api/v1/device-offline", 
            "device_status": "GET /api/v1/device-status/{id}",
            "devices": "GET /api/v1/devices",
            "sensor_data": "POST /api/v1/receive-sensor-data",
            "health": "GET /health"
        }
    }

# health check endpoint
@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "scheduler_running": device_scheduler.is_running,
        "check_interval": f"{device_scheduler.check_interval_minutes} minute(s)",
        "timeout_threshold": f"{device_scheduler.timeout_minutes} minute(s)"
    }


# To run: uvicorn main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="localhost", port=8000, reload=True)
