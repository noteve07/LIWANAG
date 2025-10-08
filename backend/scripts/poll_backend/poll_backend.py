import requests
import time

url = "https://liwanag-backend.onrender.com/"

# interval in seconds
interval = 300  # 5 minutes

while True:
    try:
        response = requests.get(url)
        if response.status_code == 200:
            print("Ping successful")
        else:
            print(f"Ping failed: {response.status_code}")
    except Exception as e:
        print(f"Error: {e}")
    
    time.sleep(interval)