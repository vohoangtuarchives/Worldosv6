# Engine – Sản phẩm tiểu biểu (Entity / Output mapping)

Tài liệu này ánh xạ **các loại thực thể / sản phẩm** hiển thị trên UI (tab Thực thể / Personae) với **engine hoặc service** liên quan tạo ra hoặc cập nhật chúng. Dùng để theo dõi nguồn gốc dữ liệu và debug.

Tham chiếu: [ENGINE_LAYER_MAPPING.md](ENGINE_LAYER_MAPPING.md), Doc 21, [WorldOS_Architecture.md](../docs/system/).

---

## Bảng ánh xạ: Sản phẩm → Engine / Nguồn

| Sản phẩm (UI)        | API / Model              | Engine / Service liên quan |
|----------------------|--------------------------|----------------------------|
| **Nhân vật** (Actors) | `GET universes/{id}/actors`, `Actor` | **Intelligence**: `GetUniverseActorsAction`, `ActorBehaviorEngine`, `ActorEvolutionService`, `ProcessActorSurvivalAction`, biology/energy pipeline. Actors được tạo/cập nhật bởi module Intelligence, không nằm trong SimulationEngine tick pipeline. |
| **Thể chế** (Institutions) | `GET universes/{id}/institutions`, `Institution` | Nhiều engine: **ReligionEngine**, **GovernanceEngine**, **CivilizationFormationEngine**, **LawEvolutionEngine**; WorldWillEngine, GreatFilterEngine (entity_type: FACTION, CULT, ORDER, regime, religion, corporation, …). |
| **Văn minh** (Civilizations) | Cùng API institutions, filter `entity_type === 'CIVILIZATION'` | **CivilizationFormationEngine** (formation), **ZoneConflictEngine** (CIVILIZATION), **GreatFilterEngine**, **CivilizationCollapseEngine** (fragment). |
| **Thực thể Tối cao** (SupremeEntity) | `GET universes/{id}/supreme-entities`, `SupremeEntity` | **AscensionEngine** (ascend hero → supreme), **GreatPersonEngine** (spawn great person / prophet / outer_god). API spawn: `WorldosEnginesController` + engine có `spawnIfEligible()`. |
| **Nợ nhân quả** (Causal debt / Karma) | Cùng SupremeEntity, field `karma` | Cùng nguồn SupremeEntity; karma là trường tính toán / cập nhật trên SupremeEntity (IntegrityMonitor hiển thị). |
| **Vật liệu** (Materials) | `GET universes/{id}/materials`, `MaterialInstance` | **ScenarioEngine** (material_spawn), kernel / Material DAG, evolution pipeline. |
| **Attractors** | Snapshot `active_attractors`, lab API `attractors` | **DynamicAttractorEngine** (spawn/decay attractor_instances, merge vào state_vector), **CivilizationCollapseEngine** (spawn fragment attractors), **AttractorEngine**; dashboard: `StrangeAttractorDetector`, `DarkAttractorDetector`. |
| **Chronicles** (myth, event) | `GET universes/{id}/chronicles` | **MythologyGeneratorEngine** (type `myth`), kernel events → Chronicle. |

---

## Ghi chú

- **SimulationEngine** (contract trong `Simulation/Contracts/SimulationEngine.php`) chạy trong tick pipeline và trả về `EngineResult` (events, state changes). Một số “sản phẩm” (ví dụ Actors, Institutions) được tạo/cập nhật bởi **module khác** (Intelligence, Institutions) hoặc **Action/Controller**, không phải engine trong registry.
- Để theo dõi “engine nào sinh ra entity X”: tra bảng trên theo loại entity; với Institutions cần xem thêm `entity_type` và engine theo phase (culture → ReligionEngine, social → CivilizationFormationEngine, …).
- Mở rộng sau: có thể thêm method tùy chọn trên engine (ví dụ `outputEntityTypes(): string[]`) hoặc API `GET engines` trả về danh sách engine kèm sản phẩm để UI hiển thị động.
