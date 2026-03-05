from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
import os
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

@app.post("/weave-chronicles")
async def weave_chronicles(req: ChronicleRequest):
    """
    Kích hoạt LLM agents để dọn dẹp các sự kiện chưa được kể chuyện.
    (Để tích hợp LangGraph sau).
    """
    backend_url = os.getenv("WORLDOS_API_URL", "http://backend:80/api")
    
    # 1. Fetch from WorldOS
    async with httpx.AsyncClient() as client:
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
            "historian_provider": "openai",
            "historian_model": "gpt-4o",
            "psychologist_provider": "anthropic",
            "psychologist_model": "claude-3-opus-20240229",
            "director_provider": "openai", 
            "director_model": "gpt-4o",
            "wordsmith_provider": "anthropic",
            "wordsmith_model": "claude-3-opus-20240229" 
        }
    }
    
    # Kích hoạt đồ thị chạy tuần tự
    final_state = await loom_app.ainvoke(initial_state, config=run_config)
    
    # Khâu cuối cùng là lưu trả kết quả Final Prose về WorldOS Backend để update `content` của Chronicles, hoặc Push vào Kafka cho Frontend.
    # Trong mô tơ này, ta sẽ trả trực tiếp cho Client API call:
    
    return {
        "message": "Narrative Synthesis Complete.",
        "chronicles_count": len(data.get("data", [])),
        "supported_models": ["openai", "anthropic", "google", "groq", "local", "alibaba"],
        "historical_outline": final_state.get("historical_outline"),
        "storyboard": final_state.get("storyboard"),
        "final_prose": final_state.get("final_prose")
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
