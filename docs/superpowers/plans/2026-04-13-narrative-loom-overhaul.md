# Narrative Loom Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Design Spec:** `docs/superpowers/specs/2026-04-13-narrative-loom-overhaul-design.md`
**Scope:** Reliability, Observability, Architecture overhaul for narrative-loom
**Tech Stack:** Python 3.11, FastAPI, LangGraph, Celery, Redis, Pydantic, structlog

---

## Important Findings

- **ManifestoLoader decoupling (Spec Section 3.9) is NOT needed** — no agent imports `ManifestoLoader`. The API layer in `routers/chronicle.py` already pre-loads manifesto data into initial_state. This task is removed from the plan.
- **6 utility agents** (art_director, artifact_forger, audio_director, celebrity_synthesizer, history_scribe, intent_agent) operate on plain dict/Pydantic args, NOT NarrativeState. They are NOT in the LangGraph pipeline and don't use `@agent_node`. Tests for these are out of scope.
- **6 pipeline agents** need tests: archivist, chief_editor, critic, mythologist, news_anchor + the already-tested historian/psychologist/director/wordsmith/vfx_director.
- **All 16 agents have print() calls** — total ~28 print() calls to replace.

---

## File Structure

### New Files

| File | Responsibility |
|------|----------------|
| `narrative-loom/core/exceptions.py` | Error taxonomy: TransientLLMError, PermanentLLMError |
| `narrative-loom/core/metrics.py` | In-memory per-agent MetricsCollector |
| `narrative-loom/tests/test_health.py` | Health + metrics endpoint tests |
| `narrative-loom/tests/test_validation.py` | ChronicleRequest validation tests |

### Modified Files

| File | Changes |
|------|---------|
| `narrative-loom/core/agent_wrapper.py` | Narrow retry, integrate metrics, env-driven TOTAL_AGENTS |
| `narrative-loom/routers/chronicle.py` | Add Pydantic validators to ChronicleRequest |
| `narrative-loom/routers/system.py` | Add /health and /metrics endpoints |
| `narrative-loom/utils/llm_factory.py` | Cache key namespace fix, replace print→log, env-driven timeout |
| `narrative-loom/utils/cache_manager.py` | Replace print→log |
| `narrative-loom/graph_builder.py` | Env-driven LOOM_MAX_REVISIONS |
| `narrative-loom/tests/test_agents.py` | Add tests for archivist, chief_editor, critic, mythologist, news_anchor |
| `narrative-loom/agents/*.py` (all 16) | Replace print→log, wrap LLM errors where applicable |

---

## Task 1: Foundation — Error Taxonomy + Metrics

**Files:**
- Create: `narrative-loom/core/exceptions.py`
- Create: `narrative-loom/core/metrics.py`

- [ ] **Step 1: Create core/exceptions.py**

```python
"""
Error taxonomy for Narrative Loom.

Separates transient (retryable) from permanent (fail-fast) errors.
"""


class NarrativeLoomError(Exception):
    """Base exception for all Narrative Loom errors."""


class TransientLLMError(NarrativeLoomError):
    """Retryable LLM errors: timeout, rate limit, 5xx, connection reset."""


class PermanentLLMError(NarrativeLoomError):
    """Non-retryable: invalid API key, model not found, content policy violation."""


class PipelineError(NarrativeLoomError):
    """Pipeline-level failure (e.g., graph compilation error)."""
```

- [ ] **Step 2: Create core/metrics.py**

```python
"""
In-memory per-agent metrics collector for Narrative Loom.

Thread-safe singleton. Metrics are ephemeral (reset on process restart).
Access via the /metrics endpoint.
"""
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

- [ ] **Step 3: Commit**

```bash
git add narrative-loom/core/exceptions.py narrative-loom/core/metrics.py
git commit -m "feat(loom): add error taxonomy and metrics collector

- TransientLLMError for retryable errors (timeout, rate limit, 5xx)
- PermanentLLMError for fail-fast errors (bad API key, content policy)
- MetricsCollector: thread-safe per-agent metrics with /metrics snapshot

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

