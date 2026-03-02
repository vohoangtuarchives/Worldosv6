# 06 — Legacy Systems (Deprecated)

## 6.1 Removed / Disabled Features
The following features were part of V2 or MVP V1 and are **NOT** used in the V3 Macro-Simulation.

### 1. Autonomous Tick (Micro-Sim)
- **Command**: `autonomous:tick`
- **Class**: `TickWorldAction`
- **Reason**: Simulated individual agents (survival checks) at the World level. This was computationally expensive and architecturally incorrect (Genotype vs Phenotype conflict).
- **Replacement**: Macro-Sim (Civilization Stats) + Narrative Resonance.

### 2. SagaRunner (Legacy Orchestrator)
- **Class**: `SagaRunner`
- **Reason**: Direct manipulation of World State without Universe abstraction.
- **Replacement**: `SagaService` + `UniverseRuntimeService`.

### 3. Cosmic Snapshots
- **Table**: `cosmic_snapshots`
- **Reason**: Replaced by `universe_snapshots` which are strictly typed to the V3 State Vector.

## 6.2 Migration Guide
If you find code referencing `SagaRunner` or `TickWorldJob`, do not use it.
- Use `SagaService::runBatchWithEvaluation()` for time advancement.
- Use `UniverseSnapshotRepository` for history access.
