# VAF (Visual Animation Framework) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a cinematic animation system that transforms Narrative-Loom chronicle output into immersive visual experiences rendered in a dedicated Cinematic Player.

**Architecture:** Upgrade the existing VFX Director agent in Narrative-Loom to produce detailed animation scripts (scenes, cameras, effects, transitions). Backend stores scripts as JSON on the Chronicle model. Frontend VAF Engine parses scripts and renders them using Canvas 2D + Framer Motion in a new Cinematic Player page.

**Tech Stack:** Python (LangGraph/Pydantic), PHP 8.3 (Laravel 13), TypeScript (Next.js 16 + React 19 + Framer Motion + Canvas 2D)

**Spec:** `docs/superpowers/specs/2026-04-10-vaf-visual-animation-framework-design.md`

---

## File Structure

### Narrative-Loom (Python) - Modified Files

| File | Action | Responsibility |
|------|--------|----------------|
| `narrative-loom/schemas.py` | Modify | Add AnimationScript Pydantic models |
| `narrative-loom/state.py` | Modify | Add animation_script field to NarrativeState |
| `narrative-loom/agents/vfx_director.py` | Modify | Upgrade to produce animation_script |
| `narrative-loom/graph_builder.py` | Modify | Reorder VFX Director after Wordsmith |
| `narrative-loom/tests/test_agents.py` | Modify | Add VFX Director tests |

### Backend (Laravel) - Modified/Created Files

| File | Action | Responsibility |
|------|--------|----------------|
| `backend/database/migrations/2026_04_10_100001_add_animation_script_to_chronicles_table.php` | Create | Add animation_script JSON column |
| `backend/app/Models/Chronicle.php` | Modify | Add animation_script to fillable + casts |
| `backend/app/Modules/WorldOS/Http/Resources/ChronicleResource.php` | Modify | Include has_animation flag + animation_script |
| `backend/app/Modules/WorldOS/Http/Controllers/NarrativeController.php` | Modify | Add chronicle detail endpoint |
| `backend/app/Modules/WorldOS/routes/api.php` | Modify | Add chronicle detail route |
| `backend/tests/Feature/ChronicleAnimationTest.php` | Create | Test animation_script API |

### Frontend (Next.js) - Created/Modified Files

| File | Action | Responsibility |
|------|--------|----------------|
| `frontend/src/types/api.ts` | Modify | Add AnimationScript types + has_animation to Chronicle |
| `frontend/src/lib/vaf/types.ts` | Create | Full VAF TypeScript type definitions |
| `frontend/src/lib/vaf/script-parser.ts` | Create | Validate animation scripts |
| `frontend/src/lib/vaf/timeline.ts` | Create | Timeline controller (play/pause/seek) |
| `frontend/src/lib/vaf/scheduler.ts` | Create | Effect scheduling at timestamps |
| `frontend/src/lib/vaf/renderers/background.tsx` | Create | CSS gradient background renderer |
| `frontend/src/lib/vaf/renderers/atmosphere.tsx` | Create | Filter + weather overlay renderer |
| `frontend/src/lib/vaf/renderers/particles.tsx` | Create | Canvas 2D particle system |
| `frontend/src/lib/vaf/renderers/effects.tsx` | Create | Screen shake, flash, ripple, glow |
| `frontend/src/lib/vaf/renderers/camera.tsx` | Create | CSS transform camera movements |
| `frontend/src/lib/vaf/renderers/scene-renderer.tsx` | Create | Compose all renderers per scene |
| `frontend/src/lib/vaf/hooks/useVAFPlayer.ts` | Create | Main player hook |
| `frontend/src/lib/vaf/hooks/useVAFTimeline.ts` | Create | Timeline state hook |
| `frontend/src/hooks/useChronicles.ts` | Modify | Add useChronicleDetail hook |
| `frontend/src/app/narrative-cinema/layout.tsx` | Create | Dark minimal layout |
| `frontend/src/app/narrative-cinema/[chronicleId]/page.tsx` | Create | Cinematic Player page |
| `frontend/src/components/dashboard/tabs/library/ChronicleList.tsx` | Modify | Add Cinema button |

---

## Task 1: Animation Script Pydantic Schemas (Narrative-Loom)

**Files:**
- Modify: `narrative-loom/schemas.py`
- Modify: `narrative-loom/state.py`

- [ ] **Step 1: Add AnimationScript models to schemas.py**

Open `narrative-loom/schemas.py` and append after the existing `CriticReview` class (line 34):

```python
# ── VAF Animation Script Models ─────────────────────────

class VAFBackground(BaseModel):
    type: str = Field(description="Background type: gradient | solid | pattern")
    colors: List[str] = Field(description="List of hex color codes")
    description: str = Field(description="Descriptive text for procedural generation")

class VAFAtmosphere(BaseModel):
    filter: str = Field(description="Atmosphere filter: mist | sepia | grain | glitch | aurora | dust | none")
    intensity: float = Field(description="Filter intensity 0.0 - 1.0")
    weather: str | None = Field(default=None, description="Weather effect: rain | snow | fire_embers | sandstorm | None")

class VAFCameraMovement(BaseModel):
    type: str = Field(description="Camera type: static | zoom_in | zoom_out | pan_left | pan_right | dolly | shake")
    speed: float = Field(description="Movement speed 0.1 (slow) - 2.0 (fast)")
    easing: str = Field(description="Easing function: ease-in | ease-out | ease-in-out | linear")

class VAFEffect(BaseModel):
    type: str = Field(description="Effect type: particles | screen_shake | flash | ripple | energy_burst | glow")
    intensity: float = Field(description="Effect intensity 0.0 - 1.0")
    color: str | None = Field(default=None, description="Hex color, None = use primary_color from vfx_config")
    trigger_at_ms: int = Field(description="Trigger time relative to scene start in milliseconds")

class VAFTransition(BaseModel):
    type: str = Field(description="Transition type: fade | dissolve | wipe_left | wipe_right | zoom_through | cut")
    duration_ms: int = Field(description="Transition duration 300-1500ms")

class VAFScene(BaseModel):
    id: str = Field(description="Scene identifier e.g. scene_1")
    type: str = Field(description="Scene type: establishing | action | tension | climax | resolution")
    duration_ms: int = Field(description="Scene duration 3000-15000ms")
    background: VAFBackground
    atmosphere: VAFAtmosphere
    camera: VAFCameraMovement
    effects: List[VAFEffect] = Field(default_factory=list)
    narration: str = Field(description="Short narration text overlay for this scene")
    transition: VAFTransition

class AnimationScript(BaseModel):
    total_duration_ms: int = Field(description="Total animation duration in milliseconds (15000-60000)")
    scenes: List[VAFScene] = Field(description="Sequential list of 2-8 scenes")
```

- [ ] **Step 2: Add animation_script field to NarrativeState**

Open `narrative-loom/state.py` and add after `vfx_hints` (line 55):

```python
    animation_script: Optional[dict]   # VAF animation script (from VFX Director)
```

- [ ] **Step 3: Verify no syntax errors**

Run:
```bash
docker compose -f deployment/docker-compose.prod.yml exec narrative-loom python -c "from schemas import AnimationScript; from state import NarrativeState; print('OK')"
```
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add narrative-loom/schemas.py narrative-loom/state.py
git commit -m "feat(loom): add AnimationScript Pydantic schemas and state field

Add VAF animation script models: VAFBackground, VAFAtmosphere,
VAFCameraMovement, VAFEffect, VAFTransition, VAFScene, AnimationScript.
Add animation_script field to NarrativeState TypedDict.

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

## Task 2: Upgrade VFX Director Agent (Narrative-Loom)

**Files:**
- Modify: `narrative-loom/agents/vfx_director.py`

- [ ] **Step 1: Write VFX Director test first**

Open `narrative-loom/tests/test_agents.py` and add at the end:

```python
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
```

Also add at the top of the file:
```python
import json
```

- [ ] **Step 2: Run the test — verify it fails**

```bash
docker compose -f deployment/docker-compose.prod.yml exec narrative-loom python -m pytest tests/test_agents.py::test_vfx_director_produces_animation_script tests/test_agents.py::test_vfx_director_fallback_on_error -v
```
Expected: FAIL — `vfx_director_agent` does not yet produce `animation_script`

- [ ] **Step 3: Rewrite vfx_director.py with animation script support**

Replace the entire content of `narrative-loom/agents/vfx_director.py` with:

