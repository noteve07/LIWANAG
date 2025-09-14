# test_send_sample_data.py
import requests
from datetime import datetime, timezone


# fastapi api endpoint for receiving sensor data
API_URL = "http://localhost:8000/api/v1/sensor-data"

# sample data
sample_payloads = [
    {"lat": 14.680598, "lon": 120.543051, "lux": 850, "sensor_name": "alpha", "timestamp": "2024-09-27T10:00:00Z"},
    {"lat": 14.680858, "lon": 120.543454, "lux": 50,  "sensor_name": "alpha", "timestamp": "2024-09-27T10:02:00Z"},
    {"lat": 14.681123, "lon": 120.543789, "lux": 900, "sensor_name": "alpha", "timestamp": "2024-09-27T10:03:00Z"},
    {"lat": 14.681456, "lon": 120.544123, "lux": 30,  "sensor_name": "alpha", "timestamp": "2024-09-27T10:04:00Z"},
]

# logs
print("ESP32 HTTP POST Simulation")
for payload in sample_payloads:
    try:
        response = requests.post(API_URL, json=payload)
        print(f"Sent: {payload['lux']} lux at ({payload['lat']}, {payload['lon']}) - Status: {response.status_code}")
    except Exception as e:
        print(f"Failed to send: {e}")