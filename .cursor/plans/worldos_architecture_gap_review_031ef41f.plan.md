---
name: WorldOS Architecture Gap Review
overview: Đối chiếu docs/WorldOS_Architecture.md với codebase hiện tại để liệt kê các mục đã hiện thực và các mục còn sót hoặc chưa khớp với kiến trúc.
todos: []
isProject: false
---

# Review: Phần còn sót so với WorldOS Architecture

Đối chiếu [docs/WorldOS_Architecture.md](docs/WorldOS_Architecture.md) với codebase backend (và deployment) để xác định những gì **đã có** và những gì **chưa hiện thực** hoặc **lệch so với doc**.

---

## Đã hiện thực (khớp doc)


| Mục doc                        | Trạng thái                                                                                                                                                                                                                                                                                               |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **§2 Bug fixes**               | ForkUniverseAction return `?Universe`; `BranchRepository::existsFork` / `hasForkAsParent`; `SagaService::ensureSaga`; config `worldos.autonomic` (fork_entropy_min, archive_entropy_threshold); Navigator không override fork → archive (`DecisionEngine`: archive chỉ khi `recommendation !== 'fork'`). |
| **§3 Kernel**                  | `SimulationEngine` (name, priority, handle, tickRate), `EngineResult`, `EngineRegistry`, `SimulationKernel` (apply effects, emit events), tick pipeline theo priority. Deterministic seed từ TickContext.                                                                                                |
| **§4 Event**                   | `WorldEvent` DTO, `WorldEventType` (50+ types), `WorldEventBus` + backend (database / redis_stream), topic mapping `topicFor()`.                                                                                                                                                                         |
| **§5 World State**             | `WorldState` immutable, state_vector keys (planet, civilizations, population, economy, knowledge, culture, active_attractors, wars).                                                                                                                                                                     |
| **§6 Physical (một phần)**     | `GeographyEngine` (SimulationEngine, no-op). `PlanetaryClimateEngine` tồn tại nhưng gọi từ `AdvanceSimulationAction`, không nằm trong kernel.                                                                                                                                                            |
| **§8 Civilization (một phần)** | `WarEngine` (gọi từ AdvanceSimulationAction). Trong kernel: `ZoneConflictEngine` (zone conquest).                                                                                                                                                                                                        |
| **§9 Culture (một phần)**      | `CulturalDriftEngine` trong kernel. `LanguageEngine`, `MythologyGeneratorEngine` (CLI/API/pulse).                                                                                                                                                                                                        |
| **§11 Cognitive (một phần)**   | `IdeologyEvolutionEngine`, `GreatPersonEngine` (CLI/API/pulse).                                                                                                                                                                                                                                          |
| **§12 Narrative (một phần)**   | `AttractorEngine`, `DynamicAttractorEngine`, `NarrativeExtractionEngine`. Không có Causality Engine riêng.                                                                                                                                                                                               |
| **§13 AEE**                    | `AutonomicEvolutionEngine` (evaluate → fork/archive/mutate/continue), config entropy.                                                                                                                                                                                                                    |
| **§14 Scheduler & Timeline**   | `MultiverseSchedulerEngine`, `TimelineSelectionEngine`.                                                                                                                                                                                                                                                  |
| **§15 Data Graph**             | `WorldOsGraphServiceInterface`, `Neo4jWorldOsGraphService`, `SyncWorldEventToGraph` listener. Neo4j container trong docker-compose.                                                                                                                                                                      |
| **§16 Event schema**           | 50+ types trong `WorldEventType`, topicFor.                                                                                                                                                                                                                                                              |
| **§17 Blueprint (một phần)**   | Modules: World, Ecology, Civilization, Knowledge, Culture (placeholder README). Simulation: Kernel, AEE, Scheduler, TimelineSelection, NarrativeExtraction, CivilizationMemory, Mythology, Ideology, GreatPerson.                                                                                        |


---

## Chưa hiện thực hoặc lệch so với doc