```python
from core.agent_wrapper import agent_node
import os
import json
from typing import Dict, Any
from state import NarrativeState
from utils.llm_factory import get_llm, get_llm_for_agent
from nodes.universe_bridge import record_universe_whisper
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from typing import List, Optional

from schemas import AnimationScript


class VFXConfig(BaseModel):
    primary_color: str = Field(description="Hex color code (e.g. #ff4500 for Paleo, #00f3ff for Sci-fi)")
    distortion: float = Field(description="Reality distortion level (0.0 - 1.0)")
    particle_density: int = Field(description="Particle density (40 - 200)")
    atmosphere_filter: str = Field(description="Atmosphere filter (none, mist, sepia, grain, glitch, aurora, dust)")


class VFXDirectorOutput(BaseModel):
    vfx_config: VFXConfig
    animation_script: AnimationScript


vfx_director_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are the Visual Director & Cinematographer of NarrativeLoom.

Your dual mission:
1. Set VFX configuration (color palette, distortion, particles, atmosphere)
2. Create a cinematic animation script that breaks the narrative into visual scenes

Analyze the chronicle content, dramatic arc, entropy, and distortion to produce:
- A vfx_config with appropriate colors and effects for the genre/mood
- An animation_script with 2-6 scenes, each having background, atmosphere, camera movements, visual effects, and narration text

Scene type guidelines:
- "establishing": slow camera, atmospheric, sets the mood (beginning)
- "action": fast camera, screen shake, particles (conflict/battle)
- "tension": slow zoom, dark atmosphere, subtle effects (buildup)
- "climax": intense effects, camera shake, energy bursts (peak moment)
- "resolution": slow zoom out, mist/fade, calm (ending)

Genre aesthetic guidelines:
- Paleo/Ancient: earth tones (#8B4513, #CD853F), dust, sepia, slow
- Dark Fantasy: deep purples (#4a1942), fire_embers, grain, dramatic
- Sci-fi: neon (#00f3ff, #ff00ff), glitch, aurora, fast
- War/Conflict: reds (#8b0000), screen_shake, flash, intense

Return pure JSON matching the schema. No explanation text."""),
    ("human", """Simulation parameters:
- Entropy: {entropy}
- Reality Distortion: {distortion}
- Genre: {genre}
- Dramatic Arc: {dramatic_arc}

Chronicle content to visualize:
{chronicle_content}""")
])


@agent_node("vfx_director")
async def vfx_director_agent(state: NarrativeState, config: Dict[str, Any] = None) -> NarrativeState:
    print("--- RUNNING AGENT: THE VFX DIRECTOR (VISUAL EFFECTS + CINEMATOGRAPHY) ---")

    # Read inputs from state
    entropy = state.get("event_scores", {}).get("total_entropy", 0.5)
    distortion = state.get("singularity", {}).get("distortion", 0.0) if isinstance(state.get("singularity"), dict) else 0.0
    genre = state.get("genre", "generic")
    chronicle_content = state.get("final_prose", "")
    dramatic_arc = json.dumps(state.get("dramatic_arc", {}))

    # Dynamic LLM routing
    llm = get_llm_for_agent(
        "vfx_director",
        world_id=state.get("world_id"),
        current_tick=state.get("tick_end"),
        ai_runtime=state.get("ai_runtime"),
    )

    parser = JsonOutputParser(pydantic_object=VFXDirectorOutput)
    chain = vfx_director_prompt | llm | parser

    try:
        result = await chain.ainvoke({
            "entropy": str(entropy),
            "distortion": str(distortion),
            "genre": genre,
            "chronicle_content": chronicle_content[:3000],  # Limit to avoid token overflow
            "dramatic_arc": dramatic_arc,
        })
        vfx_config = result.get("vfx_config", {})
        animation_script = result.get("animation_script", None)
    except Exception as e:
        print(f"DEBUG: VFX Director error: {e}")
        vfx_config = {
            "primary_color": "#8b5cf6",
            "distortion": 0.4,
            "particle_density": 80,
            "atmosphere_filter": "none"
        }
        animation_script = None

    # Record cross-universe whisper if event is significant
    record_universe_whisper(state)

    return {
        **state,
        "vfx_config": vfx_config,
        "animation_script": animation_script,
        "current_agent": "vfx_director"
    }
```

- [ ] **Step 4: Run the tests — verify they pass**

```bash
docker compose -f deployment/docker-compose.prod.yml exec narrative-loom python -m pytest tests/test_agents.py::test_vfx_director_produces_animation_script tests/test_agents.py::test_vfx_director_fallback_on_error -v
```
Expected: Both PASS

- [ ] **Step 5: Commit**

```bash
git add narrative-loom/agents/vfx_director.py narrative-loom/tests/test_agents.py
git commit -m "feat(loom): upgrade VFX Director to produce animation scripts

VFX Director now outputs both vfx_config and animation_script.
Uses structured output with VFXDirectorOutput Pydantic model.
Reads chronicle content and dramatic arc for scene generation.
Falls back to null animation_script on LLM failure.

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

## Task 3: Reorder LangGraph Pipeline (Narrative-Loom)

**Files:**
- Modify: `narrative-loom/graph_builder.py`

- [ ] **Step 1: Update graph edges — VFX Director runs after Wordsmith**

Open `narrative-loom/graph_builder.py` and replace the section from line 95 to line 118:

**Replace:**
```python
    # The creation sequence
    workflow.add_edge("The_Psychologist", "The_Director")
    workflow.add_edge("The_Director", "The_Wordsmith")
    workflow.add_edge("The_Wordsmith", "The_Critic")

    # Conditional logic
    workflow.add_conditional_edges(
        "The_Critic",
        check_revision,
        {
            "The_Archivist": "The_Archivist",
            "The_Wordsmith": "The_Wordsmith"
        }
    )

    # PARALLEL FAN-OUT 3: Final rendering & export tasks
    workflow.add_edge("The_Archivist", "News_Anchor")
    workflow.add_edge("The_Archivist", "VFX_Director")

    # End of pipeline
    workflow.add_edge("News_Anchor", END)
    workflow.add_edge("VFX_Director", END)

    return workflow.compile()
```

**With:**
```python
    # The creation sequence
    workflow.add_edge("The_Psychologist", "The_Director")
    workflow.add_edge("The_Director", "The_Wordsmith")
    workflow.add_edge("The_Wordsmith", "The_Critic")

    # Conditional logic
    workflow.add_conditional_edges(
        "The_Critic",
        check_revision,
        {
            "The_Archivist": "VFX_Director",
            "The_Wordsmith": "The_Wordsmith"
        }
    )

    # VFX Director runs after Critic approves (needs final_prose from Wordsmith)
    workflow.add_edge("VFX_Director", "The_Archivist")

    # PARALLEL FAN-OUT 3: Final export tasks after archiving
    workflow.add_edge("The_Archivist", "News_Anchor")

    # End of pipeline
    workflow.add_edge("News_Anchor", END)

    return workflow.compile()
```

Key changes:
- Critic now routes to VFX_Director (not The_Archivist) when approved
- VFX_Director runs before The_Archivist so it has chronicle content
- News_Anchor is the only parallel fan-out after Archivist (VFX already ran)

- [ ] **Step 2: Verify the graph compiles**

```bash
docker compose -f deployment/docker-compose.prod.yml exec narrative-loom python -c "from graph_builder import build_graph; g = build_graph(); print('Graph compiled OK, nodes:', len(g.nodes))"
```
Expected: `Graph compiled OK, nodes: 16` (or similar number)

- [ ] **Step 3: Commit**

```bash
git add narrative-loom/graph_builder.py
git commit -m "feat(loom): reorder pipeline - VFX Director after Wordsmith

VFX Director now runs after The_Critic approves, before The_Archivist.
This gives VFX Director access to final_prose for scene generation.
News_Anchor remains as final parallel export after Archivist.

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

## Task 4: Backend Migration + Model Update (Laravel)

**Files:**
- Create: `backend/database/migrations/2026_04_10_100001_add_animation_script_to_chronicles_table.php`
- Modify: `backend/app/Models/Chronicle.php`

- [ ] **Step 1: Create the migration**

Create `backend/database/migrations/2026_04_10_100001_add_animation_script_to_chronicles_table.php`:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chronicles', function (Blueprint $table) {
            $table->json('animation_script')->nullable()->after('raw_payload');
        });
    }

    public function down(): void
    {
        Schema::table('chronicles', function (Blueprint $table) {
            $table->dropColumn('animation_script');
        });
    }
};
```

- [ ] **Step 2: Update Chronicle model**

Open `backend/app/Models/Chronicle.php`.

Replace line 10-13:
```php
    protected $fillable = [
        'universe_id', 'parent_id', 'actor_id', 'world_event_id', 'from_tick', 'to_tick', 'type', 'content', 'importance',
        'perceived_archive_snapshot', 'raw_payload'
    ];
```

With:
```php
    protected $fillable = [
        'universe_id', 'parent_id', 'actor_id', 'world_event_id', 'from_tick', 'to_tick', 'type', 'content', 'importance',
        'perceived_archive_snapshot', 'raw_payload', 'animation_script'
    ];
```

Replace lines 15-19:
```php
    protected $casts = [
        'perceived_archive_snapshot' => 'array',
        'raw_payload' => 'array',
        'importance' => 'float',
    ];
```

With:
```php
    protected $casts = [
        'perceived_archive_snapshot' => 'array',
        'raw_payload' => 'array',
        'animation_script' => 'array',
        'importance' => 'float',
    ];
