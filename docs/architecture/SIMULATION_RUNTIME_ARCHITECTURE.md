# WorldOS Simulation Runtime Architecture

Tài liệu kiến trúc cho refactor **AdvanceSimulationAction** từ God Orchestrator sang **Simulation Kernel + Tick Pipeline + Stage-based runtime**, tham chiếu DDD và simulation engine cấp AAA (Paradox, RimWorld, Dwarf Fortress).

---

## 1. Vấn đề hiện tại

`AdvanceSimulationAction` đang gom **4 vai trò** trong một class ~550+ dòng:

| Vai trò | Mô tả | Vấn đề |
|--------|--------|--------|
| **Engine Gateway** | Gọi Rust/stub `$engine->advance()` | Infrastructure boundary — nên tách rõ |
| **State Sync** | `syncUniverseFromSnapshotData`, `ensureEntropyFloor`, `ensureStateVectorHasZones` | State Consistency Layer — **giữ lại**, rất đúng |
| **Engine Pipeline** | Energy, Survival, Culture, Behavior, Language, Civilization, Economy, Politics, War, Ecology, Climate, Geology, Collapse | 12+ engines gọi tuần tự — nên nhóm theo Stage |
| **Meta / Cosmic** | Resonance, Sovereignty, Demiurge, Miracle, Heat Death, Axiom, Chaos, Transmigration, Antibody, Agent Sovereignty | Meta layer — nên gom vào CosmicStage |

Constructor hiện inject **36+ services** → Constructor Hell. Mục tiêu: inject **Stage managers** thay vì từng engine.

---

## 2. Kiến trúc mục tiêu

```
AdvanceSimulationAction (orchestrator mỏng, ~150 lines)
    │
    ├─ 1. Engine Gateway      → $engine->advance()
    ├─ 2. State Consistency   → ensureEntropyFloor, ensureStateVectorHasZones, syncUniverseFromSnapshotData
    ├─ 3. Snapshot save/virtual → saveSnapshot / makeVirtualSnapshot, fire UniverseSimulationPulsed
    └─ 4. Tick Pipeline       → SimulationTickOrchestrator->run($universe, $snapshotData, $savedSnapshot)
                                      │
                                      ▼
                              SimulationTickPipeline
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
              TickScheduler    Stage[] (ordered)   (optional) Parallel
              shouldRun(stage, tick)                execution per stage
                    │
                    ├─ actor        (every 1 tick)  → ActorStage
                    ├─ culture      (every 1 tick)  → CultureStage
                    ├─ civilization (every 1 tick)  → CivilizationStage
                    ├─ economy      (every 10)      → EconomyStage
                    ├─ politics     (every 20)      → PoliticsStage
                    ├─ war          (every 50)      → WarStage
                    ├─ ecology      (every 1 tick)  → EcologyStage
                    └─ meta         (every 1/5/50)  → MetaCosmicStage
```

---

## 3. Thành phần chính

### 3.1 Simulation Kernel (giữ nguyên ranh giới)

- **Input:** Universe + state từ engine (sau sync).
- **Output:** Snapshot (đã lưu hoặc virtual) + event UniverseSimulationPulsed.
- **State Consistency:** `ensureEntropyFloor`, `ensureStateVectorHasZones`, `syncUniverseFromSnapshotData` — không chuyển vào Pipeline, vẫn nằm trong Action hoặc một **StateReconciliationService** riêng.

### 3.2 Tick Scheduler

Trả lời: **stage X có chạy ở tick T không?**

```php
interface TickSchedulerInterface
{
    public function shouldRun(string $stageKey, int $tick): bool;
}
```

Config ví dụ (trong `config/worldos.php`):

