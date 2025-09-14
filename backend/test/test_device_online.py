import requests
import json

# API endpoint for device online
API_URL = "http://localhost:8000/api/v1/device-online"

print("Testing Device Online Endpoint with Minimal Payloads")
print("=" * 60)

# Test case 1: Minimal payload - only device_id and name
print("Test 1: Minimal payload (device_id + name only)")
minimal_payload = {
    "device_id": 1001,  
    "name": "Alpha"
}

try:
    response = requests.post(API_URL, json=minimal_payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()
except Exception as e:
    print(f"Error: {e}\n")

# Test case 2: Payload with battery level
print("Test 2: Payload with battery level")
battery_payload = {
    "device_id": 1002, 
    "name": "Bravo",
    "battery_level": 78
}

try:
    response = requests.post(API_URL, json=battery_payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()
except Exception as e:
    print(f"Error: {e}\n")

# Test case 3: Update existing device (send same device again)
print("Test 3: Update existing device (send minimal device again)")
try:
    response = requests.post(API_URL, json=minimal_payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()
except Exception as e:
    print(f"Error: {e}\n")

# Test case 4: Update existing device with new battery level
print("Test 4: Update device with new battery level")
update_battery = {
    "device_id": 1002,  # Changed to integer to match database schema
    "name": "Bravo",
    "battery_level": 65  # Lower battery
}

try:
    response = requests.post(API_URL, json=update_battery)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print()
except Exception as e:
    print(f"Error: {e}\n")

print("=" * 60)
print("Summary:")
print("✅ ESP32 only needs to send: device_id, name, and optionally battery_level")
print("✅ Backend automatically handles: timestamps, status, data_points_collected")
print("✅ First call creates device, subsequent calls update it")
