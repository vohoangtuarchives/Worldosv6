from typing import Dict, Any
from state import NarrativeState

def critic_agent(state: NarrativeState, config: Dict[str, Any] = None) -> NarrativeState:
    prose = state.get("final_prose", "") or ""
    ok = bool(prose.strip())
    report = {
        "pass": ok,
        "issues": [] if ok else ["empty prose"],
        "suggestions": [] if ok else ["regenerate with stronger tension"],
    }
    return {**state, "feedback": report, "current_agent": "critic"}
