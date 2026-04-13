"""System configuration and health routers."""
from fastapi import APIRouter, HTTPException
import os
from core.logging import get_logger
from utils.cache_manager import cache_manager

log = get_logger(__name__)
router = APIRouter()

@router.get("/")
def read_root():
    return {"status": "NarrativeLoom implies Data/Narrative Singularity", "version": "2.0.0"}

@router.get("/config")
def get_config():
    """
    Trả về cấu hình hiện tại của các Agents.
    """
    return {
        "agents": {
            "historian": {"provider": "openai", "model": "gpt-4o", "role": "Historical Outline"},
            "psychologist": {"provider": "anthropic", "model": "claude-3-opus-20240229", "role": "Psychological Analysis"},
            "director": {"provider": "openai", "model": "gpt-4o", "role": "Storyboard/Scene Direction"},
            "wordsmith": {"provider": "anthropic", "model": "claude-3-opus-20240229", "role": "Literary Prose"},
            "art_director": {"provider": "openai", "model": "dall-e-3", "role": "Visual Assets Definition"}
        },
        "providers": {
            "zai": {"status": "online" if os.getenv("NARRATIVE_LLM_KEY") else "missing_key"},
            "openrouter": {"status": "online" if os.getenv("OPENROUTER_API_KEY") else "missing_key"},
            "openai": {"status": "online" if os.getenv("OPENAI_API_KEY") else "missing_key"},
            "google": {"status": "online" if os.getenv("GOOGLE_API_KEY") else "online"},
            "local": {"status": "online", "url": os.getenv("LOCAL_LLM_URL", "http://localhost:11434")}
        }
    }

@router.post("/invalidate-cache")
async def invalidate_cache(world_id: int):
    """Xóa bộ nhớ đệm cho một World cụ thể."""
    try:
        cache_manager.invalidate_world_cache(world_id)
        log.info("cache.invalidated", world_id=world_id)
        return {"status": "success", "message": f"Cache for world {world_id} invalidated."}
    except Exception as e:
        log.exception("cache.invalidation_failed", world_id=world_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    checks = {}

    # Redis
    try:
        from utils.cache_manager import cache_manager
        if cache_manager.redis_available:
            cache_manager.redis_client.ping()
            checks["redis"] = "ok"
        else:
            checks["redis"] = "unavailable"
    except Exception as e:
        checks["redis"] = f"error: {e}"

    # Celery broker
    try:
        from core.celery_app import celery_app
        conn = celery_app.connection()
        conn.ensure_connection(max_retries=1, timeout=3)
        conn.close()
        checks["celery_broker"] = "ok"
    except Exception as e:
        checks["celery_broker"] = f"error: {e}"

    # LLM providers (key presence only)
    for provider, env_key in [("openai", "OPENAI_API_KEY"), ("anthropic", "ANTHROPIC_API_KEY"), ("google", "GOOGLE_API_KEY")]:
        checks[f"llm_{provider}"] = "configured" if os.getenv(env_key) else "not_configured"

    all_ok = all(v in ("ok", "configured", "not_configured") for v in checks.values())
    return {"status": "healthy" if all_ok else "degraded", "checks": checks}


@router.get("/metrics")
async def get_metrics():
    from core.metrics import metrics
    return metrics.snapshot()
