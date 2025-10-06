from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class SensorData(BaseModel):
    lat: float
    lon: float
    lux: int
    sensor_name: str
    timestamp: datetime
    barangay: Optional[str] = None
    street: Optional[str] = None


class SensorDemo(BaseModel):
    lat: float
    lon: float
    lux: float
    sensor: str = "Alpha" 


class SensorDemoBatchReading(BaseModel):
    lat: float
    lon: float
    lux: float
    timestamp: Optional[int] = None
    gps_fix: Optional[bool] = Field(default=None, alias="gpsFix")

    class Config:
        allow_population_by_field_name = True


class SensorDemoBatchPayload(BaseModel):
    device_id: int
    sensor: str = "Alpha"
    readings: List[SensorDemoBatchReading]
    