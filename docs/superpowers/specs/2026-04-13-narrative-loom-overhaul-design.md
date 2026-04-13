# Narrative Loom Comprehensive Overhaul — Design Spec

**Date:** 2026-04-13
**Status:** Draft
**Author:** Claude Opus 4 (AI)
**Scope:** Reliability, Observability, Architecture — comprehensive overhaul

---

## 1. Problem Statement

The Narrative Loom service (Python, LangGraph, 18 agents, 8 engines) has accumulated several reliability, observability, and architecture concerns:

1. **Retry logic too broad** — `_RETRYABLE = (Exception,)` retries ALL exceptions including logic errors (KeyError, TypeError, ValidationError), wasting tokens and delaying failure detection.
2. **No input validation** — `ChronicleRequest` accepts `tick_start > tick_end`, empty `world_id`, zero-length chronicles.
3. **Cache key collision** — `TickBasedCache` uses `f"{llm_string}:{prompt}"` but doesn't namespace by provider/model; identical prompts across providers may collide.
4. **No per-agent telemetry** — `agent_wrapper.py` logs duration but doesn't expose metrics (Prometheus, StatsD, or structured metrics endpoint).
5. **ManifestoLoader coupling** — Agents import `ManifestoLoader` directly, making unit tests require file I/O.
6. **Hard-coded limits** — `TOTAL_AGENTS=18`, `max_revision=2`, `CELERY_CONCURRENCY=2` are literals, not config-driven.
7. **Missing health endpoint** — `/` returns a hardcoded status string; no real health check for Redis, Celery, LLM providers.
8. **Test coverage gaps** — Only 5/18 agents have tests (historian, psychologist, director, wordsmith, vfx_director); 13 untested.
9. **No structured error taxonomy** — Errors are caught as generic `Exception`; no classification of transient vs permanent failures.
10. **print() debugging** — 15+ `print(f"DEBUG: ...")` statements scattered across `llm_factory.py`, `cache_manager.py`, agents.

---

## 2. Design Goals

| Goal | Metric |
|------|--------|
| **Retry only transient errors** | No retry on ValidationError, KeyError, TypeError |
| **Input validation at API boundary** | Invalid requests rejected with 422 before pipeline |
| **Cache isolation** | Cache keys include provider+model namespace |
| **Per-agent metrics** | Structured metrics dict accessible via `/metrics` endpoint |
| **Decoupled manifesto loading** | ManifestoLoader injected via state, not imported |
| **Config-driven limits** | All magic numbers from environment variables |
| **Real health check** | `/health` endpoint checks Redis, Celery broker, returns structured status |
| **Test coverage all agents** | Every agent has at least 1 test (success + error path); 13 agents currently untested |
| **Error taxonomy** | `TransientLLMError`, `PermanentLLMError` exception classes |
| **No print debugging** | All `print()` replaced with structured `log.*` calls |

---

## 3. Architecture Changes

### 3.1 Error Taxonomy (NEW: `core/exceptions.py`)

```python
class NarrativeLoomError(Exception):
    """Base exception for all Narrative Loom errors."""

class TransientLLMError(NarrativeLoomError):
    """Retryable LLM errors: timeout, rate limit, 5xx, connection reset."""

class PermanentLLMError(NarrativeLoomError):
    """Non-retryable: invalid API key, model not found, content policy."""

class ValidationError(NarrativeLoomError):
    """Invalid input data."""

class PipelineError(NarrativeLoomError):
    """Pipeline-level failure."""
```

### 3.2 Retry Logic Fix (`core/agent_wrapper.py`)

**Before:**
```python
_RETRYABLE = (Exception,)
```

**After:**
```python
from core.exceptions import TransientLLMError
_RETRYABLE = (TransientLLMError, ConnectionError, TimeoutError)
```

Each agent's try/except should wrap LLM errors:
```python
from core.exceptions import TransientLLMError, PermanentLLMError

try:
    result = await chain.ainvoke(...)
except (httpx.TimeoutException, httpx.ConnectError, ConnectionError) as e:
    raise TransientLLMError(f"LLM timeout/connection: {e}") from e
except Exception as e:
    if "rate_limit" in str(e).lower() or "429" in str(e):
        raise TransientLLMError(f"Rate limited: {e}") from e
    raise  # Don't wrap — let it fail fast
```

### 3.3 Input Validation (`routers/chronicle.py`)

Add Pydantic validators to `ChronicleRequest`:

```python
from pydantic import field_validator

class ChronicleRequest(BaseModel):
    world_id: int
    world_era: str | None = "genesis"
    tick_start: int | None = None
    tick_end: int | None = None
    genre: str | None = "generic"
    power_system: str | None = None
    whispers: list[str] | None = []
    ai_runtime: Dict[str, Any] | None = None

    @field_validator("world_id")
    @classmethod
    def world_id_positive(cls, v):
        if v <= 0:
            raise ValueError("world_id must be positive")
        return v

    @field_validator("tick_end")
    @classmethod
    def tick_end_after_start(cls, v, info):
        tick_start = info.data.get("tick_start")
        if tick_start is not None and v is not None and v < tick_start:
            raise ValueError("tick_end must be >= tick_start")
        return v
```

