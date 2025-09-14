import requests
import json

# API endpoint
API_URL = "http://localhost:8000/api/v1/device-offline"

print("Testing Device Offline Endpoint")
print("=" * 40)

# ESP32 payload when turned off
device_payload = {
    "device_id": 1001,
    "battery_level": 45
}

print(f"Sending device offline request for device: {device_payload['device_id']}")
print(f"Payload: {json.dumps(device_payload, indent=2)}")
print()

try:
    response = requests.post(API_URL, json=device_payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("\n✅ Device offline test successful!")
    else:
        print("\n❌ Device offline test failed!")
        
except Exception as e:
    print(f"❌ Error testing device offline endpoint: {e}")