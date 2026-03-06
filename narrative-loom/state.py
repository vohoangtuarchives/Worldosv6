from typing import TypedDict, List, Dict, Any

class NarrativeState(TypedDict):
    world_id: int
    tick_start: int | None
    tick_end: int | None
    
    raw_chronicles: List[dict]
    normalized_events: List[dict]
    filtered_events: List[dict]
    event_scores: Dict[str, float]
    attractor_clusters: Dict[str, List[dict]]
    attractor_strength: Dict[str, float]
    dramatic_arc: Dict[str, Any]
    narrative_phase: str
    phase_score: float
    singularity: Dict[str, Any] | None
    
    historical_outline: str
    
    psychological_profiles: dict
    
    storyboard: str
    
    final_prose: str
    
    feedback: str
    
    current_agent: str
