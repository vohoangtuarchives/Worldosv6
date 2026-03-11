# WorldOS — Kiến Trúc Toàn Diện

> **Tài liệu thiết kế hệ thống mô phỏng nền văn minh (Civilization Simulation Platform)**
> Stack: Rust (Simulation Kernel) · Laravel (Orchestration) · Next.js (Visualization) · Apache Kafka (Event Streaming)

---

## Mục Lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Giao thức giao tiếp](#2-giao-thức-giao-tiếp)
3. [Simulation Kernel Architecture (Rust)](#3-simulation-kernel-architecture-rust)
4. [World Model Representation](#4-world-model-representation)
5. [Actor Cognition System (17 Traits)](#5-actor-cognition-system-17-traits)
6. [Social Field Engine](#6-social-field-engine)
7. [Economic Field Engine](#7-economic-field-engine)
8. [Information Propagation Engine](#8-information-propagation-engine)
9. [Innovation & Technology Engine](#9-innovation--technology-engine)
10. [Religion & Ideology Engine](#10-religion--ideology-engine)
11. [Great Person Engine](#11-great-person-engine)
12. [Geopolitics & War Engine](#12-geopolitics--war-engine)
13. [Demographic & Population Engine](#13-demographic--population-engine)
14. [Climate & Environment Engine](#14-climate--environment-engine)
15. [Infrastructure & Urban Development Engine](#15-infrastructure--urban-development-engine)
16. [Global Trade & Economic Network Engine](#16-global-trade--economic-network-engine)
17. [Civilization Cycle Engine](#17-civilization-cycle-engine)
18. [Narrative & Historical Memory Engine](#18-narrative--historical-memory-engine)
19. [Causality Graph Engine](#19-causality-graph-engine)
20. [Emergence Detection Engine](#20-emergence-detection-engine)
21. [Psychology & Consciousness Engine](#21-psychology--consciousness-engine)
22. [AI-Driven Agents](#22-ai-driven-agents)
23. [Simulation Execution Model](#23-simulation-execution-model)
24. [Memory Layout & Performance Architecture](#24-memory-layout--performance-architecture)
25. [Engine Dependency Graph](#25-engine-dependency-graph)
26. [Engine Plugin & Versioning Architecture](#26-engine-plugin--versioning-architecture)
27. [Time & Timeline Architecture](#27-time--timeline-architecture)
28. [Distributed Simulation Architecture](#28-distributed-simulation-architecture)
29. [AI Research Layer](#29-ai-research-layer)
30. [Self-Improving Simulation Architecture](#30-self-improving-simulation-architecture)
31. [Observability & Debugging Architecture](#31-observability--debugging-architecture)
32. [Stability & Chaos Control Engine](#32-stability--chaos-control-engine)
33. [Reality Calibration System](#33-reality-calibration-system)
34. [Physics of Civilization Engine](#34-physics-of-civilization-engine)
35. [Multiverse Simulation System](#35-multiverse-simulation-system)
36. [Civilization Discovery Engine](#36-civilization-discovery-engine)
37. [WorldOS Ultimate Architecture Map (80+ Engines)](#37-worldos-ultimate-architecture-map-80-engines)
38. [Minimal Viable Kernel — Lộ trình triển khai](#38-minimal-viable-kernel--lộ-trình-triển-khai)

---

## 1. Tổng quan hệ thống

WorldOS là một **Computational Civilization Science Platform** — không chỉ là game simulation mà là digital laboratory nghiên cứu nền văn minh loài người.

### Mục tiêu cốt lõi
- Mô phỏng 100k–1M actors
- Deterministic & replayable simulation
- Toàn bộ physics + state transition trong Rust
- Laravel chỉ orchestration, persistence, AI/Narrative
- Emergent history — lịch sử tự xuất hiện, không hardcode

### Stack tổng thể

```
Next.js UI
     │
Laravel (Control + Persistence)
     │
   gRPC
     │
Rust Simulation Kernel
     │
Apache Kafka (Event Stream)
     │
Other Engines / AI / Narrative
```

### Phân chia trách nhiệm

| Layer | Công nghệ | Nhiệm vụ |
|---|---|---|
| Frontend | Next.js | Visualization, UI |
| Control Plane | Laravel | Orchestration, API, Auth, AI Narrative |
| Simulation Core | Rust | Physics, State Transition, Actor System |
| Event Bus | Apache Kafka | Event Streaming, History Log |
| Database | PostgreSQL | Snapshot, History, Metrics |

---

## 2. Giao thức giao tiếp

### So sánh giao thức

| Protocol | Latency | Reliability | Use case |
|---|---|---|---|
| JSON over HTTP | ~5–20ms | Thấp | Public API, Frontend ↔ Backend |
| gRPC (HTTP/2 + Protobuf) | ~1–5ms | Cao | Service ↔ Service, Laravel → Rust |
| Apache Kafka | ~10–50ms | Rất cao | Event streaming, History log |
| NATS | < 1ms | Cao (JetStream) | Realtime control, Scheduler → Engine |
| NATS JetStream | ~1–10ms | Cao | Realtime + Durability |

### Kiến trúc giao tiếp được khuyến nghị

```
Laravel → Rust          : gRPC         (Sync control)
Rust → System events    : Apache Kafka (Async event log)
Scheduler → Engine      : NATS         (Realtime control)
Laravel → Frontend      : WebSocket    (Realtime state)
```

### Các lệnh gRPC từ Laravel → Rust

```protobuf
// Control commands
StartSimulation
PauseSimulation
InjectEvent
ChangeParameter
ForkTimeline

// Query commands
GetSnapshot
GetMetrics
GetActorState
```

### Sự kiện Rust → Kafka

```
world.events
population.events
history.events
war.events
```

---

## 3. Simulation Kernel Architecture (Rust)

### Crate Layout

```
worldos/
├── worldos-kernel      # Main simulation runtime
├── worldos-world       # World state structures
├── worldos-actors      # Actor ECS system
├── worldos-engines     # Simulation engine plugins
├── worldos-events      # Event definitions
├── worldos-scheduler   # Execution model
├── worldos-graph       # World graph
├── worldos-snapshot    # Snapshot & replay
├── worldos-io          # API / messaging bridge
└── worldos-cli         # Developer tool
```

### Kernel Core Loop

```rust
loop {
    process_commands();
    simulate_tick(&mut world);
    publish_events();
    if snapshot_due() {
        save_snapshot();
    }
}
```

### Tick Pipeline (thứ tự thực thi)

```
1. geography_update()
2. climate_update()
3. population_dynamics()
4. actor_decisions()
5. social_field_propagation()
6. macro_dynamics()
7. cascade_events()
8. event_emission()
```

### World State Struct

```rust
struct WorldState {
    actors: ActorStore,
    institutions: InstitutionStore,
    zones: ZoneStore,
    social_fields: SocialFieldStore,
    attractors: AttractorField,
    rng: DeterministicRng,
    tick: u64,
}
```

---

## 4. World Model Representation

### Nguyên tắc: Data-Oriented Design (không phải OOP)

**Sai (AoS — Array of Structs):**
```rust
// Cache miss nặng ở scale lớn
struct Actor {
    traits: Traits,
    wealth: f32,
    location: ZoneId,
}
Vec<Actor>
```

**Đúng (SoA — Structure of Arrays):**
```rust
// Cache-friendly, SIMD-friendly
struct ActorStorage {
    traits: Vec<[f32; 17]>,  // 17 traits per actor
    wealth: Vec<f32>,
    location: Vec<ZoneId>,
    health: Vec<f32>,
    influence: Vec<f32>,
}
```

### Spatial Representation

World map dùng **Grid System**:

```rust
// 4096 × 4096 tiles
struct Tile {
    elevation: f32,
    temperature: f32,
    rainfall: f32,
    biome: BiomeType,
}

// Tiles group thành zones
struct Zone {
    id: ZoneId,
    population: u32,
    wealth: f32,
    food_supply: f32,
    infrastructure: f32,
}
```

### World Graph Layers

WorldOS dùng **Multi-Layer Graph**:

| Layer | Nodes | Edges |
|---|---|---|
| Physical | zones, rivers, cities | adjacency, distance, routes |
| Population | actors, families | kinship, friendship, authority |
| Economic | cities, markets, ports | trade routes, supply chains |
| Knowledge | ideas, theories, tech | influences, derives_from |
| Social | actors, institutions | membership, loyalty, conflict |
| Political | states, leaders, armies | war, treaty, vassalage |

### Hot vs Cold State

```
Hot State  → Active zones, active agents (RAM)
Warm State → Cities, institutions (PostgreSQL)
Cold State → Historical archive (Object Storage)
```

### Memory Budget (100k actors)

| Data | Per Actor | Total (100k) |
|---|---|---|
| Traits (17 × f32) | 68 bytes | ~6.8 MB |
| Wealth, location, health | 12 bytes | ~1.2 MB |
| Edges (social graph) | ~500 bytes avg | ~50 MB |
| Zone state (4096 zones) | — | ~5 MB |
| **Tổng ước tính** | | **~100–200 MB** |

---

## 5. Actor Cognition System (17 Traits)

### Trait Vector

```rust
// Mỗi giá trị: 0.0 (không có) → 1.0 (cực mạnh)
struct ActorTraits {
    dom: f32,  // Dominance
    amb: f32,  // Ambition
    coe: f32,  // Cooperation
    loy: f32,  // Loyalty
    emp: f32,  // Empathy
    sol: f32,  // Solitude
    con: f32,  // Conformity
    pra: f32,  // Pragmatism
    cur: f32,  // Curiosity
    dog: f32,  // Dogmatism
    rsk: f32,  // Risk tolerance
    fer: f32,  // Ferocity
    ven: f32,  // Vengeance
    hop: f32,  // Hope
    grf: f32,  // Grief
    pri: f32,  // Pride
    shm: f32,  // Shame
}
```

### Ví dụ profile actor (Napoleon-like)

```
dom: 0.90, amb: 0.95, rsk: 0.80, pri: 0.90, emp: 0.20
```

### Pipeline nhận thức mỗi tick

```
Perception → Belief Update → Goal Selection → Decision → Action
```

### Motivation Engine

```rust
// Từ traits + perception → internal drives
power_drive    = dom * 0.7 + amb * 0.6 + authority_pressure * 0.4
security_drive = fear_field + (1.0 - rsk) + loyalty_pressure
wealth_drive   = pra * 0.6 + amb * 0.4
```

### Decision Utility

```rust
// Actor chọn action có utility cao nhất
utility(revolt) =
    power_drive * 0.6
  + ven * 0.5
  - fear_field * 0.4
  - loy * 0.6

// Dùng argmax hoặc softmax để tạo randomness
chosen_action = argmax(utility(actions))
```

### Action types

```
work | trade | migrate | join_religion | revolt | join_army | follow_leader | start_movement
```

### Archetype Classifier

```
if dom > 0.8 && amb > 0.8  → Conqueror
if cur > 0.8 && pra > 0.6  → Scholar
if dom > 0.8 && emp > 0.7  → Leader
if cur > 0.8 && dog < 0.3  → Reformer
```

---

## 6. Social Field Engine

### Khái niệm

Social Field là "physics của xã hội" — các đại lượng lan truyền trong xã hội và tác động lên actor behavior.

```rust
struct SocialFieldStore {
    fear: Field,
    ideology: Field,
    wealth: Field,
    stability: Field,
    information: Field,
    authority: Field,
}

struct Field {
    values: Vec<f32>,  // Index = ZoneId
}
```

### Field Sources (nguồn sinh field)

- **Actors**: rich merchants → wealth field; religious leader → ideology field
- **Events**: war → fear spike; victory → pride spike
- **Institutions**: church → religion field; state → authority field

### Field Propagation

```
Diffusion:    dF/dt = diffusion_rate * laplacian(F)
Decay:        F(t+1) = F(t) * decay_rate
Interaction:  stability = wealth * 0.5 - fear * 0.6 + authority * 0.4
```

### Update Pipeline (mỗi tick)

```rust
fn update_social_fields(world: &mut WorldState) {
    emit_actor_fields(world);
    emit_institution_fields(world);
    inject_event_shocks(world);
    diffuse_fields(world);
    decay_fields(world);
    resolve_field_interactions(world);
}
```

### Emergent Effects

| Trigger | Cascade |
|---|---|
| Riot → fear spike | → migration → economic collapse |
| Prophet actor | → ideology field → conversions → religion network |
| Trade hubs | → wealth field concentration → population attractor |

---

## 7. Economic Field Engine

### Zone Economy State

```rust
struct ZoneEconomy {
    population: f32,
    food_production: f32,
    resource_production: f32,
    storage_food: f32,
    storage_goods: f32,
    wealth: f32,
    trade_attractiveness: f32,
}
```

### Resource Types (4 nhóm lớn)

```rust
struct Resources {
    food: f32,
    raw: f32,    // Raw materials
    goods: f32,  // Manufactured goods
    luxury: f32,
}
```

### Production Model

```
food_production = population × farm_efficiency × climate_factor
```

### Price Mechanism

```
price = demand / supply
trade_flow = (zoneA_price - zoneB_price) × trade_route_capacity
```

### Inequality Dynamics

```
elite_share    = wealth × inequality_factor
unrest_risk    ∝ inequality
revolt_trigger = inequality > 0.75 && legitimacy < 0.3
```

### Economic Engine Pipeline

```rust
fn update_economy(world: &mut WorldState) {
    production::update(world);
    consumption::update(world);
    trade::update(world);
    price::update(world);
    wealth::update(world);
    inequality::update(world);
    urban_growth::update(world);
}
```

---

## 8. Information Propagation Engine

### Information Object

```rust
struct InfoUnit {
    id: InfoId,
    info_type: InfoType,  // rumor | propaganda | science | religion | meme
    strength: f32,
    novelty: f32,
    credibility: f32,
    emotional_intensity: f32,
}
```

### Transmission Probability

```
P(spread) = trust × info_strength × novelty
```

### Actor Info State

```rust
struct ActorInfoState {
    known_info: Vec<InfoId>,
    belief_strength: Vec<f32>,
}
```

### Diffusion Model (epidemic-based)

```
State transition: Unaware → Aware → Believer → Propagator
adoption_score = curiosity + peer_influence - dogmatism
```

### Institutional Amplification

```
church   → religion field × church_power
state    → propaganda × state_reach
academy  → scientific ideas × education_level
```

### Pipeline mỗi tick

```rust
fn update_information(world: &mut WorldState) {
    innovation::generate(world);
    communication::spread(world);
    mutation::apply(world);
    institutions::amplify(world);
    cascade::detect(world);
}
```

---

## 9. Innovation & Technology Engine

### Knowledge Graph

```rust
struct KnowledgeNode {
    id: KnowledgeId,
    domain: KnowledgeDomain,  // math | physics | engineering | medicine | philosophy
    complexity: f32,
    prerequisites: Vec<KnowledgeId>,
}
```

### Ví dụ dependency chain

```
arithmetic → algebra → calculus → physics → engineering
```

### Innovation Rate Formula

```
innovation_rate =
    knowledge_stock
  × curiosity_density
  × economic_surplus
  × institution_strength
```

### Research Actor Profile

```
curiosity > 0.85 && discipline > 0.75  →  candidate researcher
```

### Technology Level

```
primitive → agricultural → industrial → modern → digital
```

---

## 10. Religion & Ideology Engine

### Ideology Struct

```rust
struct Ideology {
    id: IdeologyId,
    doctrine_strength: f32,
    adaptability: f32,
    institutional_support: f32,
    emotional_resonance: f32,
}
```

### Emergence Triggers

```
high social inequality     → revolutionary ideology
political instability      → new political doctrine
cultural crisis            → new belief system
technological change       → philosophical movement
```

### Conversion Probability

```
conversion =
    ideology_resonance
  × peer_pressure
  × dissatisfaction_with_current_system
```

### Ideology Lifecycle

```
Emergence → Growth → Institutionalization → Dominance → Fragmentation → Decline
```

---

## 11. Great Person Engine

### Emergence Conditions (cần cả 3)

1. **Exceptional traits**: `ambition > 0.9 && risk > 0.8 && charisma > 0.85`
2. **Historical opportunity**: world đang collapse, revolution, frontier expansion
3. **Structural position**: military officer, political elite, scientist, prophet

### Archetype

```rust
enum Archetype {
    Conqueror, Reformer, Prophet, Scientist, Philosopher, Tyrant, Visionary,
}
```

### Influence Model

```rust
struct InfluenceField {
    radius: f32,
    strength: f32,
    decay: f32,
}
```

### Legacy System

```rust
struct Legacy {
    ideology_strength: f32,
    institution_strength: f32,
    cultural_memory: f32,
}
```

---

## 12. Geopolitics & War Engine

### Polity Power Vector

```rust
struct PolityPower {
    military_strength: f32,
    economic_strength: f32,
    technological_level: f32,
    political_stability: f32,
    legitimacy: f32,
}
total_power = military*0.4 + economic*0.3 + tech*0.2 + stability*0.1
```

### War Trigger Formula

```
war_probability =
    territorial_tension
  + resource_competition
  + ideology_hostility
  - diplomatic_relations
```

### Military Model

```rust
struct Army {
    soldiers: u32,
    training: f32,
    technology: f32,
    morale: f32,
}
combat_power = soldiers × training × technology × morale
```

### War Stages

```
Mobilization → Campaign → Battles → Attrition → Negotiation
```

---

## 13. Demographic & Population Engine

### Population State

```rust
struct PopulationState {
    total: u64,
    age_distribution: AgeDistribution,
    urban_ratio: f32,
    literacy_rate: f32,
    health_index: f32,
}
```

### Demographic Equations

```
birth_rate = fertility_base × economic_stability × cultural_factor × health_index
death_rate = base_mortality - healthcare_quality + war_casualties + disease_risk
urban_growth = economic_opportunity × infrastructure_level
```

### Demographic Transition Stages

```
Stage 1: high birth + high death
Stage 2: high birth + lower death   (early development)
Stage 3: lower birth + low death    (urbanization)
Stage 4: aging society              (post-industrial)
```

---

## 14. Climate & Environment Engine

### Environment State (per Zone)

```rust
struct EnvironmentState {
    temperature: f32,
    rainfall: f32,
    soil_fertility: f32,
    water_availability: f32,
    vegetation: f32,
}
```

### Agriculture Capacity

```
food_production = soil_fertility × rainfall_factor × farming_technology
```

### Environmental Degradation

```
soil_fertility  -= overuse_rate
vegetation      -= deforestation_rate
```

### Natural Disaster Struct

```rust
struct Disaster {
    disaster_type: DisasterType,
    intensity: f32,
    affected_zones: Vec<ZoneId>,
}
```

### Simulation Pipeline Position

Climate & Environment là **Layer đầu tiên** — chạy trước tất cả engine khác.

---

## 15. Infrastructure & Urban Development Engine

### Settlement Evolution

```
hamlet → village → town → city → metropolis → megacity
```

### Upgrade Condition

```rust
if population > city_threshold && trade_activity > 0.6 {
    upgrade_settlement_level();
}
```

### Infrastructure State

```rust
struct InfrastructureState {
    roads: f32,
    ports: f32,
    water_supply: f32,
    sanitation: f32,
    energy: f32,
}
```

### Urban Stress Model

```
urban_stress = density × inequality
```

---

## 16. Global Trade & Economic Network Engine

### Trade Route Formation

```rust
struct TradeRoute {
    from: ZoneId,
    to: ZoneId,
    capacity: f32,
    transport_cost: f32,
}
// Route exists when: profit > transport_cost
```

### Trade Flow Algorithm

```
flow = route_capacity × supply_factor × demand_factor
```

### Network Effects

```
economic_growth ∝ trade_connectivity
hub_score = connectivity × economic_output
```

### Trade & Cultural Diffusion

Trade routes lan truyền: religions, ideas, technologies, languages.

---

## 17. Civilization Cycle Engine

### Macro State Vector

```rust
struct CivilizationState {
    prosperity: f32,
    cohesion: f32,
    legitimacy: f32,
    inequality: f32,
    elite_competition: f32,
    external_pressure: f32,
}
```

### Civilization Phases

```
Formation → Expansion → Golden Age → Stagnation → Decline → Collapse → Fragmentation → Renewal
```

### Phase Detection Rules

```
Formation:   prosperity↑ && cohesion↑ && elite_competition < 0.3
Golden Age:  prosperity > 0.7 && cohesion > 0.6 && innovation↑
Decline:     prosperity↓ && inequality↑ && elite_competition↑
Collapse:    legitimacy < 0.2 && cohesion < 0.2 && external_pressure > 0.7
```

### Elite Overproduction

```
elite_competition = elite_population / available_elite_positions
// Khi elite_competition > 1.0 → faction formation → civil war risk
```

### Legitimacy Formula

```
legitimacy = prosperity*0.4 + ideology_alignment*0.3 - inequality*0.4
```

---

## 18. Narrative & Historical Memory Engine

### Event Struct

```rust
struct SimulationEvent {
    id: EventId,
    timestamp: u64,
    event_type: EventType,
    actors: Vec<ActorId>,
    location: ZoneId,
    impact: f32,
}
```

### Historical Importance Score

```
importance = impact × affected_population × duration
// importance > threshold → becomes historical_event
```

### Event Clustering (micro → macro)

```
economic_crisis + social_unrest + political_instability
  → [cluster] → "The Great Revolution of Year 1830"
```

### Laravel Integration

```
Rust → Kafka event stream → Laravel → AI Narrative Generator → Civilization Chronicle
```

---

## 19. Causality Graph Engine

### Causal Event Struct

```rust
struct CausalEvent {
    id: EventId,
    causes: Vec<CausalLink>,
    effects: Vec<CausalLink>,
}
struct CausalLink {
    event_id: EventId,
    weight: f32,
}
```

### Cause Types

- `direct_cause` — nguyên nhân trực tiếp
- `contributing_cause` — yếu tố đóng góp
- `trigger` — cò súng kích hoạt
- `background_condition` — điều kiện nền

### Query API (Laravel)

```
GET /events/{id}/causes
GET /events/{id}/effects
GET /events/{id}/causal-chain
```

---

## 20. Emergence Detection Engine

### Archetype Pattern Library

```
Industrialization pattern:
    urbanization↑, capital_accum↑, innovation_cluster↑, transport_density↑
    confidence_threshold: 0.7

Revolution pattern:
    inequality > 0.75, propaganda > 0.60, legitimacy < 0.30
    confidence_threshold: 0.65
```

### Detection Algorithm

```rust
fn detect_emergence(world: &WorldState) -> Vec<EmergenceEvent> {
    let indicators = collect_indicators(world);
    let pattern_scores = score_patterns(&indicators);
    pattern_scores
        .filter(|s| s.confidence > 0.7)
        .map(materialize_event)
        .collect()
}
```

### Pipeline Position

```
Simulation Engines (Economy, Population, War, ...)
                   ↓
       Emergence Detection Engine
                   ↓
          Narrative Engine
```

---

## 21. Psychology & Consciousness Engine

### Mental State

```rust
struct MentalState {
    beliefs: BeliefVector,
    goals: GoalVector,
    emotions: EmotionVector,
    perception: PerceptionState,
}
struct EmotionVector {
    fear: f32, anger: f32, hope: f32, pride: f32,
}
struct GoalVector {
    survival: f32, wealth: f32, power: f32, status: f32, ideology: f32,
}
```

### Perception ≠ Reality

```rust
struct PerceptionState {
    known_entities: Vec<EntityId>,
    information_accuracy: f32,
    rumors: Vec<InformationFragment>,
}
```

### Cognitive Biases

Confirmation bias, Loss aversion, Status quo bias, Authority bias.

### Collective Behavior Emergence

```
economic_hardship → anger↑ → mass_protest → revolution
fear + shared_enemy → cohesion↑ → nationalism
```

---

## 22. AI-Driven Agents

### Agent Core Model

```rust
struct Agent {
    id: ActorId,
    memory: MemoryState,
    beliefs: BeliefModel,
    goals: GoalModel,
    planner: Planner,
}
```

### Agent Cycle (mỗi tick)

```
observe_world → update_beliefs → evaluate_goals → plan_actions → execute
```

### Agent Hierarchy

```
Individual agents     (actors)
Family agents         (household decisions)
Institution agents    (empire, church, corporation)
Civilization agents   (macro strategy)
```

### Social Interaction

```rust
struct SocialGraph {
    trust: HashMap<(ActorId, ActorId), f32>,
    loyalty: HashMap<(ActorId, ActorId), f32>,
    rivalry: HashMap<(ActorId, ActorId), f32>,
}
```

### Computational Scaling

```
10M population → 100k active agents
(90% background population — aggregate model)
```

---

## 23. Simulation Execution Model

### Hybrid Model (khuyến nghị)

```
Simulation Tick
      ↓
Zone Updates (parallel)
      ↓
Event Generation
      ↓
Event Queue Processing
      ↓
Snapshot (if needed)
```

### Multi-Scale Time

| Engine | Time Scale |
|---|---|
| Climate | Yearly |
| Population | Monthly |
| Economy | Weekly/Monthly |
| Actors | Daily |
| War | Hourly |

### Actor Activation Model

```
Active actors:  leaders, scientists, generals, rebels (vài nghìn)
Passive:        background population (aggregate model)
```

### Time Compression

```
Peace time  → 1 tick = 1 year   (fast forward)
War time    → 1 tick = 1 day    (slow motion)
```

### Parallel Execution

```rust
zones.par_iter_mut().for_each(|zone| update_zone(zone));
actors.par_iter_mut().for_each(|actor| update_actor(actor));
```

---

## 24. Memory Layout & Performance Architecture

### ECS + SoA Pattern

```rust
struct ActorStorage {
    ids:       Vec<ActorId>,
    traits:    Vec<[f32; 17]>,
    wealth:    Vec<f32>,
    location:  Vec<ZoneId>,
    health:    Vec<f32>,
    influence: Vec<f32>,
    age:       Vec<u16>,
}
```

### Spatial Index

```rust
struct ZoneActorIndex {
    zone_to_actors: Vec<Vec<ActorId>>,
}
```

### Graph Storage (CSR Format)

```rust
struct SocialGraph {
    offsets: Vec<usize>,
    edges:   Vec<ActorId>,
    weights: Vec<f32>,
}
```

### Performance Target

```
100k actors, 4096 zones, 1M edges
Tick time target: 5–20ms
Throughput:       50–200 ticks/second
```

---

## 25. Engine Dependency Graph

### Layer Dependencies (DAG)

```
Layer 1: Physical World          (no dependencies)
Layer 2: Environment & Resources
Layer 3: Population & Demography
Layer 4: Individual Behavior
Layer 5: Information & Social
Layer 6: Economy & Infrastructure
Layer 7: Politics & Civilization
Layer 8: Meta Systems (Causality, Emergence, Narrative, Timeline)
```

### Engine Communication Rule

```
Engines KHÔNG gọi trực tiếp nhau.
Engine → emit event → event queue → other engines
```

### Preventing Feedback Loops

```
Rule: Engines chỉ READ world state trong tick
      Engines EMIT events
      Events được APPLY sau tick hoàn thành
```

---

## 26. Engine Plugin & Versioning Architecture

### Engine Trait (Rust)

```rust
trait Engine {
    fn name(&self) -> &'static str;
    fn version(&self) -> EngineVersion;
    fn dependencies(&self) -> Vec<EngineDependency>;
    fn tick(&mut self, ctx: &mut EngineContext);
}
```

### Engine Manifest (per Universe)

```json
{
  "universe_id": "uni_102",
  "engine_versions": {
    "economy": "2.1",
    "population": "1.4",
    "war": "1.1",
    "climate": "0.8"
  },
  "seed": 9128731
}
```

Universe phải pin engine versions để đảm bảo deterministic replay.

---

## 27. Time & Timeline Architecture

### Universe Struct

```rust
struct Universe {
    id: UniverseId,
    parent: Option<UniverseId>,
    fork_tick: u64,
    engine_manifest: EngineManifest,
    seed: u64,
}
```

### Timeline Branching

```
Root Universe (seed: 9128731)
    ├── Branch A: "No Roman Empire"
    └── Branch B: "Global theocracy"
```

### Deterministic Replay

```
same_seed + same_engine_versions + same_events = same_history
```

### Snapshot Interval

```
snapshot every 100 ticks
Snapshot includes: world_state, engine_states, event_queue, rng_state
```

---

## 28. Distributed Simulation Architecture

### Spatial Partition Strategy

```
World Map (4096×4096)
    ↓ chia thành
64 Shards → Cluster Nodes
```

### Cross-Shard Interaction

```rust
struct MigrationEvent {
    from_shard: ShardId,
    to_shard: ShardId,
    population: u32,
    cultural_group: CultureId,
}
```

### Border Zone (Ghost Zones)

Shard A có ghost copy của neighbor zones trong Shard B → tránh network round-trip.

### Scaling Capacity

| Cluster Size | Actor Capacity |
|---|---|
| 1 machine | ~100k actors |
| 10 machines | ~1M actors |
| 100 machines | ~10M actors |

---

## 29. AI Research Layer

### Simulation Data Lake Schema

```sql
simulation_runs       (id, universe_id, start_tick, end_tick, parameters)
simulation_events     (id, run_id, tick, event_type, location, payload)
civilization_metrics  (id, run_id, tick, gdp, population, stability, ...)
actor_decisions       (id, run_id, tick, actor_id, action, context)
war_outcomes          (id, run_id, war_id, winner, duration, casualties)
innovations           (id, run_id, tick, technology, civilization_id)
```

### Feature Extraction

```python
features = [
    gdp_growth_rate,
    inequality_gini,
    urbanization_ratio,
    literacy_rate,
    war_frequency_50yr,
    innovation_rate_100yr,
    ideology_polarization,
    elite_competition_index,
]
```

### Policy Simulation

```
Laravel API: POST /ai/policy-simulation
→ Fork timeline → run 1000 ticks → return outcome distribution
```

---

## 30. Self-Improving Simulation Architecture

### Closed Learning Loop

```
Simulation → Historical Data → AI Analysis
→ Rule Proposal → Sandbox Test → Evaluation → Deploy
```

### Rule Evolution Example

**Rule v1:** `innovation_rate = curiosity × education`

**AI proposes v2:** thêm `information_flow`, `trade_connectivity_bonus`.

**Evaluation:** historical_plausibility, simulation_diversity → Deploy v2.

### Laravel Role

```php
SimulationJob::dispatch($universe_id);
AIAnalysisJob::dispatch($run_id);
RuleProposalJob::dispatch($pattern_id);
SandboxTestJob::dispatch($proposed_rule);
```

---

## 31. Observability & Debugging Architecture

### Ba trụ cột

```
Simulation Kernel
      ├── Metrics   → Prometheus
      ├── Traces    → Jaeger
      └── Events    → Event Explorer UI
```

### Simulation Metrics (ví dụ)

```
population_total
gdp_global
war_count_active
innovation_rate
ideology_diversity
tick_duration_ms
event_queue_depth
```

### Causality Explorer UI

```
Click sự kiện "Revolution Year 1830"
→ Hiện causal chain: Revolution ↑ food_shortage ↑ climate_drought ↑ inequality
```

### Simulation Replay

```
worldos-inspector replay --universe uni_102 --from-tick 1800 --to-tick 1830
```

---

## 32. Stability & Chaos Control Engine

### Chaos Score

```
chaos_score =
    population_variance * 0.2
  + economic_volatility * 0.3
  + conflict_frequency * 0.3
  + resource_shock * 0.2
// chaos_score > 0.8 → kích hoạt stability control
```

### Stability Mechanisms

1. **Dampening:** `inflation_rate = raw_inflation × stability_factor`
2. **Event Throttling:** `if war_count > threshold: war_probability *= 0.5`
3. **Biological Feedback:** `population↑ → food_scarcity↑ → birth_rate↓`
4. **Chaos Quarantine:** zone quá bất ổn → giảm influence lan sang zones khác

---

## 33. Reality Calibration System

### Historical Reference Data

```sql
INSERT INTO calibration_benchmarks VALUES
('empire_lifespan_mean_years', 250),
('war_frequency_per_century', 3.0),
('industrial_revolution_tick', 1760),
('population_1800_million', 1000);
```

### Auto-Calibration Loop

```
1. run simulation (1000 ticks)
2. measure metrics
3. compare with historical benchmarks
4. adjust parameters (±10% per iteration)
5. repeat
```

---

## 34. Physics of Civilization Engine

### Civilization Energy Model

```
E = resources + trade_volume + knowledge + infrastructure
// E < survival_threshold → collapse_risk↑
```

### Social Entropy

```
entropy_rate =
    corruption + inequality + institutional_decay + bureaucratic_overhead
// entropy > threshold → collapse_probability↑
```

### Civilization Attractors

```
stable_empire
trade_federation
city_state_network
religious_theocracy
military_junta
```

### Phase Transition Detection

```
tribal → agrarian:     agriculture_tech > threshold && settlement_density > threshold
agrarian → industrial: capital_accumulation > threshold && energy_tech > threshold
```

---

## 35. Multiverse Simulation System

### Universe Seed Structure

```rust
struct UniverseSeed {
    geography: GeographySeed,
    climate: ClimateSeed,
    resources: ResourceSeed,
    initial_population: u64,
    innovation_probability: f32,
    rng_master: u64,
}
```

### Parallel Universe Cluster

```
Cluster Job Queue
    ├── Universe 0001 (seed: 1827312)
    ├── Universe 0002 (seed: 9182731)
    └── ...
Result Aggregator → Store metrics per universe → Cross-universe analysis
```

### Use Cases

- What-if experiments ("What if Rome never fell?")
- Parameter sensitivity analysis
- Discovery of stable civilization configurations
- AI training data generation

---

## 36. Civilization Discovery Engine

### Civilization Genome

```rust
struct CivilizationGenome {
    governance_model: GovernanceType,
    economic_model: EconomicType,
    belief_system: BeliefType,
    innovation_structure: InnovationModel,
    social_structure: SocialModel,
}
```

### Evolutionary Search

```
Generation 0: Random genomes
   ↓ simulate 1000 ticks
   ↓ evaluate fitness
   ↓ select top performers
   ↓ mutation + crossover
Generation N: Optimized genomes
```

### Fitness Evaluation

```
fitness =
    lifespan_years      * 0.3
  + innovation_rate     * 0.2
  + population_peak      * 0.2
  + stability_score      * 0.2
  + cultural_richness   * 0.1
```

---

## 37. WorldOS Ultimate Architecture Map (80+ Engines)

### Layer 1 — Physical World (Rust)

Planetary Physics, Geology & Tectonic, Climate & Atmosphere, Ocean & Hydrology, Ecosystem & Biodiversity, Resource Distribution, Natural Disaster, Agriculture & Food System.

### Layer 2 — Population & Biology (Rust)

Population Dynamics, Demography, Migration, Health & Disease.

### Layer 3 — Individual Mind (Rust)

Psychology, Emotion, Decision, Memory & Learning, Social Interaction.

### Layer 4 — Information & Knowledge (Rust)

Information Propagation, Knowledge & Technology Evolution, Education & Scholarship, Media & Communication.

### Layer 5 — Economy (Rust)

Production & Industry, Global Trade Network, Market & Price Dynamics, Finance & Banking, Infrastructure & Urban Development.

### Layer 6 — Social Structure (Rust)

Culture & Norm Emergence, Religion & Belief Systems, Institution Formation, Class & Inequality.

### Layer 7 — Political & Power (Rust)

Governance, Diplomacy, War & Conflict, Empire Dynamics.

### Layer 8 — Civilization Dynamics (Rust)

Innovation & Scientific Revolution, Civilization Cycle.

### Layer 9 — Meta Simulation (Rust)

Causality, Emergence Detection, Narrative & Historical Memory, Timeline Fork / Multiverse, Stability & Chaos Control, Reality Calibration.

### Layer 10 — Core Infrastructure (Rust)

Simulation Scheduler, World State Model, Event Streaming, AI Agent System, Spatial Partition.

### Layer 11 — Research & Discovery (Laravel + Python)

Multiverse Simulation, Civilization Discovery, Physics of Civilization, Self-Improving Architecture.

### Layer 12 — AI Research (Python/ML)

Pattern Discovery, Causal Analysis, Rule Evolution, Simulation Optimization.

### Layer 13 — Observability (DevOps)

Metrics (Prometheus), Traces (Jaeger), Event Inspector, Simulation Replay.

---

## 38. Minimal Viable Kernel — Lộ trình triển khai

Không thể build 80 engines ngay. Đây là **12 engines cốt lõi** để bắt đầu:

### Phase 1 — Core Foundation (3–6 tháng)

```
Priority engines:
1. World State Model (zones, actors, SoA memory)
2. Climate & Environment Engine (basic)
3. Population Engine (birth, death, migration)
4. Economic Field Engine (production, consumption, trade)
5. Simulation Scheduler (hybrid tick + event)
6. Event System (Kafka integration)
```

### Phase 2 — Society Layer (6–12 tháng)

```
7. Actor Cognition Engine (17 traits, decision model)
8. Social Field Engine (fear, ideology, wealth fields)
9. Information Propagation Engine
10. War & Conflict Engine (basic)
```

### Phase 3 — Civilization Layer (12–18 tháng)

```
11. Civilization Cycle Engine
12. Narrative Engine (basic event logging)
```

### Phase 4 — Research Platform (18+ tháng)

```
13. Causality Graph Engine
14. Emergence Detection Engine
15. AI Research Layer
16. Self-Improving Architecture
17. Multiverse Simulation System
```

### Laravel Control Endpoints (Phase 1)

```php
POST   /api/universes                  // Tạo universe mới
POST   /api/universes/{id}/start       // Bắt đầu simulation
POST   /api/universes/{id}/pause       // Dừng simulation
POST   /api/universes/{id}/fork        // Fork timeline
GET    /api/universes/{id}/snapshot    // Lấy world state
GET    /api/universes/{id}/events      // Lấy event history
POST   /api/universes/{id}/inject      // Inject custom event
```

---

## Tóm tắt kiến trúc tổng thể

```
┌─────────────────────────────────────────────────┐
│                  Next.js Frontend               │
│        (World Map, Timeline, Civilization UI)   │
└──────────────────────┬──────────────────────────┘
                       │ WebSocket / REST
┌──────────────────────▼──────────────────────────┐
│              Laravel Control Plane              │
│    (Orchestration, Persistence, AI Narrative)   │
└──────┬───────────────────────────────┬──────────┘
       │ gRPC                          │ Kafka consume
┌──────▼──────────┐          ┌─────────▼──────────┐
│  Rust Simulation│          │   AI Research Layer │
│     Kernel      │          │  (Pattern, Rules)   │
│  (40+ Engines)  │          └────────────────────┘
└──────┬──────────┘
       │ Kafka publish
┌──────▼──────────────────────────────────────────┐
│            Apache Kafka Event Stream            │
│         (war, migration, innovation, ...)       │
└─────────────────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────┐
│          Distributed Simulation Cluster         │
│     (Multiple Rust nodes, spatial sharding)     │
└─────────────────────────────────────────────────┘
       │
┌──────▼──────────────────────────────────────────┐
│                  PostgreSQL                     │
│    (Snapshots, Events, Metrics, Timelines)      │
└─────────────────────────────────────────────────┘
```

---

*WorldOS — từ simulation engine đến Computational Civilization Science Platform*

*"Simulate history. Explore alternatives. Discover new civilizations."*
