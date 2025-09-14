from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from enum import Enum


class DeviceStatus(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    COLLECTING = "collecting"
    UPLOADING = "uploading"

class SensorDevice(BaseModel):
    device_id: int  # Changed to int to match database
    name: str
    status: DeviceStatus = DeviceStatus.OFFLINE
    last_seen: datetime
    installed_at: datetime
    battery_level: Optional[int] = None
    data_points_collected: int = 0

class DeviceOnlinePayload(BaseModel):
    """Minimal payload that ESP32 sends when going online"""
    device_id: int  # Changed to int to match database
    name: str
    battery_level: Optional[int] = None