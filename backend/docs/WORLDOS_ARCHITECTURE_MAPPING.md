# WorldOS — So khớp kiến trúc với code

Tài liệu ánh xạ **Kiến trúc Toàn Diện** ([WORLDOS_ARCHITECTURE.md](../../docs/WORLDOS_ARCHITECTURE.md)) với codebase hiện tại: engine/service nào đã có (Laravel vs Rust), phần nào còn thiếu hoặc chỉ có stub.

Tham chiếu thêm: [WORLDOS_ENGINES_AND_MODULES.md](WORLDOS_ENGINES_AND_MODULES.md), [ENGINE_LAYER_MAPPING.md](ENGINE_LAYER_MAPPING.md), [RUST_LARAVEL_SIMULATION_CONTRACT.md](RUST_LARAVEL_SIMULATION_CONTRACT.md).

---

## Ký hiệu

| Ký hiệu | Ý nghĩa |
|--------|----------|
| **Có** | Engine / tính năng đã có, đủ theo spec (có thể Laravel hoặc Rust) |
| **Một phần** | Có implementation nhưng thiếu một số phần theo doc (hoặc Hỗn hợp Laravel + Rust) |
| **Stub** | Có class/interface, logic rất sơ bộ |
| **Thiếu** | Chưa có implementation tương ứng trong repo |
| **Laravel** / **Rust** | Vị trí code (bổ sung cho Có/Một phần) |

---

## Bảng đánh giá từng engine (Có / Một phần / Thiếu)

