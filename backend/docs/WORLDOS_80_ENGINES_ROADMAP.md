# WorldOS 80+ Engines Roadmap (Doc §37, tmp §7)

Bản đồ tham chiếu **WorldOS Ultimate Architecture** — 8+ tầng, mục tiêu 80–100+ engines. Hiện tại khoảng 22 engine trong EngineRegistry; thêm engine dần theo nhu cầu, không bắt buộc triển khai hết.

## Layer 1 — Physical World

| Engine | Trạng thái | Ghi chú |
|--------|------------|---------|
| Geography / Planet | **Có** | GeographyEngine, PotentialFieldEngine |
| Climate | **Có** | ClimateEngine |
| Geological | **Có** | GeologicalEngine |
| Ocean / Hydrology | **Chưa** | Roadmap |
| Planetary Physics | **Một phần** | CosmicPressureEngine |

## Layer 2 — Population & Demography

| Engine | Trạng thái |
|--------|------------|
| Population | **Có** | PopulationEngine, DemographicRatesService |
| Migration | **Có** | MigrationEngine |
| Disease | **Có** | DiseaseEngine |
| Demography (4-stage) | **Có** | DemographicStages, DemographicRatesService |

## Layer 3 — Individual Mind / Behavior

| Engine | Trạng thái |
|--------|------------|
| Actor Cognition (17 traits) | **Có** | ActorCognitiveService, Agent (Rust) |
| Decision / Utility | **Có** | DecisionEngine, ActorBehaviorEngine |
| Memory & Learning | **Một phần** | Stub / roadmap |

## Layer 4 — Information & Social

| Engine | Trạng thái |
|--------|------------|
| Idea Diffusion | **Có** | IdeaDiffusionEngine |
| Knowledge Graph | **Có** | KnowledgeGraphService (nodes + edges) |
| Education / Media | **Chưa** | Roadmap |
| Social Graph | **Có** | SocialGraphService |

## Layer 5 — Economy & Infrastructure

| Engine | Trạng thái |
|--------|------------|
| Global Economy | **Có** | GlobalEconomyEngine |
| Market / Trade | **Có** | MarketEngine, TradeEngine |
| Inequality | **Có** | InequalityEngine |
| Infrastructure / Settlement | **Có** | CivilizationSettlementEngine, UrbanStressAgricultureService |
| Production / Finance | **Một phần** | Roadmap |

## Layer 6 — Social Structure & Culture

| Engine | Trạng thái |
|--------|------------|
| Field Diffusion | **Có** | FieldDiffusionEngine |
| Ideology Evolution | **Có** | IdeologyEvolutionEngine |
| Religion | **Có** | ReligionEngine |
| Culture & Norms | **Một phần** | CulturalDriftEngine, ArtCultureEngine |

## Layer 7 — Political & Power

| Engine | Trạng thái |
|--------|------------|
| Politics | **Có** | PoliticsEngine |
| War / Conflict | **Có** | WarEngine, ZoneConflictEngine |
| Governance | **Có** | GovernanceEngine |
| Diplomacy / Empire | **Một phần** | Roadmap |

## Layer 8 — Civilization Dynamics

| Engine | Trạng thái |
|--------|------------|
| Civilization Cycle / Collapse | **Có** | CivilizationCollapseEngine, AttractorEngine |
| Emergence / Pattern | **Có** | AttractorEngine, score_patterns |
| Innovation / Scientific Revolution | **Một phần** | InnovationRateService, TechEvolutionEngine |

## Layer 9+ — Meta & Core

| Engine | Trạng thái |
|--------|------------|
| Causality | **Có** | RedisCausalityGraphService |
| Narrative / Memory | **Có** | CivilizationMemoryEngine, NarrativeExtractionEngine, CivilizationNarrativeInterpreter |
| Stability / Chaos | **Có** | ChaosEngine |
| Reality Calibration | **Có** | RealityCalibrationService |
| Scheduler / Tick | **Có** | SimulationScheduler, TickScheduler, EngineRegistry |
| Kafka Event Stream | **Có** | Phase 1 |
| Spatial Partition / Sharding | **Chưa** | Design doc DISTRIBUTED_SIMULATION_ARCHITECTURE |

Tham chiếu: [WORLDOS_ARCHITECTURE_MAPPING.md](WORLDOS_ARCHITECTURE_MAPPING.md) §37, [ENGINE_LAYER_MAPPING.md](ENGINE_LAYER_MAPPING.md), [RÀ_SOÁT_TMP.md](../../docs/RÀ_SOÁT_TMP.md).
