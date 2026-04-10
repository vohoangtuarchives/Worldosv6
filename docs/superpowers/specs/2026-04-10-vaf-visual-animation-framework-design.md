# VAF — Visual Animation Framework Design Spec

**Date:** 2026-04-10
**Status:** Approved
**Scope:** Narrative-Loom VFX Director upgrade + Frontend VAF Engine + Cinematic Player

---

## 1. Overview

VAF (Visual Animation Framework) transforms Narrative-Loom chronicle output into cinematic visual experiences. The system has two parts:

1. **VFX Director upgrade** (Narrative-Loom, Python) — Expands the existing VFX Director agent to produce detailed animation scripts alongside the current vfx_config.
2. **VAF Engine + Cinematic Player** (Frontend, Next.js) — A new rendering engine that parses animation scripts and renders them as immersive cinematic sequences with scene backgrounds, particle effects, atmosphere, and camera movements.

### Architecture Flow

```
Narrative-Loom Pipeline
  └─ VFX Director (upgraded)
       ├─ vfx_config (existing: color, distortion, particles, filter)
       └─ animation_script (NEW: scenes, cameras, effects, transitions)
              │
              ▼
Backend (Laravel)
  └─ Chronicle model stores animation_script (JSON column)
       └─ API: GET /api/universes/{id}/chronicles/{chronicleId}
              │
              ▼
Frontend
  ├─ Library Tab → "Cinema" button per chronicle
  └─ /narrative-cinema/[chronicleId] → Cinematic Player
       └─ VAF Engine parses script → renders scenes
```

---

## 2. Animation Script Schema (VFX Director Output)

VFX Director produces `animation_script` alongside the existing `vfx_config`. The script describes a sequence of scenes with visual properties.

### Pydantic Models (Python)

```python
class AnimationScript(BaseModel):
    total_duration_ms: int                # Estimated total: 15,000-60,000ms
    scenes: list[Scene]                   # Sequential scene list (2-8 scenes typical)

class Scene(BaseModel):
    id: str                               # "scene_1", "scene_2", ...
    type: str                             # "establishing" | "action" | "tension" | "climax" | "resolution"
    duration_ms: int                      # 3,000-15,000ms per scene
    background: Background
    atmosphere: Atmosphere
    camera: CameraMovement
    effects: list[Effect]
    narration: str                        # Short text overlay for this scene
    transition: Transition                # How this scene transitions to the next

class Background(BaseModel):
    type: str                             # "gradient" | "image_prompt" | "solid" | "pattern"
    colors: list[str]                     # Hex color codes
    description: str                      # Descriptive text for procedural generation

class Atmosphere(BaseModel):
    filter: str                           # "mist" | "sepia" | "grain" | "glitch" | "aurora" | "dust" | "none"
    intensity: float                      # 0.0 - 1.0
    weather: str | None                   # "rain" | "snow" | "fire_embers" | "sandstorm" | None

class CameraMovement(BaseModel):
    type: str                             # "static" | "zoom_in" | "zoom_out" | "pan_left" | "pan_right" | "dolly" | "shake"
    speed: float                          # 0.1 (slow) - 2.0 (fast)
    easing: str                           # "ease-in" | "ease-out" | "ease-in-out" | "linear"

class Effect(BaseModel):
    type: str                             # "particles" | "screen_shake" | "flash" | "ripple" | "energy_burst" | "glow"
    intensity: float                      # 0.0 - 1.0
    color: str | None                     # Hex color, None = use primary_color from vfx_config
    trigger_at_ms: int                    # Trigger time relative to scene start

class Transition(BaseModel):
    type: str                             # "fade" | "dissolve" | "wipe_left" | "wipe_right" | "zoom_through" | "cut"
    duration_ms: int                      # 300-1,500ms
```

### Example Output

For a chronicle titled "The Fall of Iron Gate":

