# 05 — The Narrative Engine (Resonance)

## 5.1 Philosophy: Physics Drives Story
In WorldOS V3, we do not write stories; we **simulate conditions** that make stories inevitable.
- We don't say "A rebellion happened."
- We simulate `Inequality = 0.9` and `Trauma = 0.8`.
- The system naturally spawns a `REBEL_LEADER`.
- The interactions between the Leader and the State *become* the story.

## 5.2 The Resonance Listener
`App\Domains\Vietnamese\Listeners\CheckHeroSpawningListener`

This listener monitors the `WorldTicked` event.

### Thresholds & Archetypes
| Condition | Archetype Spawned | Description |
| :--- | :--- | :--- |
| `Entropy > 0.8` | `REBEL_LEADER` | Calls for change amidst chaos. |
| `Entropy > 0.9` | `SAVIOR` | Emergency interventions in apocalypse. |
| `Order > 0.9` | `REFORMER` | Internal change within tyranny. |
| `Order > 0.95`| `PHILOSOPHER_KING`| Enlightened absolutist. |
| `Cohesion < 0.3`| `CULTURAL_HERO` | Unifies fragmented tribes. |

## 5.3 Reality Narrator (LLM)
`App\Domains\Narrative\Services\RealityNarrator`

When a major event occurs (e.g., Invasion, Collapse), this service uses LLM (via `AIAgentContext`) to generate vivid prose descriptions of the Physics Vectors.
- Input: `Entropy: 0.85`
- Output: "The sky burns with the heat of a thousand dying suns as the old laws of reality crumble..."