---

## Task 2: Narrow Retry Logic + Integrate Metrics

**Files:**
- Modify: `narrative-loom/core/agent_wrapper.py`

- [ ] **Step 1: Read current agent_wrapper.py**

- [ ] **Step 2: Replace _RETRYABLE and integrate metrics**

Changes:
1. Replace `_RETRYABLE = (Exception,)` with `_RETRYABLE = (TransientLLMError, ConnectionError, TimeoutError)`
2. Import `from core.exceptions import TransientLLMError`
3. Import `from core.metrics import metrics`
4. Replace `TOTAL_AGENTS = 18` with `TOTAL_AGENTS = int(os.getenv("LOOM_TOTAL_AGENTS", "18"))`
5. Add `import os`
6. In the wrapper function, after successful completion: `metrics.record_agent(name, duration_ms, success=True)`
7. In the error handler: `metrics.record_agent(name, duration_ms, success=False)`

- [ ] **Step 3: Commit**

```bash
git add narrative-loom/core/agent_wrapper.py
git commit -m "fix(loom): narrow retry to transient LLM errors only

- Only retry TransientLLMError, ConnectionError, TimeoutError
- No longer retries ValidationError, KeyError, TypeError etc.
- Integrate MetricsCollector for per-agent tracking
- TOTAL_AGENTS now config-driven via LOOM_TOTAL_AGENTS env var

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

---

## Task 3: Cache Key Namespace Fix + LLM Factory Logging

**Files:**
- Modify: `narrative-loom/utils/llm_factory.py`
- Modify: `narrative-loom/utils/cache_manager.py`

- [ ] **Step 1: Read both files**

- [ ] **Step 2: Fix TickBasedCache key namespace in llm_factory.py**

1. Add `provider` parameter to `TickBasedCache.__init__`
2. Update `lookup()` and `update()` to use `f"v1:{self.provider}:{llm_string}:{prompt}"`
3. Pass `provider` when constructing `TickBasedCache` in `get_llm()`:
   ```python
   cache = TickBasedCache(world_id, current_tick, provider=provider) if world_id is not None and current_tick is not None else None
   ```
4. Replace ALL `print(f"DEBUG: ...")` and `print(f"WARNING: ...")` with structured logging:
   ```python
   from core.logging import get_logger
   log = get_logger(__name__)
   ```
   - `print(f"DEBUG: Routing Agent...")` → `log.debug("llm.routing", agent=agent_id, provider=..., model=...)`
   - `print(f"WARNING: Routing failed...")` → `log.warning("llm.routing_failed", agent=agent_id, error=str(e))`
   - etc. for all 8 print() calls
5. Replace `timeout=20` with `int(os.getenv("LOOM_LLM_TIMEOUT", "20"))` in all provider blocks

- [ ] **Step 3: Replace print→log in cache_manager.py**

Replace all `print(f"DEBUG: ...")` calls with:
```python
from core.logging import get_logger
log = get_logger(__name__)
```
- `print("DEBUG: CacheManager - Redis Connected.")` → `log.info("cache.redis_connected")`
- `print(f"WARNING: CacheManager...")` → `log.warning("cache.redis_unavailable", error=str(e))`
- `print(f"DEBUG: Cache Hit...")` → `log.debug("cache.hit", world_id=..., age_ticks=...)`
- `print(f"DEBUG: Cache Expired...")` → `log.debug("cache.expired", world_id=..., age_ticks=...)`
- `print(f"DEBUG: Cache Invalidated...")` → `log.info("cache.invalidated", world_id=...)`
- Also remove `import logging` on line 50 (replaced by structlog)

- [ ] **Step 4: Commit**

```bash
git add narrative-loom/utils/llm_factory.py narrative-loom/utils/cache_manager.py
git commit -m "fix(loom): namespace cache keys by provider, replace print with structlog

