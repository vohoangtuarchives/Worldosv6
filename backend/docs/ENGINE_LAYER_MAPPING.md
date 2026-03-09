# Engine – Layer Mapping (WorldOS Architecture)

Tham chiếu: [WorldOS_Architecture.md](WorldOS_Architecture.md) §3, §17. Kernel chạy engine theo **priority** (số nhỏ chạy trước).

## Bảng ánh xạ

| Priority | Tầng (doc)   | Engine hiện tại        | Module / vị trí        |
|----------|--------------|-------------------------|------------------------|
| 0        | Physical     | GeographyEngine         | `Modules/World`         |
| 1        | Planet / Zone| PotentialFieldEngine    | `Simulation/Engines`    |
| 2        | Climate      | CosmicPressureEngine    | `Simulation/Engines`    |
| 3        | Ecology      | StructuralDecayEngine   | `Simulation/Engines`    |
| 4        | Civilization | AdaptiveTopologyEngine  | `Simulation/Engines`    |
| 5        | Politics     | LawEvolutionEngine      | `Simulation/Engines`    |
| 6        | War          | ZoneConflictEngine      | `Simulation/Engines`    |
| 9        | Culture      | CulturalDriftEngine     | `Simulation/Engines`    |

## Cấu trúc module theo tầng (doc §17)

- **World** (Physical): Geography, Climate, Disaster → `Modules/World`
- **Ecology**: Population, Migration, Disease, Agriculture → `Modules/Ecology` (placeholder)
- **Civilization**: City, War, Trade → `Modules/Civilization` (placeholder)
- **Trade**: Economy, Market → (có thể gộp Civilization)
- **Knowledge**: Tech, Innovation → `Modules/Knowledge` (placeholder)
- **Culture**: Religion, Language, Mythology → `Modules/Culture` (placeholder)
- **Evolution**: Ideology, Great Person, Psychology → `Modules/Evolution` (một phần trong `Modules/Simulation/Services`)
- **Simulation**: Kernel, AEE, Scheduler, TimelineSelection, Narrative → `Modules/Simulation`

Engine đăng ký trong `SimulationServiceProvider` qua `EngineRegistry`; thứ tự chạy theo `priority()`.