### 3.4 Cache Key Namespace Fix (`utils/llm_factory.py`)

**Before:**
```python
full_query = f"{llm_string}:{prompt}"
```

**After:**
```python
full_query = f"v1:{llm_string}:{prompt}"
```

The `llm_string` from LangChain already includes the model name and provider, but to be safe, the TickBasedCache constructor should also receive and store the provider:

```python
class TickBasedCache(BaseCache):
    def __init__(self, world_id: int, current_tick: int, provider: str = "unknown"):
        self.world_id = world_id
        self.current_tick = current_tick
        self.provider = provider

    def lookup(self, prompt: str, llm_string: str) -> Optional[Any]:
        full_query = f"v1:{self.provider}:{llm_string}:{prompt}"
        return cache_manager.get_cached_narrative(self.world_id, self.current_tick, full_query)

    def update(self, prompt: str, llm_string: str, return_val: Any) -> None:
        full_query = f"v1:{self.provider}:{llm_string}:{prompt}"
        if hasattr(return_val, "content"):
            cache_manager.set_cached_narrative(self.world_id, self.current_tick, full_query, return_val.content)
```

**IMPORTANT:** Both `lookup()` AND `update()` must use the same key format. Updating only `lookup()` would cause permanent cache misses.

### 3.5 Per-Agent Metrics (`core/metrics.py` NEW)

```python
import time
from collections import defaultdict
from dataclasses import dataclass, field
from threading import Lock

@dataclass
class AgentMetric:
    total_calls: int = 0
    total_duration_ms: int = 0
    errors: int = 0
    retries: int = 0
    last_duration_ms: int = 0

class MetricsCollector:
    def __init__(self):
        self._lock = Lock()
        self._agents: dict[str, AgentMetric] = defaultdict(AgentMetric)
        self._pipeline_runs: int = 0
        self._pipeline_errors: int = 0

    def record_agent(self, name: str, duration_ms: int, success: bool, retries: int = 0):
        with self._lock:
            m = self._agents[name]
            m.total_calls += 1
            m.total_duration_ms += duration_ms
            m.last_duration_ms = duration_ms
            m.retries += retries
            if not success:
                m.errors += 1

    def record_pipeline(self, success: bool):
        with self._lock:
            self._pipeline_runs += 1
            if not success:
                self._pipeline_errors += 1

    def snapshot(self) -> dict:
        with self._lock:
            return {
                "pipeline": {
                    "total_runs": self._pipeline_runs,
                    "errors": self._pipeline_errors,
                },
                "agents": {
                    name: {
                        "total_calls": m.total_calls,
                        "avg_duration_ms": m.total_duration_ms // max(m.total_calls, 1),
                        "last_duration_ms": m.last_duration_ms,
                        "errors": m.errors,
                        "retries": m.retries,
                    }
                    for name, m in self._agents.items()
                },
            }

metrics = MetricsCollector()
```

### 3.6 Health Endpoint (`routers/system.py`)

Replace the `/` endpoint and add `/health`:

```python
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

    # LLM providers (check API key presence only — not live call)
    for provider, env_key in [("openai", "OPENAI_API_KEY"), ("anthropic", "ANTHROPIC_API_KEY"), ("google", "GOOGLE_API_KEY")]:
        checks[f"llm_{provider}"] = "configured" if os.getenv(env_key) else "not_configured"

    all_ok = all(v in ("ok", "configured", "not_configured") for v in checks.values())
    return {"status": "healthy" if all_ok else "degraded", "checks": checks}
```

### 3.7 Metrics Endpoint (`routers/system.py`)

```python
@router.get("/metrics")
async def get_metrics():
    from core.metrics import metrics
    return metrics.snapshot()
```

### 3.8 Config-Driven Limits

Replace hard-coded values with environment variables:

| Current | Replacement |
|---------|-------------|
| `TOTAL_AGENTS = 18` in agent_wrapper.py | `int(os.getenv("LOOM_TOTAL_AGENTS", "18"))` |
| `>= 2` in check_revision (graph_builder.py) | `int(os.getenv("LOOM_MAX_REVISIONS", "2"))` |
| `concurrency=2` in celery_app.py | Already env-driven (checked) |
| `ttl_ticks = 800` in cache_manager.py | Already env-driven via `CACHE_TTL_TICKS` (checked) |
| `timeout=20` in llm_factory.py | `int(os.getenv("LOOM_LLM_TIMEOUT", "20"))` |

### 3.9 ManifestoLoader Decoupling

**Current:** Some agents call `loader.get_manifesto(...)` directly (file I/O on every call).