- TickBasedCache keys now prefixed with v1:{provider} to prevent collision
- Both lookup() and update() use consistent key format
- All print() in llm_factory.py (8) and cache_manager.py (5) replaced with structlog
- LLM timeout now config-driven via LOOM_LLM_TIMEOUT env var

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

---

## Task 4: Input Validation + Config-Driven Limits

**Files:**
- Modify: `narrative-loom/routers/chronicle.py`
- Modify: `narrative-loom/graph_builder.py`

- [ ] **Step 1: Read both files**

- [ ] **Step 2: Add validators to ChronicleRequest**

In `routers/chronicle.py`, add `field_validator` import and validators:

```python
from pydantic import BaseModel, field_validator

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

- [ ] **Step 3: Config-driven max revisions in graph_builder.py**

Replace `if state.get("revision_count", 0) >= 2:` with:
```python
import os
_MAX_REVISIONS = int(os.getenv("LOOM_MAX_REVISIONS", "2"))

def check_revision(state: NarrativeState) -> str:
    fb = state.get("feedback", {})
    if fb.get("is_passed", True):
        return "The_Archivist"
    if state.get("revision_count", 0) >= _MAX_REVISIONS:
        return "The_Archivist"
    return "The_Wordsmith"
```

- [ ] **Step 4: Commit**

```bash
git add narrative-loom/routers/chronicle.py narrative-loom/graph_builder.py
git commit -m "feat(loom): add input validation and config-driven revision limit

- ChronicleRequest: world_id must be positive, tick_end >= tick_start
- Max revision count now env-driven via LOOM_MAX_REVISIONS (default: 2)

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

---

## Task 5: Health + Metrics Endpoints

**Files:**
- Modify: `narrative-loom/routers/system.py`

- [ ] **Step 1: Read current system.py**

- [ ] **Step 2: Add /health and /metrics endpoints**

After existing endpoints, add:

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

    # LLM providers (key presence only)
    for provider, env_key in [("openai", "OPENAI_API_KEY"), ("anthropic", "ANTHROPIC_API_KEY"), ("google", "GOOGLE_API_KEY")]:
        checks[f"llm_{provider}"] = "configured" if os.getenv(env_key) else "not_configured"

    all_ok = all(v in ("ok", "configured", "not_configured") for v in checks.values())
    return {"status": "healthy" if all_ok else "degraded", "checks": checks}


@router.get("/metrics")
async def get_metrics():
    from core.metrics import metrics
    return metrics.snapshot()
```

- [ ] **Step 3: Commit**

```bash
git add narrative-loom/routers/system.py
git commit -m "feat(loom): add /health and /metrics endpoints

- /health: checks Redis, Celery broker, LLM provider key presence
- /metrics: per-agent call count, avg duration, error count, retries

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

---

## Task 6: Replace print() in All Agents

**Files:**
- Modify: all 16 agent files in `narrative-loom/agents/`

- [ ] **Step 1: Bulk replace print→log in all agents**

For each agent file:
1. Add `from core.logging import get_logger` (if not already)
2. Add `log = get_logger(__name__)` after imports
3. Replace each `print(f"...")` with appropriate `log.debug(...)`, `log.info(...)`, or `log.warning(...)`

Pattern:
- `print("--- RUNNING AGENT: ...")` → `log.info("agent.run", agent="...")`
- `print(f"DEBUG: ...")` → `log.debug("agent.detail", ...)`
- `print(f"WARNING: ...")` → `log.warning("agent.warning", ...)`

- [ ] **Step 2: Wrap LLM errors in pipeline agents**

For agents that call `get_llm_for_agent` and are in the LangGraph pipeline (chief_editor, critic, historian, mythologist, news_anchor, psychologist, director, wordsmith, vfx_director):

Wrap the LLM invocation's try/except to classify errors:

