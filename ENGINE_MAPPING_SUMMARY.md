# WorldOS Simulation Engine Architecture Mapping - Complete Analysis

## Overview
- **Total Engines Found:** 92 classes
- **Categories:** Physics (9), Environment (2), Biological (4), Social (21), Meta (47), Integration (1)
- **Ready for Migration:** 43 engines
- **Needs Refactoring:** 4 Biological + 36+ unregistered Meta

## Phase Distribution

### PHYSICS (9 engines) → SimulationPhase::Environment
- MetabolicEngine, ClimateEngine, GeologicalEngine, MaterialEvolutionEngine
- CosmicPressureEngine, RealityAnchorEngine, StructuralDecayEngine, PotentialFieldEngine
- ZonePressureCalculator (utility, not engine)
- **Status:** Ready - all implement EngineInterface

### ENVIRONMENT (2 engines) → SimulationPhase::Environment (or Life)
- LivingWorldEngine (conflicting: dir=Environment, code=Life)
- GeographyEngine
- **Status:** Ready but needs phase clarification

### BIOLOGICAL (4 engines) → SimulationPhase::Life
- EcologicalCollapseEngine (NO interface - uses RuleVmService)
- EcologicalPhaseTransitionEngine, AutopoieticEvolutionEngine, CelestialAntibodyEngine
- **Status:** BLOCKED - needs interface refactoring

### SOCIAL (21 engines) → SimulationPhase::Social
- Market, Trade, GlobalEconomy, Finance, ProductionChain, Culture, Diplomacy
- Politics, War, Population, Agriculture, Disease, Inequality, IdeaDiffusion, Psychology
- CivilizationSettlement, CivilizationPhysics, CivilizationField, CivilizationLongCycle, LegitimacyElite
- **Status:** Ready - all registered in KernelServiceProvider

### META (47 engines) → SimulationPhase::Meta
- **Registered (11):** Mythogenesis, PowerStructure, Ideology, CausalHistory, SingularityStability, Ascension, CulturalInfluence, KnowledgeEvolution, Meaning, InformationPropagation, ThermodynamicPhase
- **Unregistered (36+):** Attractor, WorldWill, History, HistoricalCycle, Dynamic*, Chaos, Capability, Transmigration, Actor*, Artifact*, Narrative*, Omega*, Singularity*, And more...
- **Status:** MIXED - 11 ready, 36+ undecided

### INTEGRATION (1 engine) → Custom
- ActionExecutionEngine (handler-based, not standard engine)
- Associated: 8 action handlers (AttackHandler, BuildShelterHandler, etc.)
- **Status:** Special handling needed

## Critical Issues

### Issue #1: Phase Inconsistency
- LivingWorldEngine: directory=`Core/Engines/Environment/` but code declares phase as "life"
- **Fix:** Audit all engines, ensure directory matches declared phase

### Issue #2: 36+ Unregistered Meta Engines
- Exist but not registered in KernelServiceProvider
- **Decision needed:** Are they WIP, incomplete, or intentionally disabled?

### Issue #3: Non-Compliant Engines
- EcologicalCollapseEngine: NO SimulationEngine interface
- AttractorEngine: has `evaluate()` instead of `handle()`
- HistoryEngine: has `getTimeline()` instead of `handle()`
- **Cannot use LegacyEngineAdapter** for these

### Issue #4: Duplicate Registrations
- CulturalInfluenceEngine: registered in BOTH Social and Meta phases
- MythogenesisEngine: registered in BOTH Social and Meta phases
- **Result:** These engines run twice per tick unless coordinated

### Issue #5: TickRate() Handling
- AbstractWorldOSEngine DOES NOT include `tickRate()` method
- Many engines use this to run every Nth tick (not every tick)
- **How to handle in v2 system:** Unclear

## Migration Approach

### Phase 1: Wrap Ready Engines (LegacyEngineAdapter)
**Target:** 43 engines (all Physics + Environment + Social + 11 Meta)
```php
$registry->register(
  new LegacyEngineAdapter(
    new MetabolicEngine(),
    SimulationPhase::Environment
  )
);
```

### Phase 2: Direct Migration (Non-Compliant)
**Target:** 4 Biological + 36+ Meta unregistered
- Implement missing `handle()` methods
- Extend `AbstractWorldOSEngine` directly
- Override `phase()` to return `SimulationPhase` enum

### Phase 3: Special Handling
**Target:** ActionExecutionEngine + 8 handlers
- Decision needed: Adapt to engine model or keep separate

## Key Takeaways

1. **92 engine classes identified and categorized**
2. **43 engines ready for immediate migration using LegacyEngineAdapter**
3. **36+ Meta engines need scope/purpose clarification**
4. **4 Biological engines need interface refactoring**
5. **Phase string → SimulationPhase enum conversion required**
6. **TickRate handling in v2 system still needs clarification**

## Next Steps

1. Audit all 92 engines for interface compliance
2. Create phase mapping table (Engine → Phase → Adapter vs Direct)
3. Begin wrapping Phase 1 engines (low risk)
4. Parallel: investigate Meta engines and resolve architectural questions
5. Implement and test each phase

---

## File Organization Reference

```
backend/app/Modules/Simulation/
├── Engines/
│   ├── AbstractWorldOSEngine.php ← TARGET BASE CLASS
│   └── LegacyEngineAdapter.php ← WRAPPER
├── Core/Engines/
│   ├── Biological/ (4 engines, 1 non-compliant)
│   ├── Environment/ (2 engines)
│   ├── Integration/ (1 engine + 8 handlers)
│   ├── Meta/ (47 engines, 36+ unregistered)
│   ├── Physics/ (9 engines)
│   ├── Social/ (21 engines)
│   ├── EngineInterface.php
│   └── EngineResult.php
├── Enums/
│   └── SimulationPhase.php ← 5 PHASES
├── Services/Kernel/
│   └── PhaseRegistry.php ← v2 REGISTRATION
├── Core/Runtime/
│   └── WorldKernel.php ← ORCHESTRATOR
└── Providers/
    └── KernelServiceProvider.php ← LEGACY REGISTRATION
```