**Note:** The API layer in `routers/chronicle.py` already pre-loads `power_system_manifesto`, `era_context`, and `vfx_hints` into `initial_state` before dispatching to Celery. The decoupling work is therefore scoped to individual agents only — ensuring they read from `state.get(...)` instead of importing and calling the loader directly. No changes needed in `universe_bridge_node`.

Agents should read from state instead of importing loader:
```python
# Before: from utils.manifesto_loader import loader; manifesto = loader.get_manifesto(...)
# After:  manifesto = state.get("power_system_manifesto", "")
```

### 3.10 Replace print() with Structured Logging

All `print(f"DEBUG: ...")` and `print(f"WARNING: ...")` calls replaced with:
```python
from core.logging import get_logger
log = get_logger(__name__)

# print(f"DEBUG: Cache Hit...") →
log.debug("cache.hit", world_id=world_id, age_ticks=age)

# print(f"WARNING: ...") →
log.warning("routing.fallback", agent=agent_id, error=str(e))
```

**Files affected:** `utils/llm_factory.py` (8 print calls), `utils/cache_manager.py` (5 print calls), several agents.

### 3.11 Test Coverage for All Agents

Add tests for all untested agents. Pattern per agent:

```python
@pytest.fixture
def mock_{agent}_llm(mocker):
    async def mock_invoke(prompt):
        return "Mocked response for {agent}"
    dummy_llm = RunnableLambda(mock_invoke)
    mocker.patch("agents.{agent}.get_llm", return_value=dummy_llm)
    return dummy_llm

@pytest.mark.asyncio
async def test_{agent}_agent(mock_{agent}_llm, mock_narrative_state):
    state = await {agent}_agent(mock_narrative_state)
    assert state["current_agent"] == "{agent}"
    # Assert agent-specific output field is populated
```

Agents needing tests: `archivist`, `chief_editor`, `critic`, `mythologist`, `news_anchor`, `art_director`, `artifact_forger`, `audio_director`, `celebrity_synthesizer`, `history_scribe`, `intent_agent`.

Also add `tests/test_health.py` and `tests/test_metrics.py` for new endpoints.

---

## 4. File Structure Summary

### New Files

| File | Responsibility |
|------|----------------|
| `core/exceptions.py` | Error taxonomy classes |
| `core/metrics.py` | In-memory per-agent metrics collector |
| `tests/test_health.py` | Health + metrics endpoint tests |
| `tests/test_validation.py` | ChronicleRequest validation tests |

### Modified Files

| File | Changes |
|------|---------|
| `core/agent_wrapper.py` | Narrow retry to `TransientLLMError`, integrate metrics, env-driven `TOTAL_AGENTS` |
| `routers/chronicle.py` | Add Pydantic validators to `ChronicleRequest` |
| `routers/system.py` | Add `/health` and `/metrics` endpoints |
| `utils/llm_factory.py` | Fix cache key namespace, replace print() with log, env-driven timeout |
| `utils/cache_manager.py` | Replace print() with structured logging |
| `graph_builder.py` | Env-driven `LOOM_MAX_REVISIONS` |
| `tests/test_agents.py` | Add tests for remaining 11 agents |
| Various agents | Replace `loader.get_manifesto()` with `state.get()`, wrap LLM errors |

---

## 5. Migration Notes

- **No database migration needed** — all changes are Python-only.
- **No breaking API changes** — existing endpoints behave identically.
- **New endpoints are additive** — `/health` and `/metrics` are new.
- **Environment variables are optional** — all have sensible defaults matching current behavior.
- **Cache key format change** — existing cache entries will miss (cold cache) after deployment due to key prefix change. This is safe — cache misses just trigger a fresh LLM call.

---

## 6. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Narrowed retry causes agents to fail fast | Medium | Low | TransientLLMError covers timeout/rate-limit/5xx; logic errors should fail fast |
| Cache key change causes temporary cache miss storm | Low | Low | Cache has 24h Redis TTL; misses just mean fresh LLM calls |
| Manifesto decoupling breaks agent if state field missing | Low | Medium | Agents already have fallback defaults; `state.get("...", "")` is safe |
| print() removal hides useful debug info | Low | Low | Structlog debug level preserves all info; just requires `LOG_LEVEL=DEBUG` |

---

## 7. Implementation Order

1. `core/exceptions.py` (foundation — no deps)
2. `core/metrics.py` (foundation — no deps)
3. `core/agent_wrapper.py` (depends on 1, 2)
4. `utils/llm_factory.py` (cache fix + logging)
5. `utils/cache_manager.py` (logging)
6. `routers/chronicle.py` (validation)
7. `routers/system.py` (health + metrics)
8. `graph_builder.py` (config-driven revision)
9. Agent manifesto decoupling (all agents that use loader)
10. Agent LLM error wrapping (all agents)
11. Tests — all agents + health + validation
12. Final print() cleanup pass