### 1. Tick pipeline bảng 13 engine (doc §3)

Doc §3 liệt kê thứ tự: Planet(1), Climate(2), Ecology(3), Civilization(4), Politics(5), War(6), Trade(7), Knowledge(8), Culture(9), Ideology(10), Memory(11), Mythology(12), Evolution(13).

**Hiện tại:** Kernel chỉ có 8 engine: Geography(0), PotentialField(1), CosmicPressure(2), StructuralDecay(3), AdaptiveTopology(4), LawEvolution(5), ZoneConflict(6), CulturalDrift(9). Thiếu trong kernel (hoặc chưa có interface SimulationEngine): **Climate**, **Ecology** (Agriculture/Population/Migration/Disease), **Civilization Formation**, **City**, **Governance**, **Trade**, **Knowledge**, **Ideology**, **Memory**, **Mythology**, **Evolution** (AEE là meta, không chạy trong tick).

**Hướng xử lý:** Giữ nguyên kernel hiện tại (abstract/zone-based) hoặc dần bổ sung engine từng tầng theo doc (Climate, Agriculture, Population, …) và đăng ký vào `EngineRegistry`.

---

### 2. Physical World Layer (doc §6) — chưa đủ

- **6.1 Geography Engine:** Có `GeographyEngine` nhưng no-op; doc mô tả region (terrain, elevation, climate_zone, water_access, resources), settlement_score. Chưa có logic địa hình/region.
- **6.2 Climate Engine:** Có `PlanetaryClimateEngine` (config `planetary_climate`), chạy ngoài kernel. Doc mong muốn long-term cycles, agriculture impact. Chưa gắn vào kernel như SimulationEngine.
- **6.3 Agriculture Engine:** Doc: food_production, food_required, famine, tech stages. **Chưa có** engine tương ứng (không có AgricultureEngine).

---

### 3. Population Layer (doc §7) — chưa có trong kernel

- **7.1 Population Engine:** cohort, fertility/mortality. **Chưa có** engine (PopulationEngine) implement SimulationEngine.
- **7.2 Migration Engine:** migration types, flow object. **Chưa có** MigrationEngine trong kernel (có `TransmigrationEngine` nhưng không phải SimulationEngine).
- **7.3 Disease Engine:** SIR, pandemic severity. **Chưa có** DiseaseEngine.

---

### 4. Civilization Layer (doc §8) — thiếu so với doc

- **8.1 Civilization Formation Engine:** điều kiện cities >= 3, shared language/culture, stages. **Chưa có** engine chuyên formation.
- **8.2 City Simulation Engine:** city_id, population, economy, specialization. **Chưa có** CitySimulationEngine.
- **8.3 Empire Governance Engine:** stability, collapse. **Chưa có** GovernanceEngine.
- **8.4 War Engine:** Có `WarEngine` và `ZoneConflictEngine`; doc mô tả WarPressure, combat_power, escalation. Mức độ khớp từng phần.
- **8.5 Trade & Economy Engine:** market price, trade route. **Chưa có** TradeEngine trong kernel.

---

### 5. Culture Layer (doc §9) — thiếu so với doc

- **9.1 Religion Evolution Engine:** formation, religion tree. **Chưa có** ReligionEngine.
- **9.2 Language Evolution Engine:** Có `LanguageEngine` (gọi từ AdvanceSimulationAction), không trong kernel.
- **9.3 Art & Culture Engine:** cultural_output, movement. **Chưa có** Art/Culture engine riêng (chỉ CulturalDrift).
- **9.4 Mythology:** Có `MythologyGeneratorEngine` (CLI/API), không chạy trong tick pipeline.

---

### 6. Knowledge Layer (doc §10) — chưa có trong kernel

- **10.1 Knowledge Propagation Engine:** knowledge node, graph, innovation_rate. **Chưa có** KnowledgePropagationEngine.
- **10.2 Technological Evolution Engine:** tech graph, eras, adoption. **Chưa có** TechEvolutionEngine.

