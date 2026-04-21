# Narrative Loom Technical Specification

## 1. Overview
Narrative Loom is a LangGraph-powered pipeline consisting of 16-18 nodes (engines + agents) that sequentially transform raw events into epic novels.

### Components
- **FastAPI:** REST API endpoints
- **Celery + Redis:** Background task queue
- **LangGraph:** Pipeline orchestration
- **Centrifugo:** Real-time WebSocket updates
- **16+ Agents:** LLM-powered processing nodes

## 2. Pipeline Phases
### Phase 1: Engines (Data Analysis)
- `Event_Normalizer`, `Universe_Bridge`, `Entropy_Engine`, `Style_Analyzer`, `Attractor_Engine`, `Dramatic_Arc`, `Phase_Engine`, `Singularity_Engine`.

### Phase 2: Agents (Content Creation)
- `Chief_Editor`, `Historian`, `Mythologist`, `Psychologist`, `Director`, `Wordsmith`, `Critic`, `Archivist`, `News_Anchor`, `VFX_Director`.

## 3. Key Features
- **Agent Wrapper:** Structured logging, Centrifugo publishing, Tenacity retry, duration tracking.
- **Dynamic LLM Routing:** Model selection per agent/world context.
- **Revision Loop:** Critic evaluation and Wordsmith regeneration.
- **Epistemic Layer:** Noise levels, resonance scars, and epistemic tiers.

## 4. API & Real-time
- Endpoints for weaving chronicles, status checks, actor intent, asset generation (image/sound), and health.
- Real-time updates via Centrifugo for pipeline and agent status.

## 5. Frontend Pages
- `/narrative-studio`: Chronicle weaving.
- `/dashboard/loom-workshop`: Central hub for all functions.
- `/dashboard/config/ai-settings`: AI model configuration.