# WorldOS Engine Architecture - Complete Inventory

## Report Date
April 10, 2026 - Based on actual code analysis

## File Structure
All engines located in: `backend/app/Modules/Simulation/Core/Engines/`

## Base Classes and Interfaces

### SimulationEngine (Interface Contract)
- **Location**: Core/Contracts/SimulationEngine.php
- **Required Methods**: name(), version(), priority(), phase(), tickRate(), handle(), isParallelSafe(), priorityCategory()

### AbstractWorldOSEngine (Abstract Base)
- **Location**: /Engines/AbstractWorldOSEngine.php
- **Abstract Methods**: name(), phase(), execute()
- **Concrete Defaults**: priority()=0, isEnabled()=true

### EngineInterface
- **Extends**: SimulationEngine

### LegacyEngineAdapter
- **Purpose**: Adapter for legacy handle()-based engines

### EngineResult (DTO)
- **Properties**: stateChanges[], events[], metrics[], causalLinks[]

---

## Environment Phase (3 Engines)

### 1. GeographyEngine
- **File**: Environment/GeographyEngine.php
- **Priority**: N/A | **TickRate**: 1
- **Methods**: name(), handle(), initializeUniverseMap(), getPersistentState(), injectPersistentState()
- **Key Feature**: Tile-based map with in-memory persistent state

### 2. MetabolicEngine
- **File**: Physics/MetabolicEngine.php
- **Priority**: 11 | **TickRate**: 1
- **Logic**: Energy = Growth - Decay - Entropy
- **Output**: entropy, survival_modifier, net_energy per zone
- **Integration**: Rust FFI to computeMetabolismGrid()

### 3. PotentialFieldEngine
- **File**: Physics/PotentialFieldEngine.php
- **Priority**: 1 | **TickRate**: config-based
- **Constants**: DECAY=0.97, DIFFUSION_RATE=0.1
- **Features**: Zone pressures, dual topology (zone neighbors or ring)

---

## Life Phase (2 Engines)

### 1. LivingWorldEngine
- **File**: Environment/LivingWorldEngine.php
- **Priority**: 5 | **TickRate**: 1
- **Phases**: Population sync → Consumption/Regen → Starvation → Migration
- **Events**: FAMINE, MIGRATION_WAVE
- **Config**: consumption_rate, regen_base, death_rate, migration_threshold

### 2. AutopoieticEvolutionEngine
- **File**: Biological/AutopoieticEvolutionEngine.php
- **Priority**: 99 (last) | **TickRate**: 100
- **Mutations**: Entropy stabilization, Complexity optimization, Observer reset
- **DSL Targets**: 5 domain files (physics, integrity, autopoiesis, biosphere, consciousness)

---

## Mind Phase (3 Engines)

### 1. PsychologyEngine
- **File**: Social/PsychologyEngine.php
- **Priority**: 5 | **TickRate**: 1 (every 10 ticks)
- **Calcs**: Scarcity, Morale (env 0.4 + joy 0.4 - fear 0.2 - anger 0.1), Unrest
- **Inputs**: resources, inequality, legitimacy, actor psychology

### 2. IdeaDiffusionEngine
- **File**: Social/IdeaDiffusionEngine.php
- **Priority**: 5 | **TickRate**: 1 (every 20 ticks)
- **Ideas**: agriculture, metalworking, writing, law, philosophy, mathematics, medicine, navigation
- **Deterministic**: crc32 hashing for transmission & mutation
- **Config**: transmission_rate=0.15, mutation_rate=0.05

### 3. NarrativeConflictEngine
- **File**: Meta/NarrativeConflictEngine.php
- **Priority**: 300 | **TickRate**: 2 | **ParallelSafe**: true
- **Conflicts**: rationalism↔superstition, hope↔fear, order↔chaos, isolation↔expansion
- **Logic**: Stronger narrative wins (1.05x boost), weaker weakens (0.8x)

---

## Social Phase (5 Engines)

### 1. GlobalEconomyEngine
- **File**: Social/GlobalEconomyEngine.php
- **Priority**: 20 | **TickRate**: 1 (every 20 ticks) | **ParallelSafe**: true
- **Calcs**: GDP = totalProduction × food_price, Inflation, GDP per Capita

