import os
import json
from supabase import create_client, Client
from dotenv import load_dotenv

# load environment variables
load_dotenv()

# get supabase credentials
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

# init supabase client
supabase: Client = create_client(url, key)

# fetch data from illumination_data
response = supabase.table("illumination_data").select("*").execute()

# convert data to list of dicts
data = response.data

# save to illumination_data.json
with open("illumination_data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2, default=str)

print("illumination_data.json saved successfully.")
