import pytest
import asyncio
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
