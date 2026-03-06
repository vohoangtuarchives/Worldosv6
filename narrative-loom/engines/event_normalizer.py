from typing import Dict, Any, List
from state import NarrativeState

class EventNormalizer:
    TYPE_MAP = {
        "king_killed": "assassination",
        "political_murder": "assassination",
        "death_event": "death",
    }

    def normalize_event(self, e: Dict[str, Any]) -> Dict[str, Any]:
        t = e.get("type")
        nt = self.TYPE_MAP.get(t, t)
        actors = []
        payload = e.get("raw_payload") or {}
        if isinstance(payload, dict):
            a = payload.get("actors") or payload.get("targets") or []
            if isinstance(a, list):
                actors = [str(x) for x in a]
            elif isinstance(a, str):
                actors = [a]
        return {
            "tick": e.get("from_tick") or e.get("tick"),
            "type": nt,
            "actors": actors,
            "payload": payload,
        }

def event_normalizer_node(state: NarrativeState, config: Dict[str, Any] = None) -> NarrativeState:
    raw = state.get("raw_chronicles", [])
    normalizer = EventNormalizer()
    normalized = [normalizer.normalize_event(e) for e in raw]
    return {**state, "normalized_events": normalized, "current_agent": "event_normalizer"}
