# Engine – Layer Mapping (WorldOS Architecture)

Tham chiếu: [WorldOS_Architecture.md](WorldOS_Architecture.md) §3, §17. Kernel chạy engine theo **priority** (số nhỏ chạy trước).

## Bảng ánh xạ (doc §3 pipeline)

| Priority | Tầng (doc §3) | Engine | Vị trí |
|----------|----------------|--------|--------|
| 0 | Physical | GeographyEngine | `Modules/World` |
| 1 | Planet / Zone | PotentialFieldEngine | `Simulation/Engines` |
| 2 | Climate | ClimateEngine | `Simulation/Engines` |
| 3 | (abstract) | CosmicPressureEngine | `Simulation/Engines` |
| 4 | Ecology (abstract) | StructuralDecayEngine | `Simulation/Engines` |
| 5 | Topology | AdaptiveTopologyEngine | `Simulation/Engines` |
| 6 | Politics | LawEvolutionEngine | `Simulation/Engines` |
| 7 | War | ZoneConflictEngine | `Simulation/Engines` |
| 9 | Culture | CulturalDriftEngine | `Simulation/Engines` |
| 11–17 | §6–8 (Ecology, Civ, Politics) | AgricultureEngine, PopulationEngine, MigrationEngine, DiseaseEngine, CivilizationFormationEngine, CitySimulationEngine, GovernanceEngine | `Simulation/Engines` |
| 18–20 | §9–10 (Trade, Knowledge) | TradeEngine, KnowledgePropagationEngine, TechEvolutionEngine | `Simulation/Engines` |
| 21–23 | §9–11 (Culture, Ideology) | ReligionEngine, ArtCultureEngine, PsychologyEngine | `Simulation/Engines` |
| 24 | Narrative / Evolution (§12–13) | CausalityEngine | `Simulation/Engines` |

Doc §3 pipeline thứ tự: 1 Planet, 2 Climate, 3 Ecology, 4 Civilization, 5 Politics, 6 War, 7 Trade, 8 Knowledge, 9 Culture, 10 Ideology, 11 Memory, 12 Mythology, 13 Evolution. Các engine trên ánh xạ vào pipeline này; Causality chạy cuối (causality graph update sau khi events được emit).

## Cấu trúc module theo tầng (doc §17)

- **World** (Physical): Geography, Climate, Disaster → `Modules/World`
- **Ecology**: Population, Migration, Disease, Agriculture → `Simulation/Engines`
- **Civilization**: City, War, Trade → `Simulation/Engines` (+ ZoneConflict)
- **Knowledge**: Tech, Innovation → `Simulation/Engines`
- **Culture**: Religion, Language, Mythology → `Simulation/Engines` (CulturalDrift, Religion, ArtCulture)
- **Evolution**: Ideology, Great Person, Psychology → `Modules/Simulation/Services` + PsychologyEngine
- **Simulation**: Kernel, AEE, Scheduler, TimelineSelection, Narrative → `Modules/Simulation`

Engine đăng ký trong `SimulationServiceProvider` qua `EngineRegistry`; thứ tự chạy theo `priority()`.
