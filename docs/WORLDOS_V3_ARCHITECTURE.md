# WorldOS v3 — IP Foundry / Simulation Core Architecture

## Mục tiêu và ba luật sắt

- **IP Foundry**: Simulation lab + branching timeline engine + IP mutation engine; không phải story tool.
- **Luật 1 — Universe là đơn vị kinh tế**: IP sinh ra từ Universe. Saga chỉ là batch experiment (chạy nhiều Universe để tìm "viên ngọc").
- **Luật 2 — Authority tuyệt đối**: World = immutable rule container; Universe = evolving state machine; Saga = orchestrator; Narrative = projection; AI = evaluator/mutator qua kernel. Không lẫn.
- **Luật 3 — Snapshot-first**: Rollback/fork/clone nhanh; state là king. Event-sourcing thuần không đủ; cần `universe_snapshots` (tick, state_vector, entropy, metrics).

---

## Kiến trúc đích

```
World (rule preset, immutable)
   └── Universe (runtime state machine, single authority)
          ├── UniverseSnapshot (tick, state_vector, entropy, metrics)
          ├── UniverseStyle (style_vector, name, version, is_active)
          └── (Fork → parent_universe_id)

Saga (experiment orchestrator)
   └── owns many universes (saga_worlds.universe_id)

AI
   ├── evaluate(universe_metrics) → recommendation + mutation_suggestion
   └── Kernel.validateMutation / applyPressure (không sửa state trực tiếp)
```

**Entry point duy nhất**: `UniverseRuntimeService::advance($universeId, $ticks)`.

**Kernel**: Load World (rules) + Universe (state) → tick → next state → Universe.apply → UniverseSnapshotRepository.save. Không có WorldEvolutionPipeline trong luồng chính; không có SagaRunner.simulateWorld điều khiển physics.

---

## Thành phần chính

| Thành phần | Vai trò |
|------------|--------|
| **universe_snapshots** | Bảng: universe_id, tick, state_vector, entropy, stability_index, metrics. Index (universe_id, tick). |
| **UniverseSnapshotRepository** | save(Universe, metrics), getAtTick(universeId, tick), getLatest(universeId). |
| **UniverseRuntimeService** | advance(universeId, ticks); tick() → evolutionEngine.applyTick → cosmologyRepository.save → universeSnapshotRepository.save. |
| **SagaService** | spawnUniverse(World, ?parentUniverseId), runBatch(Saga, ticksPerUniverse), evaluate(Universe), fork(Universe, fromTick), genesisV3(Saga, ticks). |
| **MetricsExtractor** | Từ UniverseSnapshot → UniverseMetrics (entropy_trend, complexity_index, stability_score, …). Không đưa raw state_vector vào LLM. |
| **UniverseEvaluatorInterface** | evaluate(UniverseMetrics) → EvaluationResult (ip_score, recommendation: fork\|continue\|archive, mutation_suggestion). Stub + LLM impl. |
| **WorldEvolutionKernel** | tickUniverse(World, Universe); validateMutation(World, MutationSuggestion); applyPressure(Universe, selectionPressure, intensity). |
| **UniverseStyle** | Model: world_id, style_vector, name, version. Định nghĩa "vật lý" đặc thù cho genre. |
| **StyleAdvisorService** | Phân tích trajectory → ProposeStyleChangeAction (Governance). Chạy mỗi 50 ticks. |
| **DigestArcAction** | Narrative: arc completed → StoryBible entry (Long-term memory). |
| **SerialArcPlanner** | Emergent planning dựa trên Tension spikes (> 0.75). |
| **DecisionEngine** | Từ EvaluationResult → fork (SagaService.fork), archive (Universe.status = archived), hoặc continue (optional applyPressure). |

---

## Genesis v3

1. WriterGenesisController.store: tạo Saga (name, preset, …).
2. Gọi **SagaService.genesisV3(saga, 10)** thay vì dispatch RunSagaSimulationJob.
3. genesisV3: tạo World từ preset → spawnUniverse(World) → SagaWorld(saga, world, universe, sequence=1) → runBatch(saga, 10).

---

## Legacy (deprecated)

- **SagaRunner.runSync / simulateWorld**: Không dùng cho flow mới. @deprecated.
- **RunSagaSimulationJob**: Genesis không còn dispatch job này. @deprecated.
- **cosmic_snapshots** (world_id, year): Logic mới chỉ ghi universe_snapshots. Bảng giữ lại; đánh dấu deprecated cho evolution mới.

---

## Tài liệu liên quan

- SIMULATION_TOP_DOWN.md — Luồng top-down, section 7 mô tả v3.
- Plan: WorldOS v3 IP Foundry (attached plan file).