### 2. PoliticsEngine
- **File**: Social/PoliticsEngine.php
- **Priority**: 10 | **TickRate**: 1 (every 25 ticks)
- **Governance**: tribal (<50 pop) → chiefdom → republic (if tech>0.5 && gini>0.6) → monarchy
- **Stability**: 0.7 - gini×0.4 + tech_level×0.2

### 3. CultureEngine
- **File**: Social/CultureEngine.php
- **Priority**: 35 | **TickRate**: 1
- **Profile**: dominant_group, group_diversity, meme_signature, cohesion, cultural_artifacts
- **Artifacts**: aesthetics (from construction), rituals (from livelihood), taboos (from cohesion)

### 4. PowerStructureEngine
- **File**: Meta/PowerStructureEngine.php
- **Priority**: 11 | **TickRate**: 5
- **Logic**: IF power>0.8 AND stability<0.3 → coup_imminent=true
- **Monolithicity**: +=  (power - 0.5) × 0.01

### 5. AscensionEngine
- **File**: Meta/AscensionEngine.php
- **Trigger**: sci_index>0.7 && org_capacity>0.85 && legitimacy>0.8
- **Effects**: entity_type='supreme', org_capacity=1.0, institutional_memory+=1000, AI axiom shift

---

## Meta Phase (5 Engines)

### 1. MythogenesisEngine
- **File**: Meta/MythogenesisEngine.php
- **Priority**: 24 | **TickRate**: 5
- **Thresholds**: impact>0.9→Artifact, impact>0.75→Myth
- **Archetypes**: HERO, MARTYR, CREATOR, DESTROYER, OIKOS
- **Fact Categories**: WAR(0.6), DISCOVERY(0.5), RELIGION(0.7), CRISIS(0.8)
- **Myth Evolution**: +2% belief (5% chance), decay: ×0.995

### 2. CausalityEngine
- **File**: Meta/CausalityEngine.php
- **Priority**: 24 | **TickRate**: 5
- **DSL**: worldos_rules/simulation/integrity.dsl
- **Logic**: Evaluates causal system integrity

### 3. CausalHistoryEngine
- **File**: Meta/CausalHistoryEngine.php
- **Priority**: 16 | **TickRate**: 5 | **ParallelSafe**: true
- **Tracking**: Attractor transitions, pressure spikes
- **Graph**: Records semantic causal links

### 4. IdeologyEngine
- **File**: Meta/IdeologyEngine.php
- **Priority**: 14 | **TickRate**: 20 | **ParallelSafe**: true | **Category**: STOCHASTIC
- **Trigger**: magnitude>0.8 with 5% chance
- **Types**: TRAUMA, VICTORY, FAMINE, DISCOVERY
- **Modifiers**: TRAUMA(survival+0.2, power+0.1), VICTORY(status+0.2, power+0.2), etc.

---

## Summary Statistics

- **Total Engines**: 17
- **Environment**: 3 | **Life**: 2 | **Mind**: 3 | **Social**: 5 | **Meta**: 5
- **Parallel Safe**: 5 engines
- **Trait Usage**: DefaultSimulationEnginePhase (14 engines)
- **Avg Priority**: 20-30 (lower = runs first within phase)
- **Tick Rates**: 1, 2, 5, 20, 25, 100 ticks

---

## Key Integration Points

- **TickContext**: getTick(), getUniverseId(), getSeed()
- **WorldState**: get/set methods, getZones(), getActorEntities(), getScars()
- **EngineResult**: stateChanges, events, metrics, causalLinks
- **Determinism**: All RNG seeded with (universeId, tick, engine_seed)

---

## Configuration Paths

DSL Paths:
- worldos_rules/simulation/physics
- worldos_rules/simulation/integrity
- worldos_rules/biology/biosphere
- worldos_rules/culture/myth.dsl

Config Keys:
- worldos.living_world.* (5 keys)
- worldos.idea_diffusion.* (2 keys)
- worldos.autopoiesis.* (3 keys)
- worldos.politics_tick_interval (1 key)