| § | Engine (theo doc) | Đánh giá | Ghi chú ngắn |
|---|-------------------|----------|---------------|
| 6 | Social Field Engine | **Có** | FieldDiffusionEngine (Laravel) + global_fields (Rust) |
| 7 | Economic Field Engine | **Có** | GlobalEconomyEngine, MarketEngine, CosmicEnergyPool, **InequalityEngine** (gini, surplus_concentration) |
| 8 | Information Propagation Engine | **Có** | IdeaDiffusionEngine: info_type (rumor/propaganda/science/religion/meme), institutional amplification (church/state/academy) |
| 9 | Innovation & Technology Engine | **Có** | InnovationRateService, technology level **Có**; KnowledgeGraphService (stub) — state_vector.knowledge_graph **Có** |
| 10 | Religion & Ideology Engine | **Có** | IdeologyEvolutionEngine; IdeologyConversionService (conversion **Có**) |
| 11 | Great Person Engine | **Có** | GreatPersonEngine, AscensionEngine, Supreme Entity; **GreatPersonLegacyService** (state_vector.great_person_legacy) **Có** |
| 12 | Geopolitics & War Engine | **Có** | WarEngine có; army (soldiers, training, technology, morale), war_stage **Có** |
| 13 | Demographic & Population Engine | **Có** | DemographicStages (4-stage), **DemographicRatesService** (stage, birth_rate, death_rate từ knowledge/urban) |
| 14 | Climate & Environment Engine | **Có** | PlanetaryClimateEngine, GeologicalEngine, GeographyResourceService |
| 15 | Infrastructure & Urban Development Engine | **Có** | Settlement evolution **Có**; infrastructure (roads, ports, water_supply, sanitation, energy) trong settlements **Có** |
| 16 | Global Trade & Economic Network Engine | **Có** | GlobalEconomyEngine: trade_flow, hub_scores (connectivity + surplus); config worldos.economy |
| 17 | Civilization Cycle Engine | **Có** | CivilizationCollapseEngine, DynamicAttractorEngine, AttractorEngine; **LegitimacyEliteService** (legitimacy_aggregate, elite_ratio, elite_overproduction) |
| 18 | Narrative & Historical Memory Engine | **Có** | WorldEventType, Chronicle, CivilizationMemoryEngine, NarrativeExtractionEngine; Kafka **Thiếu** |
| 19 | Causality Graph Engine | **Có** | RedisCausalityGraphService, NullCausalityGraphService; API có khi dùng Redis |
| 20 | Emergence Detection Engine | **Có** | AttractorEngine có; confidence_threshold 0.7, emergence_events **Có** |
| 21 | Psychology & Consciousness Engine | **Có** | ActorCognitiveService: mental_state (beliefs, goals, emotions), perception_state (information_accuracy, rumors), cognitive_biases |
| 22 | AI-Driven Agents / Social graph | **Có** | SocialGraphService: trust, loyalty, rivalry edges từ institutional membership; state_vector.social_graph |
| 23 | Simulation Execution Model | **Có** | Hybrid tick + event, pipeline; multi-scale time; activation model **Có (doc)** (SimulationEngine::tickRate, EngineRegistry) |
| 24 | Memory Layout & Performance Architecture | **Một phần** | ECS/SoA zone có; spatial index, CSR **Thiếu**; tick_duration_ms + worldos:benchmark-tick **Có** |
| 25 | Engine Dependency Graph | **Có** | Stage order, ENGINE_LAYER_MAPPING; event-driven **Có**, “không gọi trực tiếp” **Một phần** |
| 26 | Engine Plugin & Versioning Architecture | **Có** | SimulationEngine::version() **Có**; engine_manifest trên Universe + snapshot metrics **Có**; replay cảnh báo manifest **Có** |
| 27 | Time & Timeline Architecture | **Có** | Universe, fork, snapshot **Có**; deterministic replay **Một phần** |
| 28 | Distributed Simulation Architecture | **Thiếu** | Single-node; shards, cross-shard, ghost zones **Thiếu** |
| 29 | AI Research Layer | **Có** | POST worldos/ai/policy-simulation **Có**; FeatureExtractionService (input_features, output_features); data lake đủ |
| 30 | Self-Improving Simulation Architecture | **Stub** | SelfImprovingSimulationService stub; hook trong AdvanceSimulationAction (config worldos.self_improving.enabled) gọi proposeRule; closed loop / rule versioning **Thiếu** |
| 31 | Observability & Debugging Architecture | **Có** | Event UI **Có**; Prometheus **Có** (GET worldos/metrics); replay CLI **Có** (worldos:replay); Jaeger **Stub** (SimulationTracer::span khi tracing_enabled) |
| 32 | Stability & Chaos Control Engine | **Có** | ChaosEngine có; 4 cơ chế dampening, throttle, quarantine **Có** (config worldos.chaos) |
| 33 | Reality Calibration System | **Có** | calibration_benchmarks, RealityCalibrationService (getBenchmarks, compareWithBenchmarks, suggestAdjustments); worldos:calibration-check |
| 34 | Physics of Civilization Engine | **Có** | CosmicEnergyPool, entropy, attractors, phase transition (Laravel) **Có** |
| 35 | Multiverse Simulation System | **Có** | MultiverseSchedulerEngine, fork, nhiều universes; distributed cluster **Thiếu** |
| 36 | Civilization Discovery Engine | **Một phần** | Genome + fitness **Có**; evaluate() + runGeneration() stub **Có**; vòng GA đầy đủ **Thiếu** |
| 37 | WorldOS Ultimate Map (80+ Engines) | **Một phần** | Nhiều engine có theo từng layer; đủ 80+ **Thiếu** |

**Tổng kết nhanh (§6–§37):** **Có** 22 · **Một phần** 2 · **Stub** 2 · **Thiếu** 7.

---

## 1. Tổng quan hệ thống

| Thành phần | Trạng thái | Ghi chú |
|------------|------------|---------|
| Next.js Frontend | **Có** | `frontend/` — visualization, dashboard, cosmologic UI |
| Laravel Control Plane | **Có** | API, auth, orchestration, EvaluateSimulationResult, pulse |
| Rust Simulation Kernel | **Có (một phần)** | `engine/worldos-core`, `engine/worldos-grpc` — zones, entropy, cascade, advance |
| gRPC Laravel ↔ Rust | **Có** | HttpSimulationEngineClient, StubSimulationEngineClient; advance(int, ticks, stateInput) |
| Apache Kafka event stream | **Stub / Thiếu** | Event bus hiện: Laravel Event + Redis Stream hoặc DB; chưa Kafka production |
| PostgreSQL snapshot/history | **Có** | Universe, UniverseSnapshot, chronicles, world_events |

---

## 2. Giao thức giao tiếp