```

- [ ] **Step 3: Run the migration**

```bash
docker compose -f deployment/docker-compose.prod.yml exec backend php artisan migrate
```
Expected: Migration runs successfully, adds `animation_script` column.

- [ ] **Step 4: Commit**

```bash
git add backend/database/migrations/2026_04_10_100001_add_animation_script_to_chronicles_table.php backend/app/Models/Chronicle.php
git commit -m "feat(backend): add animation_script JSON column to chronicles

Add nullable JSON column for storing VAF animation scripts.
Update Chronicle model with fillable + array cast.

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

## Task 5: Backend API — Chronicle Detail Endpoint + Resource Update

**Files:**
- Modify: `backend/app/Modules/WorldOS/Http/Resources/ChronicleResource.php`
- Modify: `backend/app/Modules/WorldOS/Http/Controllers/NarrativeController.php`
- Modify: `backend/app/Modules/WorldOS/routes/api.php`
- Create: `backend/tests/Feature/ChronicleAnimationTest.php`

- [ ] **Step 1: Write the feature test**

Create `backend/tests/Feature/ChronicleAnimationTest.php`:

```php
<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Chronicle;
use App\Models\Universe;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ChronicleAnimationTest extends TestCase
{
    use RefreshDatabase;

    private Universe $universe;

    protected function setUp(): void
    {
        parent::setUp();
        $this->universe = Universe::factory()->create();
    }

    public function test_chronicle_list_includes_has_animation_flag(): void
    {
        Chronicle::factory()->create([
            'universe_id' => $this->universe->id,
            'animation_script' => ['total_duration_ms' => 20000, 'scenes' => []],
        ]);
        Chronicle::factory()->create([
            'universe_id' => $this->universe->id,
            'animation_script' => null,
        ]);

        $response = $this->getJson("/api/worldos/universes/{$this->universe->id}/chronicles");

        $response->assertOk();
        $data = $response->json('data');
        $this->assertCount(2, $data);

        $withAnimation = collect($data)->firstWhere('has_animation', true);
        $withoutAnimation = collect($data)->firstWhere('has_animation', false);

        $this->assertNotNull($withAnimation);
        $this->assertNotNull($withoutAnimation);
        // List endpoint should NOT include full animation_script
        $this->assertArrayNotHasKey('animation_script', $withAnimation);
    }

    public function test_chronicle_detail_returns_animation_script(): void
    {
        $script = [
            'total_duration_ms' => 20000,
            'scenes' => [
                [
                    'id' => 'scene_1',
                    'type' => 'establishing',
                    'duration_ms' => 8000,
                    'background' => ['type' => 'gradient', 'colors' => ['#1a0a2e'], 'description' => 'Test'],
                    'atmosphere' => ['filter' => 'dust', 'intensity' => 0.6, 'weather' => null],
                    'camera' => ['type' => 'zoom_in', 'speed' => 0.3, 'easing' => 'ease-in'],
                    'effects' => [],
                    'narration' => 'Test narration',
                    'transition' => ['type' => 'fade', 'duration_ms' => 800],
                ],
            ],
        ];

        $chronicle = Chronicle::factory()->create([
            'universe_id' => $this->universe->id,
            'animation_script' => $script,
        ]);

        $response = $this->getJson("/api/worldos/universes/{$this->universe->id}/chronicles/{$chronicle->id}");

        $response->assertOk();
        $response->assertJsonPath('data.id', $chronicle->id);
        $response->assertJsonPath('data.animation_script.total_duration_ms', 20000);
        $response->assertJsonCount(1, 'data.animation_script.scenes');
    }

    public function test_chronicle_detail_returns_null_animation_script(): void
    {
        $chronicle = Chronicle::factory()->create([
            'universe_id' => $this->universe->id,
            'animation_script' => null,
        ]);

        $response = $this->getJson("/api/worldos/universes/{$this->universe->id}/chronicles/{$chronicle->id}");

        $response->assertOk();
        $response->assertJsonPath('data.animation_script', null);
    }
}
```

- [ ] **Step 2: Run test — verify it fails**

```bash
docker compose -f deployment/docker-compose.prod.yml exec backend php artisan test --filter=ChronicleAnimationTest
```
Expected: FAIL — detail endpoint does not exist yet

- [ ] **Step 3: Update ChronicleResource**

Replace the entire `toArray` method in `backend/app/Modules/WorldOS/Http/Resources/ChronicleResource.php`:

```php
    public function toArray(Request $request): array
    {
        $title = $this->raw_payload['title'] ?? null;
        $summary = $this->content ?: 'No summary available.';
        $isDetailRequest = $request->route('chronicleId') !== null;

        $data = [
            'id' => $this->id,
            'universe_id' => (int) $this->universe_id,
            'tick' => (int) ($this->to_tick ?: $this->from_tick),
            'from_tick' => (int) $this->from_tick,
            'to_tick' => (int) $this->to_tick,
            'title' => $title ?: ucfirst((string) $this->type) . ' Chronicle',
            'summary' => $summary,
            'content' => $this->content,
            'type' => WorldOsResourceSupport::chronicleType($this->type),
            'importance' => (float) $this->importance,
            'actor_id' => $this->actor_id,
            'world_event_id' => $this->world_event_id,
            'has_animation' => $this->animation_script !== null,
        ];

        // Only include full animation_script on detail requests
        if ($isDetailRequest) {
            $data['animation_script'] = $this->animation_script;
        }

        return $data;
    }
```

Note: The `$this->rawPayload` in the original uses dynamic property access. Check if the model uses snake_case (`raw_payload`) or camelCase (`rawPayload`). If the original uses camelCase via an accessor, keep that convention. The code above uses snake_case to match the model's `$fillable`.

- [ ] **Step 4: Add detail endpoint to NarrativeController**

Open `backend/app/Modules/WorldOS/Http/Controllers/NarrativeController.php` and add after the `chronicles` method (after line 26):

```php
    public function chronicleDetail(int $universeId, int $chronicleId): JsonResponse
    {
        $entity = $this->chronicleRepo->findById($chronicleId);

        if ($entity === null) {
            return response()->json(['message' => 'Chronicle not found.'], 404);
        }

        // Load the Eloquent model directly for the resource (includes animation_script)
        $chronicle = \App\Models\Chronicle::where('id', $chronicleId)
            ->where('universe_id', $universeId)
            ->firstOrFail();

        return (new ChronicleResource($chronicle))->response();
    }
```

- [ ] **Step 5: Add route**

Open `backend/app/Modules/WorldOS/routes/api.php` and add after line 29 (after the chronicles list route):

```php
    Route::get('universes/{id}/chronicles/{chronicleId}', [NarrativeController::class, 'chronicleDetail'])->name('worldos.universes.chronicles.detail');
```

- [ ] **Step 6: Run tests — verify they pass**

```bash
docker compose -f deployment/docker-compose.prod.yml exec backend php artisan test --filter=ChronicleAnimationTest
```
Expected: All 3 tests PASS

- [ ] **Step 7: Commit**

```bash
git add backend/app/Modules/WorldOS/Http/Resources/ChronicleResource.php backend/app/Modules/WorldOS/Http/Controllers/NarrativeController.php backend/app/Modules/WorldOS/routes/api.php backend/tests/Feature/ChronicleAnimationTest.php
git commit -m "feat(backend): add chronicle detail endpoint with animation_script

- ChronicleResource now includes has_animation flag in list responses
- New detail endpoint: GET /api/worldos/universes/{id}/chronicles/{chronicleId}
- Detail response includes full animation_script JSON
- Add feature tests for list flag and detail endpoint

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

## Task 6: Frontend VAF Types + Script Parser

**Files:**
- Modify: `frontend/src/types/api.ts`
- Create: `frontend/src/lib/vaf/types.ts`
- Create: `frontend/src/lib/vaf/script-parser.ts`

- [ ] **Step 1: Update Chronicle type in api.ts**

Open `frontend/src/types/api.ts` and replace the Chronicle interface (lines 121-134):

```typescript
export interface Chronicle {
  id: number;
  universe_id: number;
  tick: number;
  from_tick: number;
  to_tick: number;
  title: string;
  summary: string;
  content: string;
  type: string;
  importance: number;
  actor_id: number | null;
  world_event_id: number | null;
  has_animation: boolean;
}

export interface ChronicleDetail extends Chronicle {
  animation_script: AnimationScript | null;
}

export interface AnimationScript {
  total_duration_ms: number;
  scenes: VAFScene[];
}

export interface VAFScene {
  id: string;
  type: 'establishing' | 'action' | 'tension' | 'climax' | 'resolution';
  duration_ms: number;
  background: VAFBackground;
  atmosphere: VAFAtmosphere;
  camera: VAFCameraMovement;
  effects: VAFEffect[];
  narration: string;
  transition: VAFTransition;
}

export interface VAFBackground {
  type: 'gradient' | 'solid' | 'pattern';
  colors: string[];
  description: string;
}

export interface VAFAtmosphere {
  filter: 'mist' | 'sepia' | 'grain' | 'glitch' | 'aurora' | 'dust' | 'none';
  intensity: number;
  weather: 'rain' | 'snow' | 'fire_embers' | 'sandstorm' | null;
}

export interface VAFCameraMovement {
  type: 'static' | 'zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right' | 'dolly' | 'shake';
  speed: number;
  easing: 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
}