```json
{
  "total_duration_ms": 25000,
  "scenes": [
    {
      "id": "scene_1",
      "type": "establishing",
      "duration_ms": 8000,
      "background": {
        "type": "gradient",
        "colors": ["#1a0a2e", "#4a1942", "#ff6b35"],
        "description": "Sunset sky over an iron fortress"
      },
      "atmosphere": {
        "filter": "dust",
        "intensity": 0.6,
        "weather": "fire_embers"
      },
      "camera": {
        "type": "zoom_in",
        "speed": 0.3,
        "easing": "ease-in"
      },
      "effects": [
        {
          "type": "particles",
          "intensity": 0.4,
          "color": "#ff6b35",
          "trigger_at_ms": 0
        }
      ],
      "narration": "The Iron Gate had stood through three ages...",
      "transition": {
        "type": "dissolve",
        "duration_ms": 800
      }
    },
    {
      "id": "scene_2",
      "type": "climax",
      "duration_ms": 10000,
      "background": {
        "type": "gradient",
        "colors": ["#ff0000", "#8b0000", "#000000"],
        "description": "Flames engulfing the fortress walls"
      },
      "atmosphere": {
        "filter": "grain",
        "intensity": 0.8,
        "weather": "fire_embers"
      },
      "camera": {
        "type": "shake",
        "speed": 1.5,
        "easing": "linear"
      },
      "effects": [
        {
          "type": "screen_shake",
          "intensity": 0.7,
          "color": null,
          "trigger_at_ms": 0
        },
        {
          "type": "flash",
          "intensity": 0.9,
          "color": "#ffffff",
          "trigger_at_ms": 3000
        },
        {
          "type": "energy_burst",
          "intensity": 0.6,
          "color": "#ff4500",
          "trigger_at_ms": 5000
        }
      ],
      "narration": "Then the siege engines spoke, and iron bent like reed...",
      "transition": {
        "type": "fade",
        "duration_ms": 1200
      }
    },
    {
      "id": "scene_3",
      "type": "resolution",
      "duration_ms": 7000,
      "background": {
        "type": "gradient",
        "colors": ["#2d1b69", "#0d0d0d"],
        "description": "Smoke and silence over ruins"
      },
      "atmosphere": {
        "filter": "mist",
        "intensity": 0.5,
        "weather": null
      },
      "camera": {
        "type": "zoom_out",
        "speed": 0.2,
        "easing": "ease-out"
      },
      "effects": [
        {
          "type": "particles",
          "intensity": 0.2,
          "color": "#666666",
          "trigger_at_ms": 0
        }
      ],
      "narration": "Where the gate once stood, only ash remained.",
      "transition": {
        "type": "fade",
        "duration_ms": 1500
      }
    }
  ]
}
```

---

## 3. Frontend VAF Engine Architecture

### File Structure

```
frontend/src/lib/vaf/
├── engine.ts              # VAFEngine class — main orchestrator
├── types.ts               # TypeScript types mirroring Python schema
├── parsers/
│   └── script-parser.ts   # Validate & normalize animation script JSON
├── renderers/
│   ├── scene-renderer.tsx  # Component: renders one scene (2D Canvas + Framer Motion)
│   ├── background.tsx      # Gradient/pattern background rendering
│   ├── atmosphere.tsx      # Filter overlays (mist, sepia, grain, etc.)
│   ├── particles.tsx       # Particle system (Canvas 2D, upgradeable to Three.js)
│   ├── effects.tsx         # Screen shake, flash, ripple, energy burst
│   └── camera.tsx          # CSS transform-based camera movements
├── timeline/
│   ├── timeline.ts         # Timeline controller — play, pause, seek, scene navigation
│   └── scheduler.ts        # Effect scheduling — trigger effects at correct timestamp
└── hooks/
    ├── useVAFPlayer.ts     # Main hook: load script → init engine → expose controls
    └── useVAFTimeline.ts   # Timeline state hook (currentScene, progress, isPlaying)
```

### Data Flow

```
Chronicle click (Library Tab)
  → Navigate to /narrative-cinema/[chronicleId]
    → Fetch chronicle with animation_script via React Query
      → useVAFPlayer(animationScript)
        → script-parser validates JSON against schema
        → timeline.ts builds timeline from scenes array
        → VAFEngine orchestrates rendering:
            → For each scene (sequential):
              ├─ background.tsx renders gradient/pattern
              ├─ atmosphere.tsx applies CSS filters + canvas weather overlay
              ├─ camera.tsx applies CSS transforms on viewport container
              ├─ effects.tsx triggers at scheduled timestamps
              └─ particles.tsx runs Canvas 2D particle loop
            → transition renders between scenes
        → Exposes: play(), pause(), seek(sceneId), currentProgress
```

