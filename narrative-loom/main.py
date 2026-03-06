from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
import os
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="NarrativeLoom API", version="1.0.0")

class ChronicleRequest(BaseModel):
    world_id: int
    tick_start: int | None = None
    tick_end: int | None = None

@app.get("/")
def read_root():
    return {"status": "NarrativeLoom implies Data/Narrative Singularity", "version": "1.0.0"}

@app.get("/config")
def get_config():
    """
    Trả về cấu hình mặc định hoặc hiện tại của các Agents.
    """
    return {
        "agents": {
            "historian": {"provider": "openai", "model": "gpt-4o", "role": "Historical Outline"},
            "psychologist": {"provider": "anthropic", "model": "claude-3-opus-20240229", "role": "Psychological Analysis"},
            "director": {"provider": "openai", "model": "gpt-4o", "role": "Storyboard/Scene Direction"},
            "wordsmith": {"provider": "anthropic", "model": "claude-3-opus-20240229", "role": "Literary Prose"}
        },
        "providers": {
            "openai": {"status": "online" if os.getenv("OPENAI_API_KEY") else "missing_key"},
            "anthropic": {"status": "online" if os.getenv("ANTHROPIC_API_KEY") else "missing_key"},
            "google": {"status": "online" if os.getenv("GOOGLE_API_KEY") else "missing_key"},
            "local": {"status": "online", "url": os.getenv("LOCAL_LLM_URL", "http://host.docker.internal:1234/v1")}
        }
    }

@app.post("/weave-chronicles")
async def weave_chronicles(req: ChronicleRequest):
    """
    Kích hoạt LLM agents để dọn dẹp các sự kiện chưa được kể chuyện.
    (Để tích hợp LangGraph sau).
    """
    backend_url = os.getenv("WORLDOS_API_URL", "http://nginx/api")
    
    # 1. Fetch from WorldOS
    async with httpx.AsyncClient(timeout=300.0) as client:
        try:
            response = await client.get(
                f"{backend_url}/loom/v1/narrative/chronicles",
                params={"world_id": req.world_id, "tick_start": req.tick_start, "tick_end": req.tick_end}
            )
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch from WorldOS: {str(e)}")

    # 2. Xử lý qua LangGraph Pipeline
    # Cấu hình tuỳ chọn Models cho mỗi Agent (có thể lấy từ DB sau này)
    # Ví dụ: Mặc định Historian=GPT-4o, Wordsmith=Claude-3.
    from graph import app as loom_app
    
    # State ban đầu
    initial_state = {
        "world_id": req.world_id,
        "tick_start": req.tick_start,
        "tick_end": req.tick_end,
        "raw_chronicles": data.get("data", []),
        "historical_outline": "",
        "psychological_profiles": {},
        "storyboard": "",
        "final_prose": "",
        "feedback": "",
        "current_agent": "system"
    }
    
    run_config = {
        "configurable": {
            "historian_provider": "local",
            "historian_model": os.getenv("LOCAL_MODEL_NAME", "MythoMax-L2-13B"),
            "psychologist_provider": "local",
            "psychologist_model": os.getenv("LOCAL_MODEL_NAME", "MythoMax-L2-13B"),
            "director_provider": "local", 
            "director_model": os.getenv("LOCAL_MODEL_NAME", "MythoMax-L2-13B"),
            "wordsmith_provider": "local",
            "wordsmith_model": os.getenv("LOCAL_MODEL_NAME", "MythoMax-L2-13B") 
        }
    }
    
    # Kích hoạt đồ thị chạy tuần tự
    try:
        final_state = await loom_app.ainvoke(initial_state, config=run_config)
        final_prose = final_state.get("final_prose", "")
    except Exception as e:
        import traceback
        error_msg = f"LangGraph Error: {str(e)}\n{traceback.format_exc()}"
        print(f"DEBUG ERROR: {error_msg}")
        return {
            "message": "Narrative Synthesis Failed.",
            "error": str(e),
            "final_prose": f"ERROR DURING GENERATION: {error_msg}"
        }
    
    # Khâu cuối cùng là lưu trả kết quả Final Prose về WorldOS Backend để update `content` của Chronicles, hoặc Push vào Kafka cho Frontend.
    # Trong mô tơ này, ta sẽ trả trực tiếp cho Client API call:
    
    return {
        "message": "Narrative Synthesis Complete.",
        "chronicles_count": len(data.get("data", [])),
        "supported_models": ["openai", "anthropic", "google", "groq", "local", "alibaba"],
        "historical_outline": final_state.get("historical_outline"),
        "storyboard": final_state.get("storyboard"),
        "final_prose": final_prose
    }


# ── Actor Intent Endpoint ─────────────────────────────────────────────────────

from agents.intent_agent import ActorIntentRequest, ActorIntentResponse, intent_agent

@app.post("/actor-intent", response_model=ActorIntentResponse)
async def actor_intent(req: ActorIntentRequest):
    """
    Real-time LLM decision: nhận actor state + universe context,
    trả về hành động AI quyết định + reasoning dùng làm biography entry.

    Default: local Ollama (qwen2.5:7b).
    Override bằng cách truyền provider="alibaba" để dùng DashScope.
    Laravel phải fallback về DecisionEngine nếu endpoint trả về 503.
    """
    try:
        return await intent_agent(req)
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=503,
            detail=f"Intent agent failed: {str(e)}"
        )
# ── Test Endpoints for Decoupled Agents ────────────────────────────────────────

@app.post("/test/historian")
async def test_historian(req: dict):
    from agents.historian import historian_agent
    state = {
        "raw_chronicles": req.get("raw_chronicles", []),
        "tick_start": req.get("tick_start", 0),
        "tick_end": req.get("tick_end", 100)
    }
    return await historian_agent(state)

@app.post("/test/psychologist")
async def test_psychologist(req: dict):
    from agents.psychologist import psychologist_agent
    state = {
        "historical_outline": req.get("historical_outline", "")
    }
    return await psychologist_agent(state)

@app.post("/test/director")
async def test_director(req: dict):
    from agents.director import director_agent
    state = {
        "historical_outline": req.get("historical_outline", ""),
        "psychological_profiles": {"analysis": req.get("psychology", "")}
    }
    return await director_agent(state)

@app.post("/test/wordsmith")
async def test_wordsmith(req: dict):
    from agents.wordsmith import wordsmith_agent
    state = {
        "storyboard": req.get("storyboard", "")
    }
    return await wordsmith_agent(state)