export interface VAFEffect {
  type: 'particles' | 'screen_shake' | 'flash' | 'ripple' | 'energy_burst' | 'glow';
  intensity: number;
  color: string | null;
  trigger_at_ms: number;
}

export interface VAFTransition {
  type: 'fade' | 'dissolve' | 'wipe_left' | 'wipe_right' | 'zoom_through' | 'cut';
  duration_ms: number;
}
```

- [ ] **Step 2: Create VAF types re-export file**

Create `frontend/src/lib/vaf/types.ts`:

```typescript
/**
 * VAF (Visual Animation Framework) type re-exports.
 *
 * All types are defined in @/types/api.ts for single-source-of-truth.
 * This file re-exports them for convenient imports within the VAF module.
 */
export type {
  AnimationScript,
  VAFScene,
  VAFBackground,
  VAFAtmosphere,
  VAFCameraMovement,
  VAFEffect,
  VAFTransition,
} from '@/types/api';
```

- [ ] **Step 3: Create script-parser.ts**

Create `frontend/src/lib/vaf/script-parser.ts`:

```typescript
import type { AnimationScript, VAFScene } from './types';

const VALID_SCENE_TYPES = ['establishing', 'action', 'tension', 'climax', 'resolution'] as const;
const VALID_BG_TYPES = ['gradient', 'solid', 'pattern'] as const;
const VALID_FILTERS = ['mist', 'sepia', 'grain', 'glitch', 'aurora', 'dust', 'none'] as const;
const VALID_WEATHER = ['rain', 'snow', 'fire_embers', 'sandstorm', null] as const;
const VALID_CAMERA_TYPES = ['static', 'zoom_in', 'zoom_out', 'pan_left', 'pan_right', 'dolly', 'shake'] as const;
const VALID_EFFECT_TYPES = ['particles', 'screen_shake', 'flash', 'ripple', 'energy_burst', 'glow'] as const;
const VALID_TRANSITION_TYPES = ['fade', 'dissolve', 'wipe_left', 'wipe_right', 'zoom_through', 'cut'] as const;
const VALID_EASINGS = ['ease-in', 'ease-out', 'ease-in-out', 'linear'] as const;

export interface ParseResult {
  ok: true;
  script: AnimationScript;
} | {
  ok: false;
  error: string;
}

function isValidScene(scene: unknown): scene is VAFScene {
  if (!scene || typeof scene !== 'object') return false;
  const s = scene as Record<string, unknown>;

  return (
    typeof s.id === 'string' &&
    VALID_SCENE_TYPES.includes(s.type as typeof VALID_SCENE_TYPES[number]) &&
    typeof s.duration_ms === 'number' && s.duration_ms > 0 &&
    s.background != null && typeof s.background === 'object' &&
    s.atmosphere != null && typeof s.atmosphere === 'object' &&
    s.camera != null && typeof s.camera === 'object' &&
    Array.isArray(s.effects) &&
    typeof s.narration === 'string' &&
    s.transition != null && typeof s.transition === 'object'
  );
}

/**
 * Validates an animation script from the API. Returns a typed result
 * so callers can show fallback UI on invalid data rather than crashing.
 */
export function parseAnimationScript(data: unknown): ParseResult {
  if (!data || typeof data !== 'object') {
    return { ok: false, error: 'Animation script is null or not an object' };
  }

  const script = data as Record<string, unknown>;

  if (typeof script.total_duration_ms !== 'number' || script.total_duration_ms <= 0) {
    return { ok: false, error: 'Invalid total_duration_ms' };
  }

  if (!Array.isArray(script.scenes) || script.scenes.length === 0) {
    return { ok: false, error: 'Scenes array is empty or missing' };
  }

  for (let i = 0; i < script.scenes.length; i++) {
    if (!isValidScene(script.scenes[i])) {
      return { ok: false, error: `Invalid scene at index ${i}` };
    }
  }

  return { ok: true, script: data as AnimationScript };
}
```

- [ ] **Step 4: Run TypeScript check**

```bash
docker compose -f deployment/docker-compose.prod.yml exec frontend npm run check
```
Expected: No TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/types/api.ts frontend/src/lib/vaf/types.ts frontend/src/lib/vaf/script-parser.ts
git commit -m "feat(frontend): add VAF types and script parser

- Extend Chronicle interface with has_animation flag
- Add ChronicleDetail with animation_script
- Add full VAF type hierarchy (scene, background, atmosphere, etc.)
- Script parser validates animation_script JSON with typed results

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

## Task 7: VAF Timeline Controller + Effect Scheduler

**Files:**
- Create: `frontend/src/lib/vaf/timeline.ts`
- Create: `frontend/src/lib/vaf/scheduler.ts`

- [ ] **Step 1: Create timeline.ts**

Create `frontend/src/lib/vaf/timeline.ts`:

```typescript
import type { AnimationScript, VAFScene } from './types';

export interface TimelineState {
  currentSceneIndex: number;
  currentScene: VAFScene;
  sceneElapsedMs: number;
  totalElapsedMs: number;
  totalDurationMs: number;
  isPlaying: boolean;
  isComplete: boolean;
  progress: number; // 0-1
  sceneCount: number;
}

export type TimelineListener = (state: TimelineState) => void;

/**
 * Controls playback of an animation script. Manages scene sequencing,
 * elapsed time tracking, play/pause/seek, and notifies listeners of state changes.
 */
export class Timeline {
  private script: AnimationScript;
  private sceneStartTimes: number[];
  private currentSceneIndex = 0;
  private sceneElapsedMs = 0;
  private totalElapsedMs = 0;
  private isPlaying = false;
  private playbackRate = 1;
  private lastFrameTime: number | null = null;
  private rafId: number | null = null;
  private listeners: Set<TimelineListener> = new Set();

  constructor(script: AnimationScript) {
    this.script = script;
    // Pre-compute absolute start times for each scene
    this.sceneStartTimes = [];
    let t = 0;
    for (const scene of script.scenes) {
      this.sceneStartTimes.push(t);
      t += scene.duration_ms;
    }
  }

  subscribe(listener: TimelineListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  getState(): TimelineState {
    return {
      currentSceneIndex: this.currentSceneIndex,
      currentScene: this.script.scenes[this.currentSceneIndex],
      sceneElapsedMs: this.sceneElapsedMs,
      totalElapsedMs: this.totalElapsedMs,
      totalDurationMs: this.script.total_duration_ms,
      isPlaying: this.isPlaying,
      isComplete: this.currentSceneIndex >= this.script.scenes.length,
      progress: Math.min(this.totalElapsedMs / this.script.total_duration_ms, 1),
      sceneCount: this.script.scenes.length,
    };
  }

  play(): void {
    if (this.isPlaying) return;
    if (this.currentSceneIndex >= this.script.scenes.length) {
      this.seekToScene(0); // restart if complete
    }
    this.isPlaying = true;
    this.lastFrameTime = performance.now();
    this.tick();
    this.notify();
  }

  pause(): void {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.lastFrameTime = null;
    this.notify();
  }

  seekToScene(index: number): void {
    if (index < 0 || index >= this.script.scenes.length) return;
    this.currentSceneIndex = index;
    this.sceneElapsedMs = 0;
    this.totalElapsedMs = this.sceneStartTimes[index];
    this.notify();
  }

  nextScene(): void {
    this.seekToScene(this.currentSceneIndex + 1);
  }

  prevScene(): void {
    // If we're more than 2s into the current scene, restart it; otherwise go back
    if (this.sceneElapsedMs > 2000) {
      this.sceneElapsedMs = 0;
      this.totalElapsedMs = this.sceneStartTimes[this.currentSceneIndex];
      this.notify();
    } else {
      this.seekToScene(this.currentSceneIndex - 1);
    }
  }

  setPlaybackRate(rate: number): void {
    this.playbackRate = Math.max(0.25, Math.min(4, rate));
  }

  destroy(): void {
    this.pause();
    this.listeners.clear();
  }

  private tick = (): void => {
    if (!this.isPlaying) return;
    const now = performance.now();
    const delta = (now - (this.lastFrameTime ?? now)) * this.playbackRate;
    this.lastFrameTime = now;

    this.sceneElapsedMs += delta;
    this.totalElapsedMs += delta;

    const currentScene = this.script.scenes[this.currentSceneIndex];
    if (currentScene && this.sceneElapsedMs >= currentScene.duration_ms) {
      // Advance to next scene
      this.currentSceneIndex++;
      this.sceneElapsedMs = 0;

      if (this.currentSceneIndex >= this.script.scenes.length) {
        this.isPlaying = false;
        this.notify();
        return;
      }
    }

    this.notify();
    this.rafId = requestAnimationFrame(this.tick);
  };

  private notify(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }
}
```

- [ ] **Step 2: Create scheduler.ts**

Create `frontend/src/lib/vaf/scheduler.ts`:

```typescript
import type { VAFEffect } from './types';

export type EffectCallback = (effect: VAFEffect) => void;

/**
 * Schedules effect triggers within a scene based on elapsed time.
 * Tracks which effects have fired so each triggers exactly once per scene.
 */
export class EffectScheduler {
  private effects: VAFEffect[];
  private firedSet: Set<number> = new Set();
  private callback: EffectCallback;