### Rendering Technology

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Background | CSS gradients, Framer Motion `animate` | Smooth, performant, GPU-accelerated |
| Atmosphere | CSS filters (blur, sepia, hue-rotate) + Canvas overlay for weather | Filters are GPU-accelerated, canvas for complex particles |
| Camera | CSS `transform: scale() translate()` on container, Framer Motion | No layout thrash, composited on GPU |
| Particles | Canvas 2D with `requestAnimationFrame` loop | Thousands of particles, no DOM overhead |
| Effects | Framer Motion variants — shake (rapid translate), flash (opacity), ripple (scale + opacity) | Declarative, interruptible animations |
| 3D upgrade path | React Three Fiber for scenes with importance > 0.8 | Existing dependency, optional enhancement |

### Performance Strategy

- Each renderer is a lazy-loaded component (`React.lazy`)
- Canvas particle system uses `OffscreenCanvas` when browser supports it (off-main-thread)
- Scene preloading: load scene N+1 resources while rendering scene N
- Auto-quality adjustment: if frame rate drops below 20fps, reduce particle density and disable weather effects

---

## 4. Cinematic Player Page

### Route

```
frontend/src/app/narrative-cinema/
├── [chronicleId]/
│   └── page.tsx           # Cinematic Player (client component)
└── layout.tsx             # Minimal dark layout, no dashboard shell
```

### UI Layout

