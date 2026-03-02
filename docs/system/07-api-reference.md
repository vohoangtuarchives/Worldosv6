# 07 — API & AI Integration

## 7.1 Writer API (Genesis)
- **POST /api/writer/genesis/world**: Create World Container (Physic Laws, Genre).
- **POST /api/writer/genesis/universe**: Spawn Universe Instance (apply Preset).
- **POST /api/writer/sagas/create-from-active**: Create Saga from active Universe.

## 7.2 Runtime API
- **POST /api/writer/saga/advance**: Manual tick advance (Debug/Testing).
- **GET /api/writer/universe/{id}/snapshot**: Get state vector for visualization.

## 7.3 AI Metrics Layer
The "Brain" of the simulation.

1.  **Metric Extraction**: `MetricsExtractor` reads `UniverseSnapshot`.
    - Calculates: `CollapseRisk`, `InnovationTrend`.
2.  **Evaluator**: `UniverseEvaluator` (LLM/Rule-based) suggests actions.
    - Suggests: `continuing`, `forking` (if interesting), `archiving` (if dead).
3.  **Execution**: `DecisionEngine` applies the suggestion.
    - If `fork`: Clones the Universe at the current tick.

This layer runs *after* the Physics tick in `SagaService::runBatchWithEvaluation`.