| Giao thức | Trạng thái |
|-----------|------------|
| JSON over HTTP (API) | **Có** — Laravel routes, worldos API |
| gRPC Laravel → Rust | **Có** — qua HTTP bridge (transport_http) hoặc gRPC (transport_grpc) |
| Kafka (Rust → events) | **Thiếu** — hiện Laravel dispatch SimulationEventOccurred, Redis Stream optional |
| NATS (scheduler → engine) | **Thiếu** — scheduler trong Laravel (queue jobs) |
| WebSocket (Laravel → Frontend) | **Có** (nếu đã cấu hình) — realtime state |

---

## 3. Simulation Kernel Architecture (Rust)

| Thành phần doc | Trạng thái | Code |
|----------------|------------|------|
| Crate layout (worldos-kernel, worldos-world, …) | **Một phần** | Thực tế: `worldos-core` (universe, agent, cascade, types), `worldos-grpc` (server, transport) |
| Kernel core loop | **Có** | advance → tick_with_cascade (cascade.rs), zone update (universe.rs) |
| Tick pipeline (8 bước doc) | **Hỗn hợp** | Rust: zone local → aggregate → diffusion. Laravel: SimulationTickPipeline với stages (Ecology, Civilization, Economy, Politics, War, Actor, Culture, MetaCosmic) |
| World State struct | **Có** | UniverseState (zones, global_entropy, knowledge_core, global_fields, attractors, macro_agents) |

---

## 4. World Model Representation

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| SoA (Structure of Arrays) | **Rust** | ZoneState theo zone; traits/state trong types |
| Grid / Zones | **Có** | ZoneStateSerial (id, state, neighbors), ZoneState (entropy, material_stress, civ_fields, …) |
| Multi-layer graph | **Một phần** | Attractors, scars; graph sync Neo4j (SyncToGraph) optional |
| Hot/Warm/Cold state | **Một phần** | Snapshot (DB), state_vector JSON; cold archive (VoidArchive) |

---

## 5. Actor Cognition System (17 Traits)

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| 17 traits (dom, amb, coe, …) | **Có** | Rust: `TraitVector` (agent.rs). Laravel: ActorCognitiveService, ActorDecisionEngine, DecisionEngine |
| Motivation / utility | **Laravel** | DecisionEngine, AgentAutonomyService — evaluate(snapshot) → action |
| Action types | **Laravel** | ActorBehaviorEngine, behavior logic |
| Archetype classifier | **Có** | CivilizationAttractorEngine (archetypes), AttractorEngine (rules) |

---

## 6. Social Field Engine

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| Field store (fear, ideology, wealth, …) | **Laravel** | FieldDiffusionEngine — 5 Attractor Fields, diffusion + decay |
| Field propagation | **Laravel** | FieldDiffusionEngine::run(), institution boosts |
| **Rust** | **Một phần** | global_fields (survival, power, wealth, knowledge, meaning) trong UniverseState/ZoneState |

---

## 7. Economic Field Engine

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| Zone economy state | **Hỗn hợp** | state_vector.civilization.economy (Laravel GlobalEconomyEngine), zones[].state (Rust) |
| Production / consumption | **Laravel** | GlobalEconomyEngine (surplus/consumption từ settlements) |
| Price mechanism | **Laravel** | MarketEngine — food + energy price (cosmic_energy_pool scarcity) |
| Inequality dynamics | **Một phần** | metrics, civilization state; chưa engine riêng inequality |

---

## 8. Information Propagation Engine

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| InfoUnit / diffusion | **Laravel** | IdeaDiffusionEngine — ý tưởng lan truyền |
| info_type (rumor, propaganda, science, religion, meme) | **Có** | Idea.info_type; IdeaDiffusionEngine gán từ config worldos.idea_diffusion.info_type_map (artifact_type → info_type) |
| Institutional amplification | **Có** | IdeaDiffusionEngine::institutionalAmplification() — church→religion, state→propaganda, philosophy_school→science; config institutional_amplification |

---

## 9. Innovation & Technology Engine

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| Knowledge graph / prerequisites | **Có (stub)** | KnowledgeGraphService — nodes từ Idea (id, type, knowledge_level, followers), edges stub (derived_from); state_vector.knowledge_graph; config worldos.knowledge_graph |
| Innovation rate formula | **Có** | InnovationRateService::compute(knowledgeStock, curiosityDensity, economicSurplus, institutionStrength) |
| Technology level | **Có** | InnovationRateService::technologyLevelFromKnowledge — primitive → agricultural → industrial → modern → digital |