  constructor(effects: VAFEffect[], callback: EffectCallback) {
    this.effects = effects;
    this.callback = callback;
  }

  /**
   * Called each frame with the scene's elapsed time.
   * Fires any effects whose trigger_at_ms has been reached.
   */
  update(sceneElapsedMs: number): void {
    for (let i = 0; i < this.effects.length; i++) {
      if (this.firedSet.has(i)) continue;
      if (sceneElapsedMs >= this.effects[i].trigger_at_ms) {
        this.firedSet.add(i);
        this.callback(this.effects[i]);
      }
    }
  }

  /** Reset when entering a new scene. */
  reset(effects: VAFEffect[]): void {
    this.effects = effects;
    this.firedSet.clear();
  }

  destroy(): void {
    this.firedSet.clear();
  }
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
docker compose -f deployment/docker-compose.prod.yml exec frontend npm run check
```
Expected: No TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/vaf/timeline.ts frontend/src/lib/vaf/scheduler.ts
git commit -m "feat(frontend): add VAF timeline controller and effect scheduler

Timeline manages scene sequencing, play/pause/seek, and playback rate.
EffectScheduler triggers effects at correct timestamps within scenes.
Both are framework-agnostic (no React dependency) for testability.

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

## Task 8: VAF Renderers — Background + Atmosphere + Camera

**Files:**
- Create: `frontend/src/lib/vaf/renderers/background.tsx`
- Create: `frontend/src/lib/vaf/renderers/atmosphere.tsx`
- Create: `frontend/src/lib/vaf/renderers/camera.tsx`

- [ ] **Step 1: Create background.tsx**

Create `frontend/src/lib/vaf/renderers/background.tsx`:

```tsx
'use client';

import { motion } from 'framer-motion';
import type { VAFBackground } from '../types';

interface BackgroundRendererProps {
  background: VAFBackground;
  durationMs: number;
}

function buildGradient(colors: string[]): string {
  if (colors.length === 0) return 'linear-gradient(180deg, #000 0%, #111 100%)';
  if (colors.length === 1) return colors[0];
  const stops = colors.map((c, i) => `${c} ${Math.round((i / (colors.length - 1)) * 100)}%`);
  return `linear-gradient(180deg, ${stops.join(', ')})`;
}

function buildPattern(colors: string[]): string {
  const base = colors[0] ?? '#111';
  const accent = colors[1] ?? '#222';
  return `repeating-linear-gradient(45deg, ${base}, ${base} 10px, ${accent} 10px, ${accent} 20px)`;
}

export default function BackgroundRenderer({ background, durationMs }: BackgroundRendererProps) {
  let bg: string;
  switch (background.type) {
    case 'gradient':
      bg = buildGradient(background.colors);
      break;
    case 'solid':
      bg = background.colors[0] ?? '#000';
      break;
    case 'pattern':
      bg = buildPattern(background.colors);
      break;
    default:
      bg = '#000';
  }

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, background: bg }}
      exit={{ opacity: 0 }}
      transition={{ duration: Math.min(durationMs / 1000, 2), ease: 'easeInOut' }}
      aria-hidden
    />
  );
}
```

- [ ] **Step 2: Create atmosphere.tsx**

Create `frontend/src/lib/vaf/renderers/atmosphere.tsx`:

```tsx
'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { VAFAtmosphere } from '../types';

interface AtmosphereRendererProps {
  atmosphere: VAFAtmosphere;
  durationMs: number;
}

const FILTER_MAP: Record<string, string> = {
  mist: 'blur(1px) brightness(0.9)',
  sepia: 'sepia(0.7) brightness(0.85)',
  grain: 'contrast(1.1) brightness(0.95)',
  glitch: 'hue-rotate(90deg) saturate(1.5)',
  aurora: 'hue-rotate(180deg) brightness(1.1) saturate(1.3)',
  dust: 'sepia(0.3) brightness(0.9) contrast(1.05)',
  none: 'none',
};

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

function createWeatherParticles(weather: string, width: number, height: number): Particle[] {
  const count = 80;
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    switch (weather) {
      case 'rain':
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: -0.5,
          vy: 8 + Math.random() * 4,
          size: 1.5,
          alpha: 0.3 + Math.random() * 0.4,
          color: '#94a3b8',
        });
        break;
      case 'snow':
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.8,
          vy: 0.5 + Math.random() * 1,
          size: 2 + Math.random() * 3,
          alpha: 0.5 + Math.random() * 0.5,
          color: '#e2e8f0',
        });
        break;
      case 'fire_embers':
        particles.push({
          x: Math.random() * width,
          y: height + Math.random() * 20,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -(1 + Math.random() * 2),
          size: 1.5 + Math.random() * 2.5,
          alpha: 0.4 + Math.random() * 0.6,
          color: Math.random() > 0.5 ? '#ff6b35' : '#fbbf24',
        });
        break;
      case 'sandstorm':
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: 3 + Math.random() * 4,
          vy: (Math.random() - 0.5) * 2,
          size: 1 + Math.random() * 2,
          alpha: 0.2 + Math.random() * 0.3,
          color: '#d4a574',
        });
        break;
    }
  }
  return particles;
}

function WeatherCanvas({ weather, intensity }: { weather: string; intensity: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      particlesRef.current = createWeatherParticles(weather, canvas.width, canvas.height);
    };
    resize();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const ps = particlesRef.current;

      for (const p of ps) {
        p.x += p.vx * intensity;
        p.y += p.vy * intensity;

        // Wrap around
        if (p.y > canvas.height + 10) p.y = -10;
        if (p.y < -20) p.y = canvas.height + 10;
        if (p.x > canvas.width + 10) p.x = -10;
        if (p.x < -10) p.x = canvas.width + 10;

        ctx.globalAlpha = p.alpha * intensity;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(rafRef.current);
  }, [weather, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
    />
  );
}

export default function AtmosphereRenderer({ atmosphere, durationMs }: AtmosphereRendererProps) {
  const filterValue = FILTER_MAP[atmosphere.filter] ?? 'none';
  const filterIntensity = atmosphere.intensity;

  return (
    <>
      {/* CSS filter overlay */}
      {filterValue !== 'none' && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: filterIntensity }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
          style={{ filter: filterValue, mixBlendMode: 'overlay' }}
          aria-hidden
        />
      )}

      {/* Weather particle overlay */}
      {atmosphere.weather && (
        <WeatherCanvas weather={atmosphere.weather} intensity={atmosphere.intensity} />
      )}
    </>
  );
}
```

- [ ] **Step 3: Create camera.tsx**

Create `frontend/src/lib/vaf/renderers/camera.tsx`:

```tsx
'use client';

import { motion, type Variant } from 'framer-motion';
import type { VAFCameraMovement } from '../types';
import type { ReactNode } from 'react';

interface CameraRendererProps {
  camera: VAFCameraMovement;
  durationMs: number;
  children: ReactNode;
}

function getCameraTransform(camera: VAFCameraMovement): { initial: Variant; animate: Variant } {
  const duration = camera.speed; // Reused as relative factor

  switch (camera.type) {
    case 'zoom_in':
      return {
        initial: { scale: 1, x: 0, y: 0 },
        animate: { scale: 1.15, x: 0, y: 0 },
      };
    case 'zoom_out':
      return {
        initial: { scale: 1.15, x: 0, y: 0 },
        animate: { scale: 1, x: 0, y: 0 },
      };
    case 'pan_left':
      return {
        initial: { scale: 1.05, x: '3%', y: 0 },
        animate: { scale: 1.05, x: '-3%', y: 0 },
      };
    case 'pan_right':
      return {
        initial: { scale: 1.05, x: '-3%', y: 0 },
        animate: { scale: 1.05, x: '3%', y: 0 },
      };
    case 'dolly':
      return {
        initial: { scale: 1, x: 0, y: '2%' },
        animate: { scale: 1.1, x: 0, y: '-2%' },
      };
    case 'shake':
      // Shake is handled via CSS animation, provide static transform
      return {
        initial: { scale: 1, x: 0, y: 0 },
        animate: { scale: 1, x: 0, y: 0 },
      };
    case 'static':
    default:
      return {
        initial: { scale: 1, x: 0, y: 0 },
        animate: { scale: 1, x: 0, y: 0 },
      };
  }
}

function getEasing(easing: string): string {
  switch (easing) {
    case 'ease-in': return 'easeIn';
    case 'ease-out': return 'easeOut';
    case 'ease-in-out': return 'easeInOut';
    case 'linear': return 'linear';
    default: return 'easeInOut';
  }
}

