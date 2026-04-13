import pytest
import asyncio
import json
from langchain_core.runnables import RunnableLambda

from agents.historian import historian_agent
from agents.psychologist import psychologist_agent
from agents.director import director_agent
from agents.wordsmith import wordsmith_agent
from state import NarrativeState

@pytest.fixture
def mock_llm(mocker):
    # Psychologist expects JSON output, others expect strings
    async def mock_invoke(prompt):
        if "Psychologist" in str(prompt) or "Tâm Lý Gia" in str(prompt):
            return '{"analysis": "Mocked LLM Response", "archetypes": []}'
        return "Mocked LLM Response"
    
    dummy_llm = RunnableLambda(mock_invoke)
    
    # Patch get_llm in each module scope
    mocker.patch("agents.historian.get_llm", return_value=dummy_llm)
    mocker.patch("agents.psychologist.get_llm", return_value=dummy_llm)
    mocker.patch("agents.director.get_llm", return_value=dummy_llm)
    mocker.patch("agents.wordsmith.get_llm", return_value=dummy_llm)
    
    return dummy_llm

@pytest.fixture
def mock_narrative_state():
    return {
        "world_id": 1,
        "tick_start": 100,
        "tick_end": 120,
        "raw_chronicles": [
            {
                "from_tick": 105,
                "type": "meaning_crisis",
                "raw_payload": {"description": "Philosophical crisis emerges."}
            }
        ],
        "historical_outline": "",
        "psychological_profiles": {"analysis": "Mock analysis"},
        "storyboard": "",
        "final_prose": "",
        "current_agent": "start",
        "feedback": {}
    }

@pytest.mark.asyncio
async def test_historian_agent(mock_llm, mock_narrative_state):
    state = await historian_agent(mock_narrative_state)
    assert "Mocked LLM Response" in state["historical_outline"]
    assert state["current_agent"] == "historian"

@pytest.mark.asyncio
async def test_psychologist_agent(mock_llm, mock_narrative_state):
    state = await psychologist_agent(mock_narrative_state)
    assert "Mocked LLM Response" in state["psychological_profiles"].get("analysis", "")
    assert state["current_agent"] == "psychologist"

@pytest.mark.asyncio
async def test_director_agent(mock_llm, mock_narrative_state):
    state = await director_agent(mock_narrative_state)
    assert "Mocked LLM Response" in state["storyboard"]
    assert state["current_agent"] == "director"

@pytest.mark.asyncio
async def test_wordsmith_agent(mock_llm, mock_narrative_state):
    state = await wordsmith_agent(mock_narrative_state)
    assert "Mocked LLM Response" in state["final_prose"]
    assert state["current_agent"] == "wordsmith"


from agents.vfx_director import vfx_director_agent

@pytest.fixture
def mock_vfx_llm(mocker):
    """Mock LLM that returns valid animation script JSON."""
    vfx_response = json.dumps({
        "vfx_config": {
            "primary_color": "#ff4500",
            "distortion": 0.6,
            "particle_density": 120,
            "atmosphere_filter": "dust"
        },
        "animation_script": {
            "total_duration_ms": 20000,
            "scenes": [
                {
                    "id": "scene_1",
                    "type": "establishing",
                    "duration_ms": 8000,
                    "background": {"type": "gradient", "colors": ["#1a0a2e", "#ff6b35"], "description": "Sunset over ruins"},
                    "atmosphere": {"filter": "dust", "intensity": 0.6, "weather": "fire_embers"},
                    "camera": {"type": "zoom_in", "speed": 0.3, "easing": "ease-in"},
                    "effects": [{"type": "particles", "intensity": 0.4, "color": "#ff6b35", "trigger_at_ms": 0}],
                    "narration": "The ancient fortress stood silent...",
                    "transition": {"type": "dissolve", "duration_ms": 800}
                },
                {
                    "id": "scene_2",
                    "type": "resolution",
                    "duration_ms": 7000,
                    "background": {"type": "gradient", "colors": ["#2d1b69", "#0d0d0d"], "description": "Darkness falls"},
                    "atmosphere": {"filter": "mist", "intensity": 0.5, "weather": None},
                    "camera": {"type": "zoom_out", "speed": 0.2, "easing": "ease-out"},
                    "effects": [],
                    "narration": "Only ash remained.",
                    "transition": {"type": "fade", "duration_ms": 1500}
                }
            ]
        }
    })

    async def mock_invoke(prompt):
        return vfx_response

    dummy_llm = RunnableLambda(mock_invoke)
    mocker.patch("agents.vfx_director.get_llm_for_agent", return_value=dummy_llm)
    return dummy_llm


@pytest.fixture
def vfx_narrative_state():
    """State with all fields VFX Director needs."""
    return {
        "world_id": 1,
        "tick_start": 100,
        "tick_end": 120,
        "ai_runtime": None,
        "event_scores": {"total_entropy": 0.7},
        "singularity": {"distortion": 0.4},
        "genre": "dark_fantasy",
        "news_headline": "The Iron Gate has fallen",
        "final_prose": "The ancient fortress, once proud sentinel of the Northern Pass, crumbled under the siege.",
        "dramatic_arc": {"rising_action": 0.6, "climax": 0.8},
        "current_agent": "archivist",
        "completed_agents": [],
        "task_id": "test-123",
    }


@pytest.mark.asyncio
async def test_vfx_director_produces_animation_script(mock_vfx_llm, vfx_narrative_state):
    state = await vfx_director_agent(vfx_narrative_state)
    assert state["current_agent"] == "vfx_director"
    assert "vfx_config" in state
    assert state["vfx_config"]["primary_color"] == "#ff4500"
    assert "animation_script" in state
    assert state["animation_script"]["total_duration_ms"] == 20000
    assert len(state["animation_script"]["scenes"]) == 2
    assert state["animation_script"]["scenes"][0]["type"] == "establishing"


@pytest.mark.asyncio
async def test_vfx_director_fallback_on_error(mocker, vfx_narrative_state):
    """When LLM fails, vfx_config has defaults and animation_script is None."""
    async def failing_invoke(prompt):
        raise RuntimeError("LLM unavailable")

    dummy_llm = RunnableLambda(failing_invoke)
    mocker.patch("agents.vfx_director.get_llm_for_agent", return_value=dummy_llm)

    state = await vfx_director_agent(vfx_narrative_state)
    assert state["vfx_config"]["primary_color"] == "#8b5cf6"  # fallback color
    assert state["animation_script"] is None
