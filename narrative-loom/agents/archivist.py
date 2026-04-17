from core.agent_wrapper import agent_node
from core.logging import get_logger
import asyncio
from typing import Dict, Any
from state import NarrativeState
from utils.memory_manager import EpisodicMemoryManager

log = get_logger(__name__)

memory_db = EpisodicMemoryManager()

@agent_node("archivist")

async def archivist_agent(state: NarrativeState, config: Dict[str, Any] = None) -> NarrativeState:
    log.info("agent.run", agent="archivist")

    prose = state.get("final_prose", "")

    if prose and memory_db.enabled:
        # Lấy metadata
        world_id = state.get("world_id", 0)
        tick_start = state.get("tick_start", 0)
        tick_end = state.get("tick_end", 0)

        # Gom góp actor ids
        events = state.get("normalized_events", [])
        actors = set()
        for e in events:
            for a in e.get("actors", []):
                actors.add(str(a))

        metadata = {
            "world_id": world_id,
            "tick_start": tick_start if tick_start is not None else 0,
            "tick_end": tick_end if tick_end is not None else 0,
            "actors": ",".join(list(actors)),
            "agent": "qwen3.5-aggressive" # Ghi nhận model đã biên soạn số báo này
        }

        await asyncio.to_thread(memory_db.store_memory, prose, metadata)
        log.debug("agent.detail", agent="archivist", model="qwen3.5", event="memory_stored")
    elif not memory_db.enabled:
        log.warning("agent.warning", agent="archivist", reason="memory_db_disabled_missing_vector_db_libraries")

    return {}


