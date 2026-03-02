# Future Roadmap (V3.x)

This document outlines the strategic roadmap for WorldOS V3, synthesized from `gap_analysis.md`, `SERIAL_AND_EVOLUTION_ROADMAP.md`, and the `RFC-DCE` vision.

## 1. Phase 4: System Consolidation & Clean-up [COMPLETED v3.03]
**Goal**: Resolve technical debt and unify domain boundaries.

- [x] **Consolidate Physics Domains**: Merged `App\Domains\Cosmic` and `App\Domains\Cosmology` into a single, canonical `Cosmology` domain.
- [x] **Unified Attractor Repository**: `AttractorRepository` is now the single source of truth for bifurcation logic and narrative context.
- [x] **Remove Legacy Docs**: Legacy docs archived.

## 2. Phase 5: The "Style" Layer (Physics Bias) [COMPLETED v3.04]
**Goal**: Implement the "Feeling" of the world mathematically, not just narratively.

- [x] **UniverseStyle Entity**: Create a model to store "Style Vectors" (e.g., `EntropyDecayRate`, `InnovationBurstProbability`).
- [x] **Genre -> Physics Mapping**: Implement `GenreDefinition::getPhysicsBias()` to auto-configure `UniverseStyle` based on genre.

## 3. Phase 6: Meta-AI (The Advisor) [COMPLETED v3.04]
**Goal**: Move AI from "Reporter" (Chronicler) to "Strategist" (Advisor).

- [x] **StyleAdvisorService**: A background job that analyzes `UniverseSnapshot` every 50 ticks.
- [x] **Suggestion Engine**: AI proposes parameter tweaks (`Mutation`) to keep the simulation "interesting".
- [x] **Governance Integration**: Proposals are sent to the `Governance` system for user approval.

## 4. Phase 7: Advanced Narrative Engine [COMPLETED v3.04]
**Goal**: Implement "Autonovel" scale and "Sudowrite" quality.

- [x] **Arc Digest System**: Implement a long-term memory layer that summarizes completed Arcs into `StoryBible` entries.
- [x] **Batch Generation**: Allow generating 5-10 chapters in parallel for an approved Arc.
- [x] **Emergent Arcs**: Replace `SerialArcPlanner` (static) with a dynamic planner that detects `Tension` spikes and spawning Arcs automatically.

## 5. Phase 8: The "Scar" Layer [COMPLETED v3.03]
**Goal**: Implement persistent historical inertia.

- [x] **WorldScar Entity**: When a `WorldMyth` decays or is disproven, it becomes a `WorldScar`.
- [x] **Inertia Calculation**: Physics engine calculates `Inertia` based on total Scars, making the world harder to change over time.

---

*Verified V3.03 - 2026-02-20*
