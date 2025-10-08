# import required libraries
import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

# load environment variables from .env
load_dotenv()

# get supabase credentials from environment variables
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# create supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_illumination_data():
    try:
        # fetch all rows from illumination_data_v2
        response = supabase.table("illumination_data_v2").select("*").execute()
        return response.data  # list of rows
    except Exception as e:
        print("Error fetching data:", e)
        return []

def save_to_json(data, filename="illumination_data_v2_fallback.json"):
    # save data to json file
    with open(filename, "w") as f:
        json.dump(data, f, indent=4)
    print(f"Data saved to {filename}")

if __name__ == "__main__":
    data = fetch_illumination_data()
    if data:
        save_to_json(data)