---

## 10. Religion & Ideology Engine

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| Ideology struct / emergence | **Laravel** | IdeologyEvolutionEngine — dominant ideology từ institutions |
| Conversion / lifecycle | **Có** | IdeologyConversionService — conversion probability (from→to) theo legitimacy, coherence; state_vector.ideology_conversion.rate_per_tick; IdeologyEvolutionEngine gọi storeConversionRate |

---

## 11. Great Person Engine

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| Emergence conditions | **Laravel** | GreatPersonEngine — entropy range, institutions, cooldown |
| Archetype (Conqueror, Prophet, …) | **Laravel** | SpawnSupremeEntityAction, AscensionEngine; Supreme Entity |
| Influence / Legacy | **Có** | HeroLifecycleService, MythicResonanceEngine; **GreatPersonLegacyService** ghi state_vector.great_person_legacy (aggregate_power_level, aggregate_karma, legacy_myth_actor_count); config worldos.pulse.run_great_person_legacy |

---

## 12. Geopolitics & War Engine

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| Polity power / war trigger | **Laravel** | WarEngine — conflict pressure, state_vector.civilization.war |
| Military model (Army) | **Có** | WarEngine — army (soldiers, training, technology, morale); state_vector.civilization.war.army |
| War stages | **Có** | WarEngine WAR_STAGE_MOBILIZATION → CAMPAIGN → BATTLES → ATTRITION → NEGOTIATION; state_vector.civilization.war.war_stage |

---

## 13. Demographic & Population Engine

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| Population state | **Hỗn hợp** | Rust: zone state, population_proxy. Laravel: CivilizationSettlementEngine (population từ state_vector hoặc Actor count) |
| Birth/death/urban growth | **Có** | DemographicRatesService — stage, birth_rate, death_rate, urban_ratio_proxy từ knowledge/urban; state_vector.civilization.demographic |
| Demographic transition | **Có** | DemographicStages (4-stage model); DemographicRatesService gán rate theo stage |

---

## 14. Climate & Environment Engine

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| Environment state (per zone) | **Laravel** | PlanetaryClimateEngine, GeologicalEngine; geography/resources |
| Agriculture capacity | **Một phần** | GeographyResourceService (resource_capacity → Rust input); food_production trong spec chưa đủ |
| Natural disaster | **Một phần** | AnomalyGeneratorService; chưa Disaster struct theo spec |

---

## 15. Infrastructure & Urban Development Engine

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| Settlement evolution (hamlet → city) | **Laravel** | CivilizationSettlementEngine — settlements, tier |
| Infrastructure state | **Có** | CivilizationSettlementEngine — mỗi settlement có infrastructure (roads, ports, water_supply, sanitation, energy) trong state_vector |
| Urban stress | **Một phần** | material_stress, inequality trong metrics |

---

## 16. Global Trade & Economic Network Engine

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| Trade route formation | **Laravel** | MarketEngine — TRADE_ROUTE_ESTABLISHED event khi surplus/deficit zones |
| Trade flow | **Có** | GlobalEconomyEngine::computeTradeFlow() — route_capacity × supply × demand proxy; state_vector.civilization.economy.trade_flow |
| hub_score / connectivity | **Có** | GlobalEconomyEngine::computeHubScores() — per-zone hub_scores; config worldos.economy (trade_route_capacity_factor, hub_connectivity_factor) |

---

## 17. Civilization Cycle Engine

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| Macro state (prosperity, cohesion, …) | **Một phần** | state_vector.civilization (economy, politics, war); global_fields (Rust) |
| Phase detection (Formation → Collapse) | **Laravel** | CivilizationCollapseEngine, DynamicAttractorEngine, AttractorEngine |
| Elite overproduction / legitimacy | **Có** | LegitimacyEliteService — legitimacy_aggregate (từ institutions), elite_ratio, elite_overproduction; state_vector.civilization.politics; config worldos.legitimacy |

---

