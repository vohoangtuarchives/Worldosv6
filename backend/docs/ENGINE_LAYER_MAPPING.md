# Engine – Layer Mapping (WorldOS Architecture)

Tham chiếu: [WorldOS_Architecture.md](WorldOS_Architecture.md) §3, §17. Kernel chạy engine theo **phase** rồi **priority** (Doc 21 §6).

## Bảng ánh xạ (doc §3 pipeline)

| Priority | Phase | Tầng (doc §3) | Engine | Vị trí |
|----------|--------|----------------|--------|--------|
| 0 | physical | Physical | GeographyEngine | `Modules/World` |
| 1 | physical | Planet / Zone | PotentialFieldEngine | `Simulation/Engines` |
| 2 | climate | Climate | ClimateEngine | `Simulation/Engines` |
| 3 | meta | (abstract) | CosmicPressureEngine | `Simulation/Engines` |
| 4 | ecology | Ecology (abstract) | StructuralDecayEngine | `Simulation/Engines` |
| 5 | meta | Topology | AdaptiveTopologyEngine | `Simulation/Engines` |
| 6 | politics | Politics | LawEvolutionEngine | `Simulation/Engines` |
| 7 | conflict | War | ZoneConflictEngine | `Simulation/Engines` |
| 9 | culture | Culture | CulturalDriftEngine | `Simulation/Engines` |
| 11–17 | ecology / economy / social / politics | §6–8 | AgricultureEngine, PopulationEngine, MigrationEngine, DiseaseEngine, CivilizationFormationEngine, CitySimulationEngine, GovernanceEngine | `Simulation/Engines` |
| 18–20 | economy / meta | §9–10 | TradeEngine, KnowledgePropagationEngine, TechEvolutionEngine | `Simulation/Engines` |
| 21–23 | culture | §9–11 | ReligionEngine, ArtCultureEngine, PsychologyEngine | `Simulation/Engines` |
| 24 | meta | Narrative / Evolution (§12–13) | CausalityEngine | `Simulation/Engines` |

Thứ tự phase (EngineRegistry): physical → climate → ecology → economy → social → politics → conflict → culture → meta → default.

Doc §3 pipeline thứ tự: 1 Planet, 2 Climate, 3 Ecology, 4 Civilization, 5 Politics, 6 War, 7 Trade, 8 Knowledge, 9 Culture, 10 Ideology, 11 Memory, 12 Mythology, 13 Evolution. Các engine trên ánh xạ vào pipeline này; Causality chạy cuối (causality graph update sau khi events được emit).

## Cấu trúc module theo tầng (doc §17)

- **World** (Physical): Geography, Climate, Disaster → `Modules/World`
- **Ecology**: Population, Migration, Disease, Agriculture → `Simulation/Engines`
- **Civilization**: City, War, Trade → `Simulation/Engines` (+ ZoneConflict)
- **Knowledge**: Tech, Innovation → `Simulation/Engines`
- **Culture**: Religion, Language, Mythology → `Simulation/Engines` (CulturalDrift, Religion, ArtCulture)
- **Evolution**: Ideology, Great Person, Psychology → `Modules/Simulation/Services` + PsychologyEngine
- **Simulation**: Kernel, AEE, Scheduler, TimelineSelection, Narrative → `Modules/Simulation`

Engine đăng ký trong `SimulationServiceProvider` qua `EngineRegistry`; thứ tự chạy theo `phase()` rồi `priority()` (Doc 21 §6).

## SimulationScheduler (Doc §4.3, §23; RÀ_SOÁT_TMP mục 1)

**SimulationScheduler** ([SimulationScheduler.php](../app/Simulation/SimulationScheduler.php)) là component quản lý tick assignment ở mức universe: (1) danh sách engine active tại mỗi tick (`enginesActiveAtTick(tick)` = EngineRegistry.getOrdered() lọc theo `tick % tickRate === 0`), (2) thứ tự stage và interval từ TickScheduler (config `worldos.tick_pipeline`). Kernel và Pipeline không bắt buộc dùng trực tiếp SimulationScheduler; Scheduler là điểm đặt tên rõ cho "ai quyết định chạy gì ở tick nào". Singleton: `App\Simulation\SimulationScheduler`.

## Engine Dependency Graph / Communication (Doc §25)

**Quy tắc:** Engine **không gọi trực tiếp** engine khác. Giao tiếp qua **event**: emit `SimulationEventOccurred` / `WorldEventBus::publish`, engine khác subscribe listener. Hiện tại một số stage (vd. EconomyStage) gọi nhiều service (GlobalEconomy rồi Market); refactor dần: chuyển sang engine A emit event → engine B listener. Tham chiếu: [WORLDOS_ARCHITECTURE_MAPPING.md](WORLDOS_ARCHITECTURE_MAPPING.md) §25.

## Sản phẩm / Output (Products)

Ánh xạ **engine → sản phẩm tiểu biểu** (entity types mà engine tạo hoặc cập nhật) và **product → engines** dùng cho UI tab Thực thể ("Engine liên quan"): xem [ENGINE_PRODUCTS.md](ENGINE_PRODUCTS.md). API `GET /worldos/engines` trả về `engines` (name, phase, priority, tick_rate, product_types) và `product_to_engines`. Engine có thể dùng trait `HasProductTypes` và override `productTypes()`; map tĩnh trong `config/worldos_engine_products.php`. Command: `php artisan worldos:engine-products`.
