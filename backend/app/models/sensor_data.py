from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class SensorData(BaseModel):
    lat: float
    lon: float
    lux: int
    sensor_name: str
    timestamp: datetime
    barangay: Optional[str] = None
    street: Optional[str] = None
    