## 18. Narrative & Historical Memory Engine

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| Event struct / importance | **Laravel** | WorldEventType, SimulationEventOccurred, Chronicle, BranchEvent |
| Event clustering (micro → macro) | **Laravel** | CivilizationMemoryEngine, NarrativeExtractionEngine, ChronicleTimelineView |
| Kafka → Laravel → AI Narrative | **Một phần** | Laravel Event + NarrativeAiService; config worldos.narrative.kafka_enabled (false) — Kafka optional, driver tương lai |

---

## 19. Causality Graph Engine

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| CausalEvent / CausalLink | **Laravel** | RedisCausalityGraphService, NullCausalityGraphService |
| Query API (causes/effects) | **Có** (nếu backend Redis) | API causality |

---

## 20. Emergence Detection Engine

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| Pattern library (Industrialization, Revolution) | **Laravel** | AttractorEngine (rules), DynamicAttractorEngine; chưa pattern confidence 0.7 |
| detect_emergence() | **Một phần** | AttractorEngine::evaluate(); chưa score_patterns chuẩn doc |

---

## 21. Psychology & Consciousness Engine

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| Mental state (beliefs, goals, emotions) | **Có** | ActorCognitiveService::computeMentalState() — beliefs, goals, emotions (fear, anger, hope, pride); cognitive_aggregate.mental_state |
| Perception ≠ Reality | **Có** | ActorCognitiveService::computePerceptionState() — information_accuracy, rumors; cognitive_aggregate.perception_state |
| Cognitive biases | **Có** | ActorCognitiveService::computeCognitiveBiases() — confirmation_bias, loss_aversion, status_quo_bias, authority_bias |

---

## 22. AI-Driven Agents / Social graph

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| Agent core (memory, beliefs, goals, planner) | **Một phần** | Rust Agent (agent.rs); Laravel ActorBehaviorEngine, AgentAutonomyService |
| Agent hierarchy (individual → civilization) | **Một phần** | Actors, institutions, macro_agents (Rust); chưa family/civilization agents rõ |
| Social graph (trust, loyalty, rivalry) | **Có** | SocialGraphService — edges từ institutional membership (cùng idea → trust/loyalty; khác entity_type → rivalry); state_vector.social_graph; config worldos.social_graph |

---

## 23. Simulation Execution Model

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| Hybrid tick + event | **Có** | Advance (tick) → EvaluateSimulationResult (event) → stages |
| Activation model (tick_rate per engine) | **Có (doc)** | SimulationEngine::tickRate(); EngineRegistry ordering; engine chạy khi tick % tickRate === 0 |
| Multi-scale time | **Một phần** | economy_tick_interval; chưa phân biệt Climate=yearly, War=hourly |
| Actor activation (active vs passive) | **Một phần** | Actors (Laravel); Rust zone-level; chưa 100k active / 90% passive rõ |
| Parallel execution | **Rust** | Có thể par_iter trong Rust; Laravel sequential stages |

---

## 24. Memory Layout & Performance Architecture

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| ECS + SoA | **Rust** | ZoneState array, global_fields; chưa full ActorStorage SoA 17 traits |
| Spatial index (zone → actors) | **Thiếu** | Chưa ZoneActorIndex |
| Graph CSR | **Thiếu** | Chưa Compressed Sparse Row cho social graph |
| Tick duration metric | **Có** | AdvanceSimulationAction tính tick_duration_ms; Cache `worldos.tick_duration_ms.{universe_id}`; snapshot metrics có thể chứa timing |
| Performance target (5–20 ms/tick) | **Chưa đo** | Cần script benchmark (vd. advance N tick rồi đọc Cache / metrics) |

---

## 25. Engine Dependency Graph

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| Layer 1–8 (Physical → Meta) | **Một phần** | ENGINE_LAYER_MAPPING.md, SimulationTickPipeline stage order |
| Engine không gọi trực tiếp nhau | **Một phần** | Stages độc lập; một số engine gọi engine khác (e.g. EconomyStage gọi GlobalEconomy rồi Market) |
| Event-driven communication | **Có** | SimulationEventOccurred, WorldEventBus; chưa toàn bộ engine emit event |

---

## 26. Engine Plugin & Versioning Architecture

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| Engine trait (name, version, dependencies, tick) | **Có** | SimulationEngine (priority, tickRate, handle); SimulationEngine::version(), HasEngineVersion |
| Engine manifest per universe | **Có** | Universe.engine_manifest; AdvanceSimulationAction ghi engine_manifest từ EngineRegistry::getManifest(); snapshot metrics chứa engine_manifest |
| Pin engine versions (replay) | **Một phần** | worldos:replay so sánh engine_manifest với snapshot; cảnh báo khi khác (chưa pin cứng) |

---

## 27. Time & Timeline Architecture

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| Universe (id, parent, fork_tick, seed) | **Có** | Universe model, SagaService spawnUniverse, ForkUniverseAction |
| Timeline branching | **Có** | Fork, BranchEvent, parent/child universes |
| Deterministic replay | **Một phần** | Seed; cùng engine version chưa đảm bảo |
| Snapshot interval | **Có** | Snapshot model, advance trả snapshot |

---

## 28. Distributed Simulation Architecture

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| Spatial partition / shards | **Thiếu** | Single-node Rust; chưa 64 shards / cluster |
| Cross-shard events | **Thiếu** | — |
| Ghost zones | **Thiếu** | — |

---

## 29. AI Research Layer

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| Data lake schema (runs, events, metrics) | **Một phần** | PostgreSQL: universes, snapshots, world_events, chronicles; chưa đủ bảng theo doc |
| Feature extraction | **Có** | FeatureExtractionService::extract(universe, snapshot) — vector số (entropy, stability, economy, politics, demographic, cognitive, war, market); dùng cho policy-simulation |
| Policy simulation API | **Có** | POST worldos/ai/policy-simulation — input_features, output_features từ FeatureExtractionService; advance(ticks) rồi trả output_features |

---

## 30. Self-Improving Simulation Architecture

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| Stub / hook | **Có** | SelfImprovingSimulationService; AdvanceSimulationAction gọi proposeRule khi worldos.self_improving.enabled |
| Closed loop (Simulation → AI → Rule proposal → Sandbox → Deploy) | **Thiếu** | — |
| Rule versioning (v1, v2, sandbox) | **Thiếu** | — |

---

## 31. Observability & Debugging Architecture

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| Metrics (Prometheus) | **Có** | GET worldos/metrics, SimulationMetricsExporter — Prometheus text format |
| Traces (Jaeger) | **Stub** | config worldos.observability.tracing_enabled (false); khi bật sẽ span simulation steps (tương lai) |
| Event Explorer UI | **Có** | EventFeed, ChronicleTimelineView |
| Simulation replay (CLI) | **Có** | php artisan worldos:replay — so sánh engine_manifest |

---

## 32. Stability & Chaos Control Engine

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| Chaos score | **Laravel** | ChaosEngine |
| Dampening / throttling / quarantine | **Có** | ChaosEngine::dampen, throttleProbability, quarantineInfluence; config worldos.chaos (dampening_stability_factor, throttle_multiplier, quarantine_instability_threshold, quarantine_scale) |

---

## 33. Reality Calibration System

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| Historical benchmarks | **Có** | calibration_benchmarks table (migration), RealityCalibrationService::getBenchmarks, compareWithBenchmarks |
| Auto-calibration loop | **Có (suggest + optional check)** | RealityCalibrationService::suggestAdjustments(deltas); php artisan worldos:calibration-check --universe=&lt;id&gt;; config worldos.calibration.auto_run (no auto-apply) |

---

## 34. Physics of Civilization Engine

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| Civilization energy E | **Một phần** | CosmicEnergyPoolService, energy_level metrics |
| Social entropy formula | **Một phần** | entropy, material_stress, structural decay |
| Attractors | **Có** | DynamicAttractorEngine, AttractorEngine, attractors/dark_attractors (Rust) |
| Phase transition detection | **Laravel** | EcologicalPhaseTransitionEngine, GenreBifurcationEngine |

---

## 35. Multiverse Simulation System

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| Universe seed structure | **Một phần** | Seed, state input; chưa UniverseSeed struct đầy đủ |
| Parallel universe cluster | **Laravel** | MultiverseSchedulerEngine, nhiều universes; chưa distributed cluster |
| What-if / parameter sweep | **Một phần** | Fork, nhiều universes; chưa job queue 1M universes |

