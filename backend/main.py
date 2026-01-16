"""
BloomWise AI Backend - Main FastAPI Application
Provides API endpoints for chat, preview, background planning, and scheduling.
"""
import os
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List
from dotenv import load_dotenv

# Import Agents (ADK Refactored)
from agents.chat_agent import BloomWiseAgent
from agents.preview_agent import PreviewAgent
from agents.background_agent import PlanningAgent

# Import Scheduler
from scheduler import (
    start_scheduler,
    stop_scheduler,
    get_scheduler_status,
    trigger_manual_cycle
)

# Import Database
from config.database import get_farmer_by_email, get_farm_context

# Load environment variables
load_dotenv(dotenv_path="../.env")

app = FastAPI(
    title="BloomWise AI Backend",
    description="Smart Irrigation Scheduler API with Google ADK",
    version="1.0.0"
)

# CORS Configuration - Allow Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://*.railway.app",
        "https://*.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Agents (lazy loading)
_chat_agent = None
_preview_agent = None
_planning_agent = None


def get_chat_agent():
    global _chat_agent
    if _chat_agent is None:
        _chat_agent = BloomWiseAgent()
    return _chat_agent


def get_preview_agent():
    global _preview_agent
    if _preview_agent is None:
        _preview_agent = PreviewAgent()
    return _preview_agent


def get_planning_agent():
    global _planning_agent
    if _planning_agent is None:
        _planning_agent = PlanningAgent()
    return _planning_agent


# ============ REQUEST MODELS ============

class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict] = {}
    history: Optional[List] = []
    farmer_id: Optional[str] = None


class PreviewChatRequest(BaseModel):
    message: str
    context: Optional[Dict] = {}
    simulation_hour: Optional[int] = 10
    simulation_date: Optional[str] = None


class PlanRequest(BaseModel):
    farmer_id: str
    date: Optional[str] = None
    weather: Optional[Dict] = {}


# ============ HEALTH ENDPOINTS ============

@app.get("/")
def read_root():
    return {
        "status": "BloomWise AI Backend Running (ADK Enabled)",
        "version": "1.0.0",
        "endpoints": {
            "chat_live": "/api/chat/live",
            "chat_preview": "/api/chat/preview",
            "background_plan": "/api/background/plan",
            "scheduler_status": "/api/scheduler/status"
        }
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": __import__("datetime").datetime.now().isoformat()}


# ============ CHAT ENDPOINTS ============

@app.post("/api/chat/live")
async def chat_live(request: ChatRequest, authorization: Optional[str] = Header(None)):
    """
    Route for Live User Chat.
    Uses Llama 3.3 70B with Supabase context.
    
    Returns:
        - message: AI response
        - reasoning: Tools used and reasoning steps
        - tools_used: List of tool names called
    """
    try:
        chat_agent = get_chat_agent()
        
        # Extract farmer_id from request or try to get from auth
        farmer_id = request.farmer_id
        
        # If no farmer_id, try to get from email in context
        if not farmer_id and request.context.get("email"):
            farmer = get_farmer_by_email(request.context["email"])
            if farmer:
                farmer_id = farmer.get("id")
        
        # Merge context
        context = {
            **request.context,
            "history_length": len(request.history)
        }
        
        # Call agent with context
        response = chat_agent.chat(
            message=request.message,
            context=context,
            farmer_id=farmer_id
        )
        
        return response
        
    except Exception as e:
        print(f"Live Agent Error: {e}")
        return {
            "success": False,
            "message": f"Error: {str(e)}",
            "reasoning": {},
            "tools_used": [],
            "isLive": True,
            "error": str(e)
        }


@app.post("/api/chat/preview")
async def chat_preview(request: PreviewChatRequest):
    """
    Route for Preview/Demo Chat.
    Uses Gemini 2.5 Flash with simulation-aware mock data.
    
    Returns:
        - message: AI response with simulation context
        - simulation_data: Mock weather, sensors, and calculations
        - isDemo: true
    """
    preview_agent = get_preview_agent()
    
    # Build context with simulation state
    context = {
        **request.context,
        "simulation_hour": request.simulation_hour,
        "simulation_date": request.simulation_date
    }
    
    return preview_agent.chat(request.message, context, [])


# ============ BACKGROUND PLANNING ENDPOINTS ============

@app.post("/api/background/plan")
async def generate_plan(request: PlanRequest):
    """
    Route for Background Irrigation Planning.
    Generates 24-hour schedule for a farmer.
    
    Returns:
        - schedule: 24-hour plan as JSON array
        - summary: Statistics about the plan
    """
    try:
        planning_agent = get_planning_agent()
        
        if request.farmer_id:
            # Use plan_for_farmer method
            result = planning_agent.plan_for_farmer(request.farmer_id)
            return result
        else:
            # Fallback to raw prompt
            prompt = (
                f"Generate irrigation plan for Date: {request.date}.\n"
                f"Weather: {request.weather}\n"
                f"Context: General farm"
            )
            
            response_text = planning_agent.run(prompt)
            
            # Parse JSON
            import json
            try:
                clean_json = response_text.replace("```json", "").replace("```", "").strip()
                plan_json = json.loads(clean_json)
                return {"schedule": plan_json}
            except:
                return {"error": "Failed to parse plan JSON", "raw": response_text}
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============ SCHEDULER ENDPOINTS ============

@app.get("/api/scheduler/status")
async def scheduler_status():
    """Get background scheduler status."""
    return get_scheduler_status()


@app.post("/api/scheduler/start")
async def scheduler_start():
    """Start the background scheduler."""
    return start_scheduler()


@app.post("/api/scheduler/stop")
async def scheduler_stop():
    """Stop the background scheduler."""
    return stop_scheduler()


@app.post("/api/scheduler/trigger")
async def scheduler_trigger():
    """Manually trigger a scheduler cycle (for testing)."""
    return trigger_manual_cycle()


# ============ CONTEXT ENDPOINTS ============

@app.get("/api/context/{farmer_id}")
async def get_context(farmer_id: str):
    """Get full farm context for a farmer."""
    context = get_farm_context(farmer_id)
    if "error" in context:
        raise HTTPException(status_code=404, detail=context["error"])
    return context


# ============ STARTUP/SHUTDOWN ============

@app.on_event("startup")
async def startup_event():
    """Initialize on startup."""
    print("🚀 BloomWise AI Backend starting...")
    
    # Auto-start scheduler if in production
    if os.getenv("AUTO_START_SCHEDULER", "false").lower() == "true":
        start_scheduler()
        print("📅 Scheduler auto-started")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    print("⏹️ BloomWise AI Backend shutting down...")
    stop_scheduler()


# ============ MAIN ============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
