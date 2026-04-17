"""System configuration and health routers."""

import json
import os
from fastapi import APIRouter, HTTPException
from core.logging import get_logger
from utils.cache_manager import cache_manager

log = get_logger(__name__)
router = APIRouter()


@router.get("/")
def read_root():
    return {
        "status": "NarrativeLoom implies Data/Narrative Singularity",
        "version": "2.0.0",
    }


def _load_agent_routing() -> dict:
    """Load agent routing config from JSON file."""
    config_path = os.path.join(os.path.dirname(__file__), "..", "configs", "agent_routing.json")
    try:
        with open(config_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        log.warning("config.load_failed", error=str(e))
        return {}


def _get_agent_role(agent_id: str) -> str:
    """Map agent ID to human-readable role."""
    roles = {
        "chief_editor": "Content Orchestration",
        "historian": "Historical Outline",
        "psychologist": "Psychological Analysis",
        "director": "Storyboard/Scene Direction",
        "wordsmith": "Literary Prose",
        "critic": "Quality Review",
        "archivist": "Content Archival",
        "mythologist": "Mythological Context",
        "news_anchor": "News Headline",
        "vfx_director": "Visual Effects",
    }
    return roles.get(agent_id, "Unknown Role")


@router.get("/config")
def get_config():
    """
    Trả về cấu hình hiện tại của các Agents (dynamically loaded from agent_routing.json).
    """
    routing = _load_agent_routing()

    # Build agents dict from routing config
    agents = {}
    for agent_id, config in routing.items():
        if agent_id == "failover":
            continue
        agents[agent_id] = {
            "provider": config.get("provider", "unknown"),
            "model": config.get("model", "unknown"),
            "tier": config.get("tier", "unknown"),
            "role": _get_agent_role(agent_id),
        }

    # Provider status based on environment variables
    providers = {
        "openai": {
            "status": "online" if os.getenv("OPENAI_API_KEY") else "missing_key",
            "key_present": bool(os.getenv("OPENAI_API_KEY")),
        },
        "anthropic": {
            "status": "online" if os.getenv("ANTHROPIC_API_KEY") else "missing_key",
            "key_present": bool(os.getenv("ANTHROPIC_API_KEY")),
        },
        "google": {
            "status": "online" if os.getenv("GOOGLE_API_KEY") else "missing_key",
            "key_present": bool(os.getenv("GOOGLE_API_KEY")),
        },
        "openrouter": {
            "status": "online" if os.getenv("OPENROUTER_API_KEY") else "missing_key",
            "key_present": bool(os.getenv("OPENROUTER_API_KEY")),
        },
        "local": {
            "status": "online" if os.getenv("LOCAL_LLM_URL") else "unconfigured",
            "url": os.getenv("LOCAL_LLM_URL", "http://localhost:11434"),
        },
    }

    return {
        "agents": agents,
        "providers": providers,
        "failover": routing.get("failover", {}),
        "version": "2.0.0",
    }


@router.post("/invalidate-cache")
async def invalidate_cache(world_id: int):
    """Xóa bộ nhớ đệm cho một World cụ thể."""
    try:
        cache_manager.invalidate_world_cache(world_id)
        log.info("cache.invalidated", world_id=world_id)
        return {
            "status": "success",
            "message": f"Cache for world {world_id} invalidated.",
        }
    except Exception as e:
        log.exception("cache.invalidation_failed", world_id=world_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """
    Health check endpoint.

    Returns "healthy" when all required checks pass.
    In strict mode (LOOM_HEALTH_STRICT=true), a missing LLM API key
    causes "degraded" status. In permissive mode (default), a missing
    key is treated as acceptable.
    """
    strict = os.getenv("LOOM_HEALTH_STRICT", "false").lower() == "true"
    checks: dict[str, str] = {}

    # ── Redis ───────────────────────────────────────
    try:
        from utils.cache_manager import cache_manager

        if cache_manager.redis_available:
            cache_manager.redis_client.ping()
            checks["redis"] = "ok"
        else:
            checks["redis"] = "unavailable"
    except Exception as e:
        checks["redis"] = f"error: {e}"

    # ── Celery broker ────────────────────────────────
    try:
        from core.celery_app import celery_app

        conn = celery_app.connection()
        conn.ensure_connection(max_retries=1, timeout=3)
        conn.close()
        checks["celery_broker"] = "ok"
    except Exception as e:
        checks["celery_broker"] = f"error: {e}"

    # ── LLM providers ────────────────────────────────
    # Required providers are only enforced in strict mode.
    # In permissive mode, "not_configured" is treated as acceptable.
    all_llm_keys = {
        "openai": os.getenv("OPENAI_API_KEY"),
        "anthropic": os.getenv("ANTHROPIC_API_KEY"),
        "google": os.getenv("GOOGLE_API_KEY"),
    }

    for provider, key in all_llm_keys.items():
        check_key = f"llm_{provider}"
        if key:
            checks[check_key] = "configured"
        elif strict:
            checks[check_key] = "not_configured_strict"
        else:
            checks[check_key] = "not_configured"

    # ── Status determination ─────────────────────────
    required_vals = (
        ("ok", "configured") if strict else ("ok", "configured", "not_configured")
    )
    all_ok = all(v in required_vals for v in checks.values())
    return {"status": "healthy" if all_ok else "degraded", "checks": checks}


@router.get("/metrics")
async def get_metrics():
    from core.metrics import metrics

    return metrics.snapshot()