export default function CameraRenderer({ camera, durationMs, children }: CameraRendererProps) {
  const { initial, animate } = getCameraTransform(camera);
  const transitionDuration = durationMs / 1000;

  return (
    <motion.div
      className={`absolute inset-0 overflow-hidden ${camera.type === 'shake' ? 'animate-[vaf-shake_0.15s_infinite]' : ''}`}
      initial={initial}
      animate={animate}
      transition={{
        duration: transitionDuration,
        ease: getEasing(camera.easing),
      }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 4: Run TypeScript check**

```bash
docker compose -f deployment/docker-compose.prod.yml exec frontend npm run check
```
Expected: No TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/vaf/renderers/background.tsx frontend/src/lib/vaf/renderers/atmosphere.tsx frontend/src/lib/vaf/renderers/camera.tsx
git commit -m "feat(frontend): add VAF background, atmosphere, and camera renderers

BackgroundRenderer: CSS gradients, solid colors, repeating patterns.
AtmosphereRenderer: CSS filters + Canvas weather particles (rain, snow, fire, sand).
CameraRenderer: Framer Motion transforms for zoom, pan, dolly, shake.

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

## Task 9: VAF Renderers — Particles + Effects + Scene Renderer

**Files:**
- Create: `frontend/src/lib/vaf/renderers/particles.tsx`
- Create: `frontend/src/lib/vaf/renderers/effects.tsx`
- Create: `frontend/src/lib/vaf/renderers/scene-renderer.tsx`

- [ ] **Step 1: Create particles.tsx**

Create `frontend/src/lib/vaf/renderers/particles.tsx`:

```tsx
'use client';

import { useRef, useEffect } from 'react';
import type { VAFEffect } from '../types';

interface ParticleRendererProps {
  effect: VAFEffect;
  primaryColor: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export default function ParticleRenderer({ effect, primaryColor }: ParticleRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const color = effect.color ?? primaryColor;
    const count = Math.round(60 * effect.intensity);
    const particles: Particle[] = [];

    // Spawn particles
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: -(0.5 + Math.random() * 1.5),
        size: 1 + Math.random() * 3,
        alpha: 0.3 + Math.random() * 0.7,
        life: Math.random() * 200,
        maxLife: 150 + Math.random() * 100,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        if (p.life > p.maxLife) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + 10;
          p.life = 0;
        }

        const fadeRatio = 1 - p.life / p.maxLife;
        ctx.globalAlpha = p.alpha * fadeRatio * effect.intensity;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        ctx.globalAlpha = p.alpha * fadeRatio * effect.intensity * 0.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(rafRef.current);
  }, [effect, primaryColor]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
    />
  );
}
```

- [ ] **Step 2: Create effects.tsx**

Create `frontend/src/lib/vaf/renderers/effects.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { VAFEffect } from '../types';
import ParticleRenderer from './particles';

interface EffectsRendererProps {
  activeEffects: VAFEffect[];
  primaryColor: string;
}

function ScreenShake({ intensity }: { intensity: number }) {
  const amplitude = intensity * 8;
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      animate={{
        x: [0, -amplitude, amplitude, -amplitude / 2, amplitude / 2, 0],
        y: [0, amplitude / 2, -amplitude / 2, amplitude, -amplitude, 0],
      }}
      transition={{ duration: 0.15, repeat: Infinity, repeatType: 'loop' }}
      aria-hidden
    />
  );
}

function FlashEffect({ intensity, color }: { intensity: number; color: string }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ backgroundColor: color }}
      initial={{ opacity: intensity }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      aria-hidden
    />
  );
}

function RippleEffect({ intensity, color }: { intensity: number; color: string }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      aria-hidden
    >
      <motion.div
        className="rounded-full"
        style={{ border: `2px solid ${color}`, width: 40, height: 40 }}
        initial={{ scale: 0.5, opacity: intensity }}
        animate={{ scale: 8, opacity: 0 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />
    </motion.div>
  );
}

function EnergyBurst({ intensity, color }: { intensity: number; color: string }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      aria-hidden
    >
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: `radial-gradient(circle, ${color}, transparent 70%)`, width: 200, height: 200 }}
        initial={{ scale: 0, opacity: intensity }}
        animate={{ scale: 3, opacity: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </motion.div>
  );
}

function GlowEffect({ intensity, color }: { intensity: number; color: string }) {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `radial-gradient(ellipse at center, ${color}40 0%, transparent 60%)`,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: intensity }}
      transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
      aria-hidden
    />
  );
}

export default function EffectsRenderer({ activeEffects, primaryColor }: EffectsRendererProps) {
  return (
    <AnimatePresence>
      {activeEffects.map((effect, i) => {
        const color = effect.color ?? primaryColor;
        const key = `${effect.type}-${i}-${effect.trigger_at_ms}`;

        switch (effect.type) {
          case 'particles':
            return <ParticleRenderer key={key} effect={effect} primaryColor={primaryColor} />;
          case 'screen_shake':
            return <ScreenShake key={key} intensity={effect.intensity} />;
          case 'flash':
            return <FlashEffect key={key} intensity={effect.intensity} color={color} />;
          case 'ripple':
            return <RippleEffect key={key} intensity={effect.intensity} color={color} />;
          case 'energy_burst':
            return <EnergyBurst key={key} intensity={effect.intensity} color={color} />;
          case 'glow':
            return <GlowEffect key={key} intensity={effect.intensity} color={color} />;
          default:
            return null;
        }
      })}
    </AnimatePresence>
  );
}
```

- [ ] **Step 3: Create scene-renderer.tsx**

Create `frontend/src/lib/vaf/renderers/scene-renderer.tsx`:

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { VAFScene, VAFEffect } from '../types';
import { EffectScheduler } from '../scheduler';
import BackgroundRenderer from './background';
import AtmosphereRenderer from './atmosphere';
import CameraRenderer from './camera';
import EffectsRenderer from './effects';

interface SceneRendererProps {
  scene: VAFScene;
  sceneElapsedMs: number;
  primaryColor: string;
}

const TRANSITION_MAP: Record<string, { initial: object; animate: object; exit: object }> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  dissolve: {
    initial: { opacity: 0, filter: 'blur(8px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
    exit: { opacity: 0, filter: 'blur(8px)' },
  },
  wipe_left: {
    initial: { clipPath: 'inset(0 100% 0 0)' },
    animate: { clipPath: 'inset(0 0 0 0)' },
    exit: { clipPath: 'inset(0 0 0 100%)' },
  },
  wipe_right: {
    initial: { clipPath: 'inset(0 0 0 100%)' },
    animate: { clipPath: 'inset(0 0 0 0)' },
    exit: { clipPath: 'inset(0 100% 0 0)' },
  },
  zoom_through: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 1.3, opacity: 0 },
  },
  cut: {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
};

export default function SceneRenderer({ scene, sceneElapsedMs, primaryColor }: SceneRendererProps) {
  const [activeEffects, setActiveEffects] = useState<VAFEffect[]>([]);

  const handleEffectTrigger = useCallback((effect: VAFEffect) => {
    setActiveEffects((prev) => [...prev, effect]);
    // Auto-remove non-persistent effects after 2 seconds
    if (effect.type !== 'particles' && effect.type !== 'glow') {
      setTimeout(() => {
        setActiveEffects((prev) => prev.filter((e) => e !== effect));
      }, 2000);
    }
  }, []);

  // Effect scheduling
  useEffect(() => {
    const scheduler = new EffectScheduler(scene.effects, handleEffectTrigger);
    const interval = setInterval(() => scheduler.update(sceneElapsedMs), 50);
    return () => {
      clearInterval(interval);
      scheduler.destroy();
    };
  }, [scene.id]); // Reset scheduler when scene changes

  // Update scheduler each frame
  useEffect(() => {
    // This is handled by the interval above reading sceneElapsedMs via closure
  }, [sceneElapsedMs]);

  // Clear active effects on scene change
  useEffect(() => {
    setActiveEffects([]);
  }, [scene.id]);

  const transition = TRANSITION_MAP[scene.transition.type] ?? TRANSITION_MAP.fade;
  const transitionDuration = scene.transition.duration_ms / 1000;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={scene.id}
        className="absolute inset-0"
        initial={transition.initial}
        animate={transition.animate}
        exit={transition.exit}
        transition={{ duration: transitionDuration }}
      >
        <CameraRenderer camera={scene.camera} durationMs={scene.duration_ms}>
          <BackgroundRenderer background={scene.background} durationMs={scene.duration_ms} />
          <AtmosphereRenderer atmosphere={scene.atmosphere} durationMs={scene.duration_ms} />
          <EffectsRenderer activeEffects={activeEffects} primaryColor={primaryColor} />
        </CameraRenderer>

        {/* Narration text overlay */}
        <motion.div
          className="absolute bottom-16 left-0 right-0 flex justify-center pointer-events-none z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 1.2 }}
        >
          <p className="max-w-2xl text-center text-lg md:text-xl font-serif text-white/90 leading-relaxed px-8 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {scene.narration}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 4: Run TypeScript check**

```bash
docker compose -f deployment/docker-compose.prod.yml exec frontend npm run check
```
Expected: No TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/vaf/renderers/particles.tsx frontend/src/lib/vaf/renderers/effects.tsx frontend/src/lib/vaf/renderers/scene-renderer.tsx
git commit -m "feat(frontend): add VAF particle, effects, and scene renderers

ParticleRenderer: Canvas 2D particle system with glow.
EffectsRenderer: screen_shake, flash, ripple, energy_burst, glow.
SceneRenderer: Composes all layers with transitions between scenes.

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

## Task 10: VAF Player Hooks + Chronicle Detail Hook

**Files:**
- Create: `frontend/src/lib/vaf/hooks/useVAFPlayer.ts`
- Create: `frontend/src/lib/vaf/hooks/useVAFTimeline.ts`
- Modify: `frontend/src/hooks/useChronicles.ts`

- [ ] **Step 1: Create useVAFTimeline.ts**

Create `frontend/src/lib/vaf/hooks/useVAFTimeline.ts`:

```typescript
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Timeline, type TimelineState } from '../timeline';
import type { AnimationScript } from '../types';

export function useVAFTimeline(script: AnimationScript | null) {
  const timelineRef = useRef<Timeline | null>(null);
  const [state, setState] = useState<TimelineState | null>(null);

  useEffect(() => {
    if (!script) {
      timelineRef.current = null;
      setState(null);
      return;
    }

    const timeline = new Timeline(script);
    timelineRef.current = timeline;

    const unsub = timeline.subscribe((s) => setState(s));

    return () => {
      unsub();
      timeline.destroy();
      timelineRef.current = null;
    };
  }, [script]);

  const play = useCallback(() => timelineRef.current?.play(), []);
  const pause = useCallback(() => timelineRef.current?.pause(), []);
  const nextScene = useCallback(() => timelineRef.current?.nextScene(), []);
  const prevScene = useCallback(() => timelineRef.current?.prevScene(), []);
  const seekToScene = useCallback((i: number) => timelineRef.current?.seekToScene(i), []);
  const setPlaybackRate = useCallback((r: number) => timelineRef.current?.setPlaybackRate(r), []);

  return {
    state,
    play,
    pause,
    nextScene,
    prevScene,
    seekToScene,
    setPlaybackRate,
  };
}
```

- [ ] **Step 2: Create useVAFPlayer.ts**

Create `frontend/src/lib/vaf/hooks/useVAFPlayer.ts`:

```typescript
'use client';

import { useMemo } from 'react';
import { parseAnimationScript } from '../script-parser';
import { useVAFTimeline } from './useVAFTimeline';
import type { AnimationScript } from '../types';

interface UseVAFPlayerResult {
  /** Whether the animation script is valid and renderable */
  isValid: boolean;
  /** Parse error message if invalid */
  error: string | null;
  /** Parsed animation script (null if invalid) */
  script: AnimationScript | null;
  /** Timeline controls and state */
  timeline: ReturnType<typeof useVAFTimeline>;
}

/**
 * Main hook for the VAF Cinematic Player.
 * Validates the animation script and provides timeline controls.
 */
export function useVAFPlayer(rawScript: unknown): UseVAFPlayerResult {
  const parsed = useMemo(() => parseAnimationScript(rawScript), [rawScript]);

  const validScript = parsed.ok ? parsed.script : null;
  const timeline = useVAFTimeline(validScript);

  return {
    isValid: parsed.ok,
    error: parsed.ok ? null : parsed.error,
    script: validScript,
    timeline,
  };
}
```

- [ ] **Step 3: Add useChronicleDetail hook**

Open `frontend/src/hooks/useChronicles.ts` and add after the `useChronicles` function (after line 25):

```typescript
export function useChronicleDetail(universeId: number | null, chronicleId: number | null) {
    const { data, error, isLoading } = useQuery<ChronicleDetail>({
        queryKey: ['universes', universeId, 'chronicles', chronicleId],
        queryFn: () =>
            api
                .get(`/worldos/universes/${universeId}/chronicles/${chronicleId}`)
                .then((res) => res.data),
        enabled: !!universeId && !!chronicleId,
        staleTime: 60000, // 1 minute — animation scripts don't change often
    });

    return {
        chronicle: data ?? null,
        isLoading,
        isError: !!error,
    };
}
```

Also update the import at line 6:
```typescript
import type { Chronicle, ChronicleDetail, MythScar, Artifact } from '@/types/api';
```

- [ ] **Step 4: Run TypeScript check**

```bash
docker compose -f deployment/docker-compose.prod.yml exec frontend npm run check
```
Expected: No TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/vaf/hooks/useVAFPlayer.ts frontend/src/lib/vaf/hooks/useVAFTimeline.ts frontend/src/hooks/useChronicles.ts
git commit -m "feat(frontend): add VAF player hooks and chronicle detail hook

useVAFPlayer: validates script + provides timeline controls.
useVAFTimeline: wraps Timeline class in React state.
useChronicleDetail: fetches single chronicle with animation_script.

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

## Task 11: Cinematic Player Page

**Files:**
- Create: `frontend/src/app/narrative-cinema/layout.tsx`
- Create: `frontend/src/app/narrative-cinema/[chronicleId]/page.tsx`
- Modify: `frontend/src/app/globals.css` (add shake keyframe)

- [ ] **Step 1: Add VAF shake keyframe to globals.css**

Open `frontend/src/app/globals.css` and add at the end:

```css
/* VAF - Visual Animation Framework keyframes */
@keyframes vaf-shake {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(-4px, 2px); }
  50% { transform: translate(4px, -2px); }
  75% { transform: translate(-2px, 4px); }
}
```

- [ ] **Step 2: Create cinema layout**

Create `frontend/src/app/narrative-cinema/layout.tsx`:

```tsx
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Cinematic Player — WorldOS',
};

export default function CinemaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Create Cinematic Player page**

Create `frontend/src/app/narrative-cinema/[chronicleId]/page.tsx`:

```tsx
'use client';

import { use, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Maximize,
  Settings,
} from 'lucide-react';

import { useChronicleDetail } from '@/hooks/useChronicles';
import { useVAFPlayer } from '@/lib/vaf/hooks/useVAFPlayer';
import SceneRenderer from '@/lib/vaf/renderers/scene-renderer';

interface PageParams {
  chronicleId: string;
}

export default function CinematicPlayerPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { chronicleId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const universeId = Number(searchParams.get('universe') ?? 0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { chronicle, isLoading, isError } = useChronicleDetail(
    universeId || null,
    Number(chronicleId) || null,
  );

  const { isValid, error, script, timeline } = useVAFPlayer(
    chronicle?.animation_script,
  );

  const { state, play, pause, nextScene, prevScene, seekToScene, setPlaybackRate } =
    timeline;

  // Auto-hide controls
  const [showControls, setShowControls] = useState(true);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    if (state?.isPlaying) {
      hideTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [state?.isPlaying]);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [state?.isPlaying, resetHideTimer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case ' ':
          e.preventDefault();
          state?.isPlaying ? pause() : play();
          break;
        case 'ArrowRight':
          nextScene();
          break;
        case 'ArrowLeft':
          prevScene();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'Escape':
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            router.back();
          }
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state, play, pause, nextScene, prevScene, router]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current?.requestFullscreen();
    }
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 animate-pulse">Loading chronicle...</div>
      </div>
    );
  }

  // Error states
  if (isError || !chronicle) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-400">Chronicle not found.</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-slate-400 hover:text-white transition"
        >
          Go back
        </button>
      </div>
    );
  }

  if (!isValid || !script || !state) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-8">
        <h2 className="text-xl font-bold text-white">{chronicle.title}</h2>
        <p className="text-slate-400 text-center max-w-lg">
          {error ?? 'No cinematic animation available for this chronicle.'}
        </p>
        <div className="bg-slate-900/50 rounded-xl p-6 max-w-2xl max-h-96 overflow-y-auto">
          <p className="text-sm text-slate-300 whitespace-pre-wrap">{chronicle.content}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="text-sm text-slate-400 hover:text-white transition"
        >
          Go back
        </button>
      </div>
    );
  }

  const progressPercent = Math.round(state.progress * 100);
  const primaryColor = '#8b5cf6'; // Default, could come from vfx_config

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-black overflow-hidden cursor-none"
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      {/* Scene Viewport */}
      <div className="absolute inset-0">
        <SceneRenderer
          scene={state.currentScene}
          sceneElapsedMs={state.sceneElapsedMs}
          primaryColor={primaryColor}
        />
      </div>

      {/* Controls overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-20 pointer-events-none"
          >
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent pointer-events-auto">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition"
              >
                <ArrowLeft size={18} />
                Back
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleFullscreen}
                  className="p-2 text-white/70 hover:text-white transition"
                  title="Fullscreen (F)"
                >
                  <Maximize size={18} />
                </button>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 text-white/70 hover:text-white transition"
                >
                  <Settings size={18} />
                </button>
              </div>
            </div>

            {/* Settings panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-14 right-4 bg-slate-900/95 rounded-xl p-4 border border-slate-700 pointer-events-auto z-30"
                >
                  <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Speed</div>
                  <div className="flex gap-2">
                    {[0.5, 1, 1.5, 2].map((r) => (
                      <button
                        key={r}
                        onClick={() => setPlaybackRate(r)}
                        className="px-3 py-1 text-sm rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition"
                      >
                        {r}x
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent pointer-events-auto">
              {/* Progress bar */}
              <div className="mb-3 relative">
                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-violet-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>

              {/* Controls row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button onClick={prevScene} className="text-white/70 hover:text-white transition" title="Previous scene">
                    <SkipBack size={20} />
                  </button>
                  <button
                    onClick={state.isPlaying ? pause : play}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition"
                    title={state.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                  >
                    {state.isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                  </button>
                  <button onClick={nextScene} className="text-white/70 hover:text-white transition" title="Next scene">
                    <SkipForward size={20} />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-sm text-white/60">
                  <span>Scene {state.currentSceneIndex + 1}/{state.sceneCount}</span>

                  {/* Scene dots */}
                  <div className="flex gap-1.5">
                    {Array.from({ length: state.sceneCount }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => seekToScene(i)}
                        className={`w-2 h-2 rounded-full transition ${
                          i === state.currentSceneIndex
                            ? 'bg-violet-400 scale-125'
                            : i < state.currentSceneIndex
                              ? 'bg-white/40'
                              : 'bg-white/20'
                        }`}
                        title={`Scene ${i + 1}`}
                      />
                    ))}
                  </div>

                  <span className="font-mono text-xs">
                    {formatTime(state.totalElapsedMs)} / {formatTime(state.totalDurationMs)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
```

- [ ] **Step 4: Run TypeScript check**

```bash
docker compose -f deployment/docker-compose.prod.yml exec frontend npm run check
```
Expected: No TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/narrative-cinema/ frontend/src/app/globals.css
git commit -m "feat(frontend): add Cinematic Player page and layout

Full-screen cinematic player at /narrative-cinema/[chronicleId].
Features: play/pause/seek, scene navigation, keyboard shortcuts,
fullscreen, auto-hide controls, playback speed settings.
Dark minimal layout separate from dashboard shell.

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

## Task 12: Integrate Cinema Button into ChronicleList

**Files:**
- Modify: `frontend/src/components/dashboard/tabs/library/ChronicleList.tsx`

- [ ] **Step 1: Add Cinema button to ChronicleList**

Open `frontend/src/components/dashboard/tabs/library/ChronicleList.tsx`.

Add to the imports at the top:
```typescript
import { ChevronDown, Clock, Play } from 'lucide-react';
import Link from 'next/link';
```
(Replace the existing `ChevronDown, Clock` import and add `Play` and `Link`)

Also add the universeId prop to the interface — replace lines 11-14:
```typescript
interface ChronicleListProps {
    chronicles: Chronicle[];
    searchTerm: string;
    universeId: number;
}
```

Update the function signature — replace line 32:
```typescript
export default function ChronicleList({ chronicles, searchTerm, universeId }: ChronicleListProps) {
```

Add Cinema button inside the chronicle card header. After the `BadgeLabel` (after line 87), add:

```tsx
                                    {chronicle.has_animation && (
                                        <Link
                                            href={`/narrative-cinema/${chronicle.id}?universe=${universeId}`}
                                            onClick={(e) => e.stopPropagation()}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-400 text-[10px] font-bold uppercase tracking-wider hover:bg-violet-500/30 transition"
                                            title="Watch cinematic animation"
                                        >
                                            <Play size={10} className="fill-current" />
                                            Cinema
                                        </Link>
                                    )}
```

- [ ] **Step 2: Update LibraryTab to pass universeId**

Check `frontend/src/components/dashboard/tabs/LibraryTab.tsx` — the `ChronicleList` component needs the `universeId` prop. If LibraryTab has access to `universeId` (it should via the dashboard context/hooks), pass it:

```tsx
<ChronicleList chronicles={chronicles} searchTerm={searchTerm} universeId={universeId} />
```

- [ ] **Step 3: Run TypeScript + ESLint check**

```bash
docker compose -f deployment/docker-compose.prod.yml exec frontend npm run check
```
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/dashboard/tabs/library/ChronicleList.tsx frontend/src/components/dashboard/tabs/LibraryTab.tsx
git commit -m "feat(frontend): add Cinema button to chronicle list

Chronicles with animation_script show a Cinema button that links
to the Cinematic Player page. Button uses stopPropagation to not
interfere with expand/collapse.

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```

## Task 13: Integration Test — End-to-End Smoke Test

**Files:** None (manual verification)

- [ ] **Step 1: Verify Narrative-Loom builds and tests pass**

```bash
docker compose -f deployment/docker-compose.prod.yml exec narrative-loom python -m pytest tests/ -v
```
Expected: All tests pass including VFX Director tests from Task 2

- [ ] **Step 2: Verify backend tests pass**

```bash
docker compose -f deployment/docker-compose.prod.yml exec backend php artisan test --filter=ChronicleAnimationTest
```
Expected: All 3 feature tests pass

- [ ] **Step 3: Verify frontend TypeScript check**

```bash
docker compose -f deployment/docker-compose.prod.yml exec frontend npm run check
```
Expected: No TypeScript errors

- [ ] **Step 4: Verify frontend builds**

```bash
docker compose -f deployment/docker-compose.prod.yml exec frontend npm run build
```
Expected: Build succeeds without errors

- [ ] **Step 5: Manual smoke test — seed animation_script**

Manually insert a test animation_script into a chronicle via tinker or migration seed:

```bash
docker compose -f deployment/docker-compose.prod.yml exec backend php artisan tinker --execute="
\$c = \App\Models\Chronicle::first();
if (\$c) {
    \$c->update(['animation_script' => [
        'total_duration_ms' => 20000,
        'scenes' => [
            [
                'id' => 'scene_1',
                'type' => 'establishing',
                'duration_ms' => 8000,
                'background' => ['type' => 'gradient', 'colors' => ['#1a0a2e', '#4a1942', '#ff6b35'], 'description' => 'Sunset over ruins'],
                'atmosphere' => ['filter' => 'dust', 'intensity' => 0.6, 'weather' => 'fire_embers'],
                'camera' => ['type' => 'zoom_in', 'speed' => 0.3, 'easing' => 'ease-in'],
                'effects' => [['type' => 'particles', 'intensity' => 0.4, 'color' => '#ff6b35', 'trigger_at_ms' => 0]],
                'narration' => 'The ancient fortress, once proud sentinel of the Northern Pass...',
                'transition' => ['type' => 'dissolve', 'duration_ms' => 800],
            ],
            [
                'id' => 'scene_2',
                'type' => 'climax',
                'duration_ms' => 7000,
                'background' => ['type' => 'gradient', 'colors' => ['#ff0000', '#8b0000', '#000'], 'description' => 'Flames engulf'],
                'atmosphere' => ['filter' => 'grain', 'intensity' => 0.8, 'weather' => 'fire_embers'],
                'camera' => ['type' => 'shake', 'speed' => 1.5, 'easing' => 'linear'],
                'effects' => [['type' => 'screen_shake', 'intensity' => 0.7, 'color' => null, 'trigger_at_ms' => 0], ['type' => 'flash', 'intensity' => 0.9, 'color' => '#ffffff', 'trigger_at_ms' => 3000]],
                'narration' => 'Then the siege engines spoke, and iron bent like reed...',
                'transition' => ['type' => 'fade', 'duration_ms' => 1200],
            ],
            [
                'id' => 'scene_3',
                'type' => 'resolution',
                'duration_ms' => 5000,
                'background' => ['type' => 'gradient', 'colors' => ['#2d1b69', '#0d0d0d'], 'description' => 'Smoke and silence'],
                'atmosphere' => ['filter' => 'mist', 'intensity' => 0.5, 'weather' => null],
                'camera' => ['type' => 'zoom_out', 'speed' => 0.2, 'easing' => 'ease-out'],
                'effects' => [['type' => 'glow', 'intensity' => 0.3, 'color' => '#666', 'trigger_at_ms' => 0]],
                'narration' => 'Where the gate once stood, only ash remained.',
                'transition' => ['type' => 'fade', 'duration_ms' => 1500],
            ],
        ],
    ]]);
    echo 'Animation script seeded for chronicle #' . \$c->id;
}
"
```

- [ ] **Step 6: Visual smoke test in browser**

1. Open the dashboard Library tab
2. Verify the seeded chronicle shows a purple "Cinema" button
3. Click the Cinema button
4. Verify the Cinematic Player opens at `/narrative-cinema/{id}?universe={uid}`
5. Verify Scene 1 plays with gradient background, dust particles, and zoom-in camera
6. Verify Scene 2 has screen shake and flash effects
7. Verify Scene 3 has mist atmosphere and zoom-out
8. Test play/pause (Space), next/prev scene (arrows), fullscreen (F)
9. Verify controls auto-hide during playback

- [ ] **Step 7: Final commit — all integration verified**

```bash
git add -A
git status
# If there are any remaining unstaged changes, commit them:
git commit -m "chore: VAF integration verification complete

All Narrative-Loom, backend, and frontend tests pass.
Manual smoke test confirms end-to-end cinematic playback.

Co-Authored-By: Claude Opus 4 <noreply@anthropic.com>"
```