```
┌─────────────────────────────────────────────────────┐
│  ← Back                          [Fullscreen] [gear]│  ← Minimal top bar, auto-hides after 3s
│                                                     │
│                                                     │
│            ┌──────────────────────┐                  │
│            │                      │                  │
│            │   SCENE VIEWPORT     │                  │
│            │   (Canvas + Overlays)│                  │
│            │                      │                  │
│            │   "Narration text    │                  │
│            │    appears here..."  │                  │
│            │                      │                  │
│            └──────────────────────┘                  │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ ▶ ████████░░░░░░░░░░░░░  Scene 1/4  03:12  │    │  ← Progress bar
│  │   [prev] [play/pause] [next]  [1] [2] [3]  │    │  ← Controls + scene dots
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Features

- **Auto-hide controls:** During playback, controls fade out after 3 seconds of inactivity. Mouse movement or touch re-shows them.
- **Scene navigation:** Click scene dots to jump to a specific scene. Progress bar is also seekable.
- **Fullscreen:** Uses native Fullscreen API for immersive experience.
- **Keyboard shortcuts:**
  - `Space` — play/pause
  - `←` / `→` — previous/next scene
  - `F` — toggle fullscreen
  - `Esc` — exit fullscreen or go back
- **Settings (gear icon):**
  - Playback speed: 0.5x, 1x, 1.5x, 2x
  - Particle quality: Low / Medium / High

### Entry Point

From Dashboard Library Tab:
- Each chronicle card shows a "Cinema" button (play icon)
- Button is disabled with tooltip "No animation available" when `animation_script` is null
- Click navigates to `/narrative-cinema/{chronicleId}`

---

## 5. VFX Director Upgrade (Narrative-Loom)

### Schema Changes

**File:** `narrative-loom/schemas.py`

Add the Pydantic models defined in Section 2 (AnimationScript, Scene, Background, Atmosphere, CameraMovement, Effect, Transition).

### Agent Changes

**File:** `narrative-loom/agents/vfx_director.py`

Current behavior (preserved):
- Reads entropy, distortion, genre from state
- Produces `vfx_config` with color, distortion, particle_density, atmosphere_filter

New behavior (added):
- Also reads `chronicle_content` (from Wordsmith output) and `dramatic_arc` (from Dramatic Arc Engine)
- Produces `animation_script` using structured output (Pydantic model binding via LangChain)
- Prompt instructs the LLM to:
  - Analyze the chronicle narrative and break it into 2-8 scenes
  - Assign scene types based on dramatic arc progression
  - Choose backgrounds, atmosphere, cameras, and effects that match the narrative mood
  - Use entropy/distortion values to calibrate effect intensity
  - Match genre aesthetic (Paleo → earth tones + dust; Sci-fi → neon + glitch)
- Fallback: if structured output fails, return `animation_script: None` and still return valid `vfx_config`

### Pipeline Adjustment

**File:** `narrative-loom/graph_builder.py`

Current flow:
```
The_Archivist → VFX_Director → END (parallel with News_Anchor)
```

New flow:
```
Wordsmith → VFX_Director → The_Archivist → News_Anchor → END
```

VFX Director now runs after Wordsmith because it needs the chronicle content to create meaningful scene breakdowns. The Archivist runs after VFX Director to archive the complete output including animation_script.

### API Response Update

**File:** `narrative-loom/routers/`

The `/tasks/{id}/status` endpoint response includes `animation_script` in the result payload when the task is complete.

---

## 6. Backend Changes (Laravel)

### Database Migration

Add `animation_script` JSON column to `chronicles` table:

```php
Schema::table('chronicles', function (Blueprint $table) {
    $table->json('animation_script')->nullable()->after('content');
});
```

### Model Update

**File:** `backend/app/Modules/Narrative/Models/Chronicle.php`

- Add `animation_script` to `$fillable`
- Add cast: `'animation_script' => 'array'`

### Action Update

The action that stores chronicle results from Narrative-Loom (StoreChronicle or equivalent) saves `animation_script` from the Loom response.

### API Resource

Chronicle API resource includes `animation_script`:
- **List endpoint** (`GET /api/universes/{id}/chronicles`): Returns `has_animation: boolean` flag (not the full script, to keep list responses lean)
- **Detail endpoint** (`GET /api/universes/{id}/chronicles/{chronicleId}`): Returns full `animation_script` JSON

---

## 7. Error Handling

| Scenario | Layer | Handling |
|----------|-------|----------|
| LLM fails to generate animation_script | Narrative-Loom | VFX Director returns `animation_script: null`, vfx_config still valid |
| animation_script JSON invalid/malformed | Frontend | script-parser rejects, player shows "Animation unavailable" with chronicle text fallback |
| Individual scene render crashes | Frontend | React Error Boundary per-scene, skip to next scene |
| Canvas performance drops below 20fps | Frontend | Auto-reduce particle density, disable weather effects |
| Network timeout fetching chronicle | Frontend | React Query retry 3x, show error state with retry button |
| Fullscreen API unavailable | Frontend | Hide fullscreen button, player works in normal viewport |

---

## 8. Testing Strategy

### Narrative-Loom (Python)

- **Unit test:** VFX Director agent with mocked LLM response — validate output conforms to AnimationScript schema
- **Unit test:** Fallback behavior — when LLM returns invalid JSON, vfx_config is still valid and animation_script is null
- **Integration test:** Run mini pipeline with fixtures (skip actual LLM calls), verify animation_script appears in final state

### Backend (Laravel)

- **Unit test:** Chronicle model correctly casts animation_script JSON to array and back
- **Feature test:** API detail endpoint returns animation_script when present, null when absent
- **Feature test:** API list endpoint returns `has_animation` boolean flag

### Frontend

- **Unit test:** `script-parser.ts` — validates correct schemas, rejects malformed ones
- **Unit test:** `timeline.ts` — calculates total duration, scene navigation, seek behavior
- **Component test:** `VAFPlayer` renders without crash with valid script
- **Component test:** `VAFPlayer` shows fallback UI with null/invalid script
- **Component test:** Individual renderers (background, particles, effects) render correctly for each type variant

---

## 9. Scope Boundaries (V1)

### In Scope

- VFX Director schema upgrade with animation_script output
- Pipeline reordering (VFX Director after Wordsmith)
- Backend migration + API changes
- Frontend VAF Engine (2D renderers)
- Cinematic Player page with full controls
- Library Tab "Cinema" button integration
- Error handling and fallback UI
- Unit and component tests

### Out of Scope (Future)

- Audio/soundtrack support
- User-editable animation scripts
- Animation script caching/CDN
- AI-generated images for scene backgrounds (V1 uses procedural gradients/patterns only)
- Multiplayer/shared viewing sessions
- Mobile-specific optimizations
- 3D scene rendering (architecture supports it, but V1 is 2D-only)
- Chronicle-driven fallback animations (V1 requires Loom-generated script)