```python
from core.exceptions import TransientLLMError

try:
    result = await chain.ainvoke(...)
except (TimeoutError, ConnectionError) as e:
    raise TransientLLMError(f"LLM connection error: {e}") from e
except Exception as e:
    err_str = str(e).lower()
    if any(kw in err_str for kw in ("rate_limit", "429", "503", "timeout", "connection")):
        raise TransientLLMError(f"Transient LLM error: {e}") from e
    raise  # Permanent error — fail fast
```

**Note:** Only add this wrapping to agents that don't already have their own try/except with fallback logic (like vfx_director which already handles errors gracefully).

- [ ] **Step 3: Commit**

```bash
git add narrative-loom/agents/
git commit -m "refactor(loom): replace print() with structlog, wrap LLM errors

- All 16 agent files: print() replaced with structured log calls
- Pipeline agents: LLM errors classified as TransientLLMError where appropriate
- Total: ~28 print() calls replaced

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

---

## Task 7: Test Coverage — Pipeline Agents

**Files:**
- Modify: `narrative-loom/tests/test_agents.py`

- [ ] **Step 1: Read existing test_agents.py**

- [ ] **Step 2: Add tests for untested pipeline agents**

Add tests for: `archivist`, `chief_editor`, `critic`, `mythologist`, `news_anchor`.

Each test follows the existing pattern:
1. Mock `get_llm_for_agent` (or `get_llm`) with RunnableLambda
2. Create appropriate state fixture
3. Call agent function
4. Assert `current_agent` and output fields

For `archivist` (no LLM): test it reads final_prose and sets current_agent.
For `critic`: test both pass and fail paths (is_passed: true/false).

- [ ] **Step 3: Commit**

```bash
git add narrative-loom/tests/test_agents.py
git commit -m "test(loom): add tests for archivist, chief_editor, critic, mythologist, news_anchor

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

---

## Task 8: Test Coverage — Health + Validation

**Files:**
- Create: `narrative-loom/tests/test_health.py`
- Create: `narrative-loom/tests/test_validation.py`

- [ ] **Step 1: Create test_health.py**

```python
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_endpoint_returns_status():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "checks" in data
    assert "redis" in data["checks"]


def test_metrics_endpoint_returns_structure():
    response = client.get("/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "pipeline" in data
    assert "agents" in data
```

- [ ] **Step 2: Create test_validation.py**

```python
import pytest
from routers.chronicle import ChronicleRequest
from pydantic import ValidationError


def test_valid_chronicle_request():
    req = ChronicleRequest(world_id=1, tick_start=10, tick_end=20)
    assert req.world_id == 1


def test_invalid_world_id():
    with pytest.raises(ValidationError):
        ChronicleRequest(world_id=0)

    with pytest.raises(ValidationError):
        ChronicleRequest(world_id=-1)


def test_tick_end_before_start():
    with pytest.raises(ValidationError):
        ChronicleRequest(world_id=1, tick_start=100, tick_end=50)


def test_tick_none_is_valid():
    req = ChronicleRequest(world_id=1, tick_start=None, tick_end=None)
    assert req.tick_start is None
```

- [ ] **Step 3: Commit**

```bash
git add narrative-loom/tests/test_health.py narrative-loom/tests/test_validation.py
git commit -m "test(loom): add health endpoint and input validation tests

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

---

## Task 9: Update .dev_status.md

- [ ] **Step 1: Update session status with overhaul progress**

- [ ] **Step 2: Commit**

```bash
git add .dev_status.md
git commit -m "docs: update dev status for narrative-loom overhaul

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Error taxonomy + Metrics collector | 2 new |
| 2 | Narrow retry + integrate metrics | 1 modified |
| 3 | Cache key fix + LLM factory/cache logging | 2 modified |
| 4 | Input validation + config-driven limits | 2 modified |
| 5 | Health + Metrics endpoints | 1 modified |
| 6 | Replace print→log in all agents + error wrapping | 16 modified |
| 7 | Agent tests (5 new) | 1 modified |
| 8 | Health + validation tests | 2 new |
| 9 | .dev_status.md | 1 modified |

**Total: 4 new files, ~22 modified files, 9 tasks**