---

### 7. Cognitive Layer (doc §11) — một phần

- **11.1 Psychology Engine:** agent model, social contagion. **Chưa có** PsychologyEngine.
- **11.2 Ideology:** Có `IdeologyEvolutionEngine` (pulse/CLI), không trong kernel.
- **11.3 Great Person:** Có `GreatPersonEngine` (pulse/CLI), không trong kernel.

---

### 8. Narrative Layer (doc §12) — causality

- **12.1 Causality Engine:** Causal graph (Event A → B → C). Doc nói “causality graph update” trong event flow. **Chưa có** CausalityEngine hoặc bước “causality graph update” rõ ràng (chỉ có CausalCorrectionEngine, ResonanceEngine).
- **12.2 Attractor:** Có AttractorEngine, DynamicAttractorEngine.
- **12.3 Narrative Extraction:** Có NarrativeExtractionEngine.

---

### 9. Event flow “causality graph update” (doc §4)

Doc: Simulation Tick → publish to stream → engines consume → emit → **causality graph update** → world state update. Hiện tại: không có bước cập nhật causality graph tách biệt (Neo4j sync Event/Actor, không phải causal graph theo doc).

---

### 10. Storage strategy (doc §5)


| Doc                              | Hiện tại                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Hot State (current tick) → Redis | Snapshot/state trong DB (universe.state_vector, universe_snapshots). **Chưa** dùng Redis làm hot state. |
| Event History → Kafka / Log      | DB + tùy chọn Redis Stream. **Chưa** Kafka.                                                             |
| Graph → Neo4j                    | Đã có (Neo4j sync).                                                                                     |
| Analytics / Metrics → ClickHouse | **Chưa** ClickHouse.                                                                                    |
| Snapshots → S3 / Object Store    | Snapshots trong DB. **Chưa** S3/object store cho snapshot.                                              |


---

### 11. AEE decision types (doc §13)

Doc: continue, fork, archive, **merge**, mutate, **promote**. Hiện tại AEE/DecisionEngine: continue, fork, archive, mutate. **Chưa** hiện thực quyết định **merge** (similarity > 0.92) và **promote** (civilization milestone).

---

### 12. Cấu trúc thư mục Laravel (doc §3, §17)

Doc: `Modules/Simulation/Kernel/WorldKernel.php`, `TickPipeline.php`. Hiện tại: `app/Simulation/SimulationKernel.php`, không có file `WorldKernel` hay `TickPipeline` tách riêng. Engine nằm ở `app/Simulation/Engines/` và `app/Modules/World/Services/GeographyEngine.php`. Khác biệt về tên và vị trí, không ảnh hưởng logic nếu không muốn refactor theo đúng tên doc.

---

### 13. Kafka

Doc §4, §17: Event stream Kafka/Redpanda. Hiện tại: database hoặc Redis Stream. **Chưa** driver Kafka (chỉ Redis Stream).

---

## Tóm tắt ưu tiên

- **Đã đúng kiến trúc:** Bug fixes §2, Kernel interface & pipeline §3, Event (WorldEvent, Bus, topics) §4, World State §5, AEE §13, Scheduler & Timeline §14, Data Graph §15, Event schema §16, một phần Physical/Culture/Cognitive/Narrative.
- **Sót / chưa khớp chính:** (1) Nhiều engine theo từng tầng chưa có hoặc chưa vào kernel (Climate, Agriculture, Population, Migration, Disease, Civilization Formation, City, Governance, Trade, Knowledge, Religion, Art, Psychology, Causality); (2) Storage: chưa Redis hot state, ClickHouse, S3 snapshots, Kafka; (3) AEE thiếu decision merge & promote; (4) Event flow chưa có bước “causality graph update” rõ ràng.

Nếu cần, có thể lập kế hoạch triển khai từng nhóm (ví dụ: engine theo tầng, storage, AEE merge/promote) theo thứ tự ưu tiên nghiệp vụ.