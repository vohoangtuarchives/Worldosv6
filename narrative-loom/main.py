from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
import os
from typing import Dict, Any
from dotenv import load_dotenv
from utils.manifesto_loader import loader

load_dotenv()

app = FastAPI(title="NarrativeLoom API", version="1.0.0")

class ChronicleRequest(BaseModel):
    world_id: int
    world_era: str | None = "genesis"
    tick_start: int | None = None
    tick_end: int | None = None
    genre: str | None = "generic"
    power_system: str | None = None
    whispers: list[str] | None = []

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
            "openrouter": {"status": "online" if os.getenv("OPENROUTER_API_KEY") else "missing_key"},
            "openai": {"status": "online" if os.getenv("OPENAI_API_KEY") else "missing_key"},
            "google": {"status": "online" if os.getenv("GOOGLE_API_KEY") else "online"},
            "local": {"status": "online", "url": os.getenv("LOCAL_LLM_URL", "http://localhost:11434")}
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
    
    # 2b. Load Reality Knowledge (Decoupled Knowledge Layer)
    power_manifesto = loader.get_power_manifesto(req.power_system, req.world_era) if req.power_system else ""
    era_context = loader.get_era_context(req.world_era) if req.world_era else ""
    vfx_hints = loader.get_vfx_hints(req.world_era) if req.world_era else {}
    
    # State ban đầu
    initial_state = {
        "world_id": req.world_id,
        "world_era": req.world_era or "genesis",
        "tick_start": req.tick_start,
        "tick_end": req.tick_end,
        "genre": req.genre or "generic",
        "cross_pollination_whispers": req.whispers or [],
        "raw_chronicles": data.get("data", []),
        "historical_outline": "",
        "psychological_profiles": {},
        "storyboard": "",
        "final_prose": "",
        "feedback": {},
        "revision_count": 0,
        "current_agent": "system",
        "epistemic_noise": 0.0,
        "epistemic_tier": "Chân Thực",
        "resonance_scars": [],
        "power_system": req.power_system,
        "power_system_manifesto": power_manifesto,
        "era_context": era_context,
        "vfx_hints": vfx_hints
    }
    
    run_config = {
        "configurable": {
            "use_cache": True,
            "routing_strategy": "openrouter"
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
        "world_id": req.world_id,
        "tick_end": req.tick_end,
        "chronicles_count": len(data.get("data", [])),
        "supported_models": ["openai", "anthropic", "google", "groq", "local", "alibaba"],
        "historical_outline": final_state.get("historical_outline"),
        "storyboard": final_state.get("storyboard"),
        "final_prose": final_prose,
        "news_headline": final_state.get("news_headline"),
        "news_slogan": final_state.get("news_slogan"),
        "vfx_config": final_state.get("vfx_config") or final_state.get("vfx_hints")
    }

# ── Cache Invalidation ────────────────────────────────────────────────────────

from utils.cache_manager import cache_manager

@app.post("/invalidate-cache")
async def invalidate_cache(world_id: int):
    """Xóa bộ nhớ đệm cho một World cụ thể khi có biến động lớn hoặc Reset."""
    try:
        cache_manager.invalidate_world_cache(world_id)
        return {"status": "success", "message": f"Cache for world {world_id} invalidated."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
