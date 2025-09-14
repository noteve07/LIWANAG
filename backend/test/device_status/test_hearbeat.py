import requests
import json
import time
from datetime import datetime

# API endpoint
API_URL = "http://localhost:8000/api/v1/device-online"

# Heartbeat configuration
HEARTBEAT_INTERVAL = 1  # 1 minute (60 seconds)

print("Testing ESP32 Device Heartbeat Simulation")
print("=" * 45)

# ESP32 Bravo device
device_payload = {
    "device_id": 1002,
    "name": "Bravo",
    "battery_level": 90
}

print(f"Starting heartbeat simulation for device: {device_payload['device_id']} ({device_payload['name']})")
print(f"Heartbeat interval: {HEARTBEAT_INTERVAL} minute(s)")
print(f"Initial payload: {json.dumps(device_payload, indent=2)}")
print()

# Simulate ESP32 sending heartbeats every minute
heartbeat_count = 0

print(f"📡 Starting continuous heartbeat polling ({HEARTBEAT_INTERVAL} minute intervals)...")
print("💡 Press Ctrl+C to stop (simulates device shutdown)")
print()

try:
    while True:  # Keep sending heartbeats until interrupted
        # Simulate battery drain (decrease by 2% each heartbeat)
        if heartbeat_count > 0:
            device_payload['battery_level'] = max(10, device_payload['battery_level'] - 2)
        
        current_time = datetime.now().strftime("%H:%M:%S")
        
        response = requests.post(API_URL, json=device_payload)
        print(f"💓 [{current_time}] Heartbeat #{heartbeat_count + 1}:")
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            action = result.get('action', 'heartbeat')
            battery = device_payload['battery_level']
            print(f"   Response: {action} - Battery: {battery}%")
            print(f"   ✅ Heartbeat successful!")
        else:
            print(f"   ❌ Heartbeat failed: {response.json()}")
        
        heartbeat_count += 1
        
        # Wait for next heartbeat interval
        print(f"   ⏳ Waiting {HEARTBEAT_INTERVAL} minute(s) for next heartbeat...")
        print()
        time.sleep(HEARTBEAT_INTERVAL * 60)  # Convert minutes to seconds

except KeyboardInterrupt:
    print(f"\n🛑 Device {device_payload['device_id']} (Bravo) shutdown - sent {heartbeat_count} heartbeats")
    print(f"📊 Final battery level: {device_payload['battery_level']}%")
    print()
    print("💡 Watch server logs - device should be marked offline after 5+ minutes:")
    print(f"   Look for: '🔴 Device {device_payload['device_id']} (Bravo) marked OFFLINE'")
except Exception as e:
    print(f"❌ Error during heartbeat simulation: {e}")