```php
'tick_pipeline' => [
    'actor'        => ['interval' => 1],   // every tick
    'culture'      => ['interval' => 1],
    'civilization' => ['interval' => 1],
    'economy'      => ['interval' => 10],
    'politics'     => ['interval' => 20],
    'war'          => ['interval' => 50],
    'ecology'      => ['interval' => 1],
    'meta'         => ['interval' => 1],   // meta có thể có sub-intervals (demiurge 5, heat 50)
],
```

### 3.3 Stage Contract

Mỗi stage nhận Universe + tick + (optional) snapshot đã lưu.

```php
namespace App\Simulation\Runtime\Contracts;

interface SimulationStageInterface
{
    public function run(\App\Models\Universe $universe, int $tick, ?\App\Models\UniverseSnapshot $savedSnapshot = null): void;
}
```

### 3.4 Các Stage (map từ code hiện tại)

| Stage | Engines / Actions hiện tại | Ghi chú |
|-------|----------------------------|--------|
| **ActorStage** | ProcessActorEnergy, ProcessActorSurvival, CultureEngine, ActorBehaviorEngine, LanguageEngine | Energy → Survival → Culture → Behavior → Language |
| **CivilizationStage** | CivilizationSettlementEngine, GlobalEconomyEngine, PoliticsEngine, WarEngine | Settlement → Economy → Politics → War |
| **EcologyStage** | EcologicalCollapseEngine, PlanetaryClimateEngine, EcologicalPhaseTransitionEngine, GeologicalEngine | Collapse → Climate → PhaseTransition → Geology |
| **MetaCosmicStage** | ResonanceAuditor, Sovereignty, ArchetypeShift, processAlignments, EmpowerDemiurges, DemiurgeAutonomous, triggerRandomMiracles, HeatDeath, AxiomMutation, AgentSovereignty, CelestialAntibodyEngine, ChaosEngine, TransmigrationEngine | Có điều kiện theo tick % 5, % 10, % 50 |
| **PostSnapshotStage** (chỉ khi shouldSave) | ActorCognitiveService, CivilizationCollapseEngine | Chạy sau khi đã lưu snapshot |

### 3.5 SimulationTickPipeline

```php
class SimulationTickPipeline
{
    public function __construct(
        protected TickSchedulerInterface $scheduler,
        protected array $stages, // ['actor' => ActorStage, 'ecology' => EcologyStage, ...]
        protected array $stageOrder
    ) {}

    public function run(\App\Models\Universe $universe, int $tick, ?\App\Models\UniverseSnapshot $savedSnapshot = null): void
    {
        foreach ($this->stageOrder as $key) {
            if (!$this->scheduler->shouldRun($key, $tick)) {
                continue;
            }
            $this->stages[$key]->run($universe, $tick, $savedSnapshot);
            $universe->refresh();
        }
    }
}
```

### 3.6 SimulationTickOrchestrator

Lớp gọi Pipeline và (nếu cần) đảm nhiệm thứ tự đặc biệt (ví dụ Survival chạy trước Pipeline, PostSnapshot chạy sau khi lưu). Có thể gộp luôn vào AdvanceSimulationAction nếu không cần tách thêm.

---

## 4. AdvanceSimulationAction sau refactor (mục tiêu)

