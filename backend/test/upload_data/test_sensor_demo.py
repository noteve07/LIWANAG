# test_sensor_demo.py
import requests
import random
import time
from datetime import datetime

# FastAPI endpoint for sensor-demo (deployed on Render)
API_URL = "https://liwanag-backend.onrender.com/api/v1/sensor-demo"

# Balanga City coordinates (approximate area)
BALANGA_LAT_RANGE = (14.6700, 14.6900)  # Latitude range for Balanga
BALANGA_LON_RANGE = (120.5300, 120.5500)  # Longitude range for Balanga

def generate_random_sensor_data():
    """Generate random sensor data with lux values from 0-30"""
    return {
        "lat": round(random.uniform(*BALANGA_LAT_RANGE), 6),
        "lon": round(random.uniform(*BALANGA_LON_RANGE), 6),
        "lux": round(random.uniform(0, 30), 2)
        # sensor field will be automatically set to "Alpha" by the API
    }

def send_sensor_data(data):
    """Send sensor data to the API"""
    try:
        response = requests.post(API_URL, json=data)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ SUCCESS: Lux={data['lux']}, Lat={data['lat']}, Lon={data['lon']}")
            return True
        else:
            print(f"❌ ERROR {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print(f"❌ EXCEPTION: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 ESP32 Sensor Demo Test Script")
    print(f"📡 Endpoint: {API_URL}")
    print(f"🎯 Lux Range: 0-30")
    print(f"📍 Location: Balanga City area")
    print("=" * 50)
    
    # Test options
    num_samples = int(input("Enter number of samples to send (default 5): ") or "5")
    delay_seconds = float(input("Enter delay between sends in seconds (default 1.0): ") or "1.0")
    
    print(f"\n📊 Sending {num_samples} samples with {delay_seconds}s delay...")
    print("=" * 50)
    
    success_count = 0
    
    for i in range(1, num_samples + 1):
        print(f"\n📤 Sample {i}/{num_samples}:")
        
        # Generate and send data
        sensor_data = generate_random_sensor_data()
        
        if send_sensor_data(sensor_data):
            success_count += 1
        
        # Wait before next send (except for the last one)
        if i < num_samples:
            time.sleep(delay_seconds)
    
    # Summary
    print("\n" + "=" * 50)
    print(f"📈 SUMMARY:")
    print(f"   Total Sent: {num_samples}")
    print(f"   Successful: {success_count}")
    print(f"   Failed: {num_samples - success_count}")
    print(f"   Success Rate: {(success_count/num_samples)*100:.1f}%")

if __name__ == "__main__":
    main()
