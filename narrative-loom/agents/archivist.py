from core.agent_wrapper import agent_node
import asyncio
from typing import Dict, Any
from state import NarrativeState
from utils.memory_manager import EpisodicMemoryManager

memory_db = EpisodicMemoryManager()

@agent_node("archivist")

async def archivist_agent(state: NarrativeState, config: Dict[str, Any] = None) -> NarrativeState:
    print("--- RUNNING AGENT: THE ARCHIVIST (MEMORY WIRING) ---")

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
        print(f"DEBUG: Archivist (Model: qwen3.5) đã khắc ghi sử thi vào Tàng thư các.")
    elif not memory_db.enabled:
        print("DEBUG: Archivist bị vô hiệu hóa do thiếu thư viện Vector DB (chromadb/sentence-transformers).")

    return {**state, "current_agent": "archivist"}