```php
public function execute(int $universeId, int $ticks): array
{
    // 1. Guard + load
    $universe = $this->universeRepository->find($universeId);
    if (!$universe || !$this->canAdvance($universe)) {
        return ['ok' => false, 'error_message' => '...'];
    }

    // 2. Engine Gateway
    $stateInput = $this->prepareEngineStateInput($universe);
    $worldConfig = $this->prepareWorldConfig($universe);
    $response = $this->engine->advance($universeId, $ticks, $stateInput, $worldConfig);
    if (!($response['ok'] ?? false)) {
        return $response;
    }

    $snapshotData = $response['snapshot'] ?? [];
    if (empty($snapshotData)) {
        return $response;
    }

    // 3. State Consistency Layer
    $this->ensureEntropyFloor($snapshotData);
    $this->ensureStateVectorHasZones($snapshotData);
    $this->temporalSync->advanceGlobalClock($universe->world, $ticks);
    $this->temporalSync->synchronize($universe);
    $this->syncUniverseFromSnapshotData($universe, $snapshotData);

    // 4. Snapshot save vs virtual + event
    $interval = $universe->world->snapshot_interval ?? 1;
    $shouldSave = ($snapshotData['tick'] % $interval === 0) || ($snapshotData['tick'] == 0);
    $savedSnapshot = $shouldSave
        ? $this->saveSnapshot($universe, $snapshotData)
        : $this->makeVirtualSnapshot($universe, $snapshotData);
    event(new UniverseSimulationPulsed($universe, $savedSnapshot, array_merge($response, ['_ticks' => $ticks])));

    // 5. Tick Pipeline (thay thế toàn bộ block engine + meta hiện tại)
    $this->tickOrchestrator->run($universe, (int) $snapshotData['tick'], $savedSnapshot, $response);

    // 6. Update current_tick + universe save (có thể gộp vào orchestrator)
    $this->universeRepository->update($universe->id, ['current_tick' => $snapshotData['tick']]);
    $universe->refresh();
    $universe->structural_coherence = min(1.0, $universe->structural_coherence + $universe->observer_bonus);
    if ($snapshotData['tick'] % 10 === 0) {
        $universe->fitness_score = app(KernelMutationService::class)->calculateFitness($universe);
    }
    $universe->save();

    return $response;
}
```

---

## 5. Lộ trình refactor (incremental)

1. **Phase 1 (không đổi hành vi):** Thêm `TickScheduler`, `SimulationTickPipeline`, interface `SimulationStageInterface`, và các Stage class **delegate** đúng vào engine hiện tại. AdvanceSimulationAction vẫn gọi engine trực tiếp như cũ.
2. **Phase 2:** AdvanceSimulationAction chuyển sang gọi `SimulationTickOrchestrator->run()` thay vì gọi từng engine; so sánh kết quả (test, log) đảm bảo tương đương.
3. **Phase 3:** Bật Tick Scheduler (interval theo config) cho từng stage; tắt dần gọi mỗi tick cho economy/politics/war.
4. **Phase 4 (tùy chọn):** Parallel execution trong từng stage hoặc giữa các stage độc lập (cẩn thận thứ tự phụ thuộc).

---

## 6. Điểm cần giữ nguyên (đã đúng kiến trúc)

- **State Consistency:** `ensureEntropyFloor()`, `ensureStateVectorHasZones()`, `syncUniverseFromSnapshotData()` — đây là **Simulation State Sanity System**, không nhét vào Stage.
- **Snapshot save vs virtual:** Logic `shouldSave` + `makeVirtualSnapshot` giữ trong Action (hoặc service riêng), không đẩy xuống Pipeline.
- **Event UniverseSimulationPulsed:** Vẫn fire sau khi có snapshot (saved hoặc virtual), trước khi chạy Pipeline, để listener (EvaluateSimulationResult, etc.) nhận đúng tick/snapshot.

---

## 7. Tích hợp AI / Narrative (gợi ý mở rộng)

- **Narrative Engine:** Có thể là một Stage (ví dụ `NarrativeStage`) chạy mỗi N tick hoặc sau khi có `savedSnapshot`, gọi LLM để viết history / chronicle.
- **Ideology / Religion:** Đã có IdeologyEvolutionEngine, GreatPersonEngine — có thể nằm trong CivilizationStage hoặc MetaCosmicStage tùy tần suất.

---

## 8. Tham chiếu

- Code hiện tại: `App\Actions\Simulation\AdvanceSimulationAction`
- Config gợi ý: `config/worldos.php` → `tick_pipeline`, `entropy_floor`
- Doc liên quan: `docs/WORLDOS_ENGINES_AND_MODULES.md`, `docs/WORLDOS_V5_ARCHITECTURE.md`
