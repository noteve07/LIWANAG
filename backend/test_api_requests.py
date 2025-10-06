from fastapi.testclient import TestClient

from LuxorAI.luxor_service import app

client = TestClient(app)

print("/ai/status response:")
status = client.get("/ai/status")
print(status.status_code)
print(status.json())

print("\n/ai/chat response (lux in bagumbayan):")
chat_resp = client.post(
    "/ai/chat",
    json={"question": "lux in bagumbayan", "top_k": 5, "use_llm": True},
)
print(chat_resp.status_code)
print(chat_resp.json())

print("\n/ai/chat response (population general knowledge):")
general_resp = client.post(
    "/ai/chat",
    json={"question": "what is the population of balanga", "use_llm": True},
)
print(general_resp.status_code)
print(general_resp.json())
