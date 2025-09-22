# test_sensor_demo_simple.py
# Quick test script for sensor-demo endpoint
import requests
import random

API_URL = "https://liwanag-backend.onrender.com/api/v1/sensor-demo"

# Generate 10 random samples
print("🚀 Quick Sensor Demo Test")
print("=" * 30)

for i in range(1, 11):
    # Random data in Balanga area
    data = {
        "lat": round(random.uniform(14.6700, 14.6900), 6),
        "lon": round(random.uniform(120.5300, 120.5500), 6),
        "lux": round(random.uniform(0, 30), 2)
    }
    
    try:
        response = requests.post(API_URL, json=data)
        if response.status_code == 200:
            print(f"✅ Sample {i}: Lux={data['lux']}, Location=({data['lat']}, {data['lon']})")
        else:
            print(f"❌ Sample {i}: Error {response.status_code}")
    except Exception as e:
        print(f"❌ Sample {i}: Exception - {e}")

print("✨ Test completed!")
