"""FastAPI service wrappers for the Luxor hybrid agent."""
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import traceback

from .luxor_agent import LuxorAgent

app = FastAPI(title="Luxor AI", version="2.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize agent with error handling
try:
    agent = LuxorAgent()
    print("✅ Luxor AI agent initialized successfully")
except Exception as e:
    print(f"❌ Failed to initialize Luxor AI agent: {e}")
    agent = None

class ChatRequest(BaseModel):
    question: str
    top_k: int = 5
    use_llm: bool = True

@app.post("/ai/chat")
async def chat_endpoint(req: ChatRequest):
    if not agent:
        raise HTTPException(status_code=503, detail="Luxor AI agent not initialized")
    
    try:
        result = agent.answer(req.question, limit=req.top_k, use_llm=req.use_llm)
        return JSONResponse(result)
    except Exception as exc:
        print(f"Chat error: {exc}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(exc)}")

@app.get("/ai/status")
async def status():
    if not agent:
        return JSONResponse({
            "status": "error", 
            "message": "Agent not initialized",
            "llm_available": False
        })
    
    return JSONResponse({
        "status": "ok",
        "model": agent.model,
        "ollama_host": agent.ollama_host,
        "llm_available": agent.llm_available,
    })

@app.get("/ai/context")
async def context(question: str, top_k: int = 5):
    if not agent:
        raise HTTPException(status_code=503, detail="Luxor AI agent not initialized")
    
    try:
        ctx = agent.gather_context(question, limit=top_k)
        return JSONResponse({"question": question, "context": ctx})
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@app.get("/")
async def root():
    return {"message": "Luxor AI API is running", "status": "active"}

@app.get("/health")
async def health():
    return {
        "status": "healthy" if agent else "unhealthy",
        "service": "Luxor AI",
        "llm_available": agent.llm_available if agent else False
    }