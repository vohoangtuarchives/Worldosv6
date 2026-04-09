"""
Agent node middleware for Narrative Loom.

The `agent_node` decorator wraps any LangGraph node function with:
  1. Structured logging (structlog)
  2. Centrifugo publish on start / done / error
  3. Tenacity retry (up to 3 attempts, exponential backoff)
  4. Duration tracking

Usage in agent files:
    from core.agent_wrapper import agent_node

    @agent_node("historian")
    async def historian_agent(state: NarrativeState, config=None) -> NarrativeState:
        ...
"""
import time
from functools import wraps
from typing import Any, Callable, Coroutine

from tenacity import (
    RetryError,
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from core.centrifugo import (
    publish_agent_done,
    publish_agent_error,
    publish_agent_started,
)
from core.logging import get_logger

log = get_logger(__name__)

# Number of agents in the full pipeline — used for progress % calculation
TOTAL_AGENTS = 18

# Exception types that are worth retrying (transient LLM errors)
_RETRYABLE = (Exception,)  # broad — tenacity will not retry on BaseException


def _make_retrying(fn: Callable) -> Callable:
    """Wrap async callable with tenacity retry policy."""

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type(_RETRYABLE),
    )
    async def _inner(*args, **kwargs):
        return await fn(*args, **kwargs)

    return _inner


def agent_node(name: str) -> Callable:
    """
    Decorator factory.

    @agent_node("historian")
    async def historian_agent(state, config=None) -> NarrativeState: ...
    """

    def decorator(fn: Callable[..., Coroutine[Any, Any, Any]]) -> Callable:
        retrying_fn = _make_retrying(fn)

        @wraps(fn)
        async def wrapper(state: dict, config: dict | None = None) -> dict:
            world_id: int = state.get("world_id", 0)
            task_id: str = state.get("task_id", "unknown")
            completed: list = state.get("completed_agents", [])

            log.info("agent.start", agent=name, world_id=world_id, task_id=task_id)
            publish_agent_started(world_id, task_id, name)

            t_start = time.perf_counter()

            try:
                result: dict = await retrying_fn(state, config)
            except RetryError as exc:
                duration_ms = int((time.perf_counter() - t_start) * 1000)
                log.error(
                    "agent.failed_after_retries",
                    agent=name,
                    world_id=world_id,
                    task_id=task_id,
                    duration_ms=duration_ms,
                    error=str(exc),
                )
                publish_agent_error(world_id, task_id, name, str(exc))
                # Propagate — LangGraph will surface this as a pipeline error
                raise
            except Exception as exc:
                duration_ms = int((time.perf_counter() - t_start) * 1000)
                log.error(
                    "agent.error",
                    agent=name,
                    world_id=world_id,
                    task_id=task_id,
                    duration_ms=duration_ms,
                    error=str(exc),
                )
                publish_agent_error(world_id, task_id, name, str(exc))
                raise

            duration_ms = int((time.perf_counter() - t_start) * 1000)
            new_completed = completed + [name]

            log.info(
                "agent.done",
                agent=name,
                world_id=world_id,
                task_id=task_id,
                duration_ms=duration_ms,
                completed=len(new_completed),
                total=TOTAL_AGENTS,
            )
            publish_agent_done(
                world_id, task_id, name, duration_ms, len(new_completed), TOTAL_AGENTS
            )

            # Merge completed_agents back into result state
            return {**result, "completed_agents": new_completed}

        return wrapper

    return decorator