---

## 36. Civilization Discovery Engine

| Thành phần | Trạng thái | Code |
|------------|------------|------|
| Civilization genome | **Có** | CivilizationDiscoveryService — GOVERNANCE_TYPES, ECONOMIC_TYPES, BELIEF_TYPES |
| Fitness evaluation | **Có** | CivilizationDiscoveryService::evaluate() — fitness tính và ghi state_vector.civilization.discovery.fitness mỗi N tick; fitness() formula **Có** |
| Evolutionary search | **Một phần** | runGeneration(universeIds) stub — trả về evaluated/selected; vòng GA đầy đủ (selection, crossover, mutate) **Thiếu** / roadmap |

---

## 37. WorldOS Ultimate Map (80+ Engines)

| Layer doc | Trạng thái tổng thể |
|-----------|---------------------|
| Layer 1 Physical | **Một phần** — GeologicalEngine, PlanetaryClimateEngine; thiếu Planetary Physics, Ocean |
| Layer 2 Population | **Một phần** — CivilizationSettlementEngine, population proxy; thiếu Demography, Migration, Disease engine đầy đủ |
| Layer 3 Individual Mind | **Một phần** — ActorCognitiveService, DecisionEngine, ActorBehaviorEngine; thiếu Memory & Learning engine |
| Layer 4 Information | **Một phần** — IdeaDiffusionEngine; Knowledge graph **Có** (KnowledgeGraphService); thiếu Education, Media |
| Layer 5 Economy | **Một phần** — GlobalEconomyEngine, MarketEngine, CosmicEnergyPool; thiếu Production, Finance, Infrastructure chi tiết |
| Layer 6 Social Structure | **Một phần** — FieldDiffusionEngine, IdeologyEvolutionEngine; thiếu Culture & Norm Emergence, Class engine |
| Layer 7 Political & Power | **Một phần** — PoliticsEngine, WarEngine; thiếu Governance, Diplomacy, Empire Dynamics |
| Layer 8 Civilization Dynamics | **Một phần** — CivilizationCollapseEngine, AttractorEngine; thiếu Innovation/Scientific Revolution engine |
| Layer 9 Meta | **Một phần** — Causality (Redis), Emergence (Attractor), Narrative (Laravel), Stability (ChaosEngine); **Reality Calibration Có** (RealityCalibrationService, suggestAdjustments, worldos:calibration-check) |
| Layer 10 Core | **Có** — Scheduler (Laravel), World State (Rust), Event (Laravel); thiếu Kafka, Spatial Partition |
| Layer 11–13 Research/Observability | **Một phần** — **Prometheus Có** (GET worldos/metrics), **Replay Có** (worldos:replay); MultiverseSynthesisService, MultiverseSovereigntyService stub; thiếu ML, Jaeger integration đầy đủ |

---

## Tóm tắt ưu tiên so với doc

1. **Đã tương đối sát spec:** Kernel loop, World/Zone state, Actor traits, Social/Economic field (Laravel), Market, Civilization cycle (một phần), Narrative/Memory, Causality, Fork/Timeline, Attractors, Chaos, Cosmic Energy.
2. **Cần bổ sung trong Laravel:** Inequality engine, Legitimacy/elite overproduction chi tiết. (Đã có: Information propagation info_type + institutional amplification, Innovation rate formula, War stages, Demographic transition, Infrastructure state, Trade flow + hub_scores, Psychology mental_state/perception/biases, Social graph trust/loyalty/rivalry.)
3. **Cần bổ sung trong Rust:** SoA đầy đủ cho actors, ZoneActorIndex, CSR graph (nếu scale lớn), engine manifest versioning.
4. **Hạ tầng / research:** Kafka event stream, NATS, Distributed sharding. **Calibration Có** (suggestAdjustments, calibration-check). Self-improving loop, Civilization Discovery stub. **Observability:** Prometheus **Có**, replay CLI **Có**, Jaeger stub **Có** (SimulationTracer::span).

Cập nhật lần cuối: theo codebase và WORLDOS_ARCHITECTURE.md hiện tại.
