Frontend = LIWANAG\frontend\application\src\Pages\LuxorAI
# inside the LuxorAI from the frontend is Luxor.tsx
- Luxor.tsx will include the interface of the chatbot

Backend = LIWANAG\backend\LuxorAI
# Inside teh folder of LuxorAI

# Inside are:
- __init__.py  init.py will include
- Luxor_agent.py will include
- Luxor_service.py will include

- folder name 'data'
# Inside the 'data' folder
- barangay.json #This will include all of the barangay names
- illumination_data.json #This will include the lat,lon, lux, barangay id
- streets_segment.json #This will include the street name along with street specification like residential, main road, highways, etc. 

# barangay.json = LIWANAG\backend\scripts\others\barangays.json

# illumination_data.json = LIWANAG\backend\scripts\adjust_street_illumination_data\current_streets\illumination_data.json

# streets_segment.json = LIWANAG\backend\scripts\adjust_street_illumination_data\current_streets\streets_duplicate.geojson


# Frontend - React + vite, tailwind, typescript
# Backend - Python (fastAPI)
# Data/Database - currently json. Future development supabase (for chatbot)
# AI - ollama, model: phi3:mini


