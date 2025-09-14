import requests
import json

# API endpoints
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1"

print("Testing LIWANAG API")
print("=" * 30)

# Test 1: Check if API is running
print("1. Checking API health...")
try:
    response = requests.get(f"{BASE_URL}/health")
    if response.status_code == 200:
        health = response.json()
        print(f"✅ API is healthy")
        print(f"   Scheduler running: {health.get('scheduler_running')}")
        print(f"   Check interval: {health.get('check_interval')}")
        print(f"   Timeout threshold: {health.get('timeout_threshold')}")
    else:
        print(f"❌ Health check failed: {response.status_code}")
except Exception as e:
    print(f"❌ Cannot reach API: {e}")

print()

# Test 2: Device online
print("2. Testing device online...")
device_payload = {
    "device_id": 2001,
    "name": "Test Device",
    "battery_level": 85
}

try:
    response = requests.post(f"{API_URL}/device-online", json=device_payload)
    if response.status_code == 200:
        print("✅ Device online successful")
        result = response.json()
        print(f"   Action: {result.get('action')}")
        print(f"   Device ID: {result.get('device_id')}")
    else:
        print(f"❌ Device online failed: {response.status_code}")
except Exception as e:
    print(f"❌ Device online error: {e}")

print()

# Test 3: Check device status
print("3. Checking device status...")
try:
    response = requests.get(f"{API_URL}/device-status/{device_payload['device_id']}")
    if response.status_code == 200:
        status = response.json()
        print("✅ Device status retrieved")
        print(f"   Status: {status.get('status')}")
        print(f"   Battery: {status.get('battery_level')}%")
        print(f"   Last seen: {status.get('minutes_since_last_seen')} min ago")
    else:
        print(f"❌ Device status failed: {response.status_code}")
except Exception as e:
    print(f"❌ Device status error: {e}")

print()

# Test 4: List all devices
print("4. Listing all devices...")
try:
    response = requests.get(f"{API_URL}/devices")
    if response.status_code == 200:
        devices = response.json()
        print("✅ Devices list retrieved")
        print(f"   Total devices: {devices.get('total_devices')}")
        print(f"   Online: {devices.get('online_devices')}")
        print(f"   Offline: {devices.get('offline_devices')}")
    else:
        print(f"❌ Devices list failed: {response.status_code}")
except Exception as e:
    print(f"❌ Devices list error: {e}")

print()
print("=" * 30)
print("✅ Basic API test completed!")
print("📡 Scheduler is running automatically in background")
print("⏰ It will mark devices offline after 5 minutes of no heartbeat")
