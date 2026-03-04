# Civilization Dynamics Engine — Master Plan
> Tài liệu capture toàn bộ thiết kế từ 2 phiên làm việc. Dùng để resume công việc.

---

## Tóm tắt tất cả Quyết định Thiết kế

| Câu hỏi | Quyết định |
|---|---|
| Archetype = label hay emergent? | **Emergent** — phân loại từ TraitVector + BehaviorStats |
| Archetype ảnh hưởng gì? | **B + C** — decision tree + reshape world dynamics |
| Bounded strategy | **Emergent self-balancing** (soft, không clamp cứng) |
| Bifurcation level | **B+C** — macro phase + micro actor cognitive |
| Storage | **PostgreSQL JSONB** (→ binary blob khi > 10k actors) |
| Randomness | **Stochastic nhưng bounded** (logistic damping, saturation) |
| Simulation type | **B — Deterministic scientific simulation** |
| Parallel strategy | **C — Deterministic + có thể scale parallel** |
| Scale target | **C — 100k+ actors** |
| Compute engine | **A — Rust gRPC microservice** (đã dùng) |
| Tick architecture | **⚠️ CHƯA QUYẾT ĐỊNH** — xem Resume Checklist |

---

## Trạng thái Hiện tại Codebase

### Đã có ✅
```
app/Modules/Intelligence/
├── Entities/
│   ├── ActorEntity.php          ← 17 TRAIT_DIMENSIONS (Dominance, Ambition, Coercion...)
│   ├── BaseArchetype.php        ← Interface (getName, isEligible, getBaseUtility, applyImpact)
│   └── Archetypes/
│       ├── Archmage, RogueAI, Technocrat, TribalLeader, VillageElder, Warlord
├── Services/
│   ├── ActorEvolutionService.php    ← HARDCODE "Ẩn Sĩ" ← FIX NGAY
│   ├── ActorLifecycleService.php
│   └── AgentDecisionService.php
└── Actions/
    ├── SpawnActorAction.php
    ├── SpawnFromEventsAction.php    ← HARDCODE "Ẩn Sĩ" ← FIX NGAY
    └── EvolveActorsAction.php
```

**Models:**
- [Universe](file:///c:/projects/IPFactory/backend/app/Models/Universe.php#9-74) — `entropy`, `structural_coherence`, `state_vector` (JSONB), belongs to [World](file:///c:/projects/IPFactory/backend/app/Models/World.php#9-38)
- [World](file:///c:/projects/IPFactory/backend/app/Models/World.php#9-38) — `axiom` (JSONB), `base_genre`, `current_genre`, `active_genre_weights`
- [Actor](file:///c:/projects/IPFactory/backend/app/Modules/Intelligence/Entities/ActorEntity.php#5-112) — `traits` (JSONB), `archetype` (string), `metrics` (JSONB)
- `UniverseSnapshot` — `state_vector`, `metrics` (JSONB)

### Chưa có ❌
- `universes.seed` column (critical cho determinism)
- `BehaviorStats` tracking
- `SimulationRng` (DeterministicRNG)
- `EntropyBudget` system
- `SocialField` + `PolarizationCalculator`
- `PhaseDetector` + `PhaseScore`
- `FitnessLandscapeProvider`
- `ArchetypeClassifier` (emergent)
- `MacroPressure` / `MacroStateEvolution`

---

## ⚠️ Lỗi Kiến trúc PHẢI SỬA (trước mọi phase)

> [!CAUTION]
> Các lỗi này làm hệ không thể deterministic. Phải sửa song song với Phase 1.

#### ❌ [ActorEntity](file:///c:/projects/IPFactory/backend/app/Modules/Intelligence/Entities/ActorEntity.php#5-112) gọi [rand()](file:///c:/projects/IPFactory/backend/app/Modules/Simulation/Actions/TransitionEpochAction.php#81-88) trực tiếp
```php
// HIỆN TẠI — SAI
$drift = (rand(-100, 100) / 100.0) * $variance;
```
Entity = pure state container. **Không bao giờ sinh randomness.** Engine inject RNG.

#### ❌ [ActorEntity](file:///c:/projects/IPFactory/backend/app/Modules/Intelligence/Entities/ActorEntity.php#5-112) là mini-engine (vi phạm DDD)
[driftTraits()](file:///c:/projects/IPFactory/backend/app/Modules/Intelligence/Entities/ActorEntity.php#39-51), [processSurvival()](file:///c:/projects/IPFactory/backend/app/Modules/Intelligence/Entities/ActorEntity.php#73-88), [evolveTraits()](file:///c:/projects/IPFactory/backend/app/Modules/Intelligence/Entities/ActorEntity.php#89-101) nằm trong Entity.
→ Phải tách: `ActorState` (data) + `ActorTransitionSystem` (pure functions).

#### ❌ Không có `universe.seed`
Không seed = không replay được. Migration bắt buộc.

#### ❌ `entropy` là decoration, không phải accounting system
Phải thêm: budget, consume, decay.

---

## Kiến trúc Đích (Toàn bộ)

```
SimulationRng (per actor per tick)
EntropyBudget (per actor per tick)
      ↓
ActorTransitionSystem (pure functions, immutable)
  - driftTraits(state, rng, budget)
  - processSurvival(state, env, rng)
  - evolveTraits(state, actions)
      ↓
Actor Layer
  ActorState (17 traits, BehaviorStats, CognitiveState)
  ArchetypeClassifier (emergent, drift inertia)
      ↓
Society Layer
  SocialFieldCalculator    (mean-field O(n))
  PolarizationCalculator   (stddev aggression)
  ReplicatorDistributionUpdater
      ↓
Phase Layer
  PhaseDetector → PhaseScore (primitive/industrial/information/fragmented)
  FitnessLandscapeProvider  (multipliers per archetype per phase)
      ↓
Macro Layer
  MacroPressure (war/knowledge/trade — PHI TUYẾN)
  MacroStateEvolution (logistic damping, NO clamp)
```

**Coupling:** Macro → read snapshot N-1 (delay). Không write Actor trực tiếp.

---

## Build Order

> [!IMPORTANT]
> Phải theo thứ tự. Pass acceptance criteria mỗi phase trước khi build phase tiếp.

### Phase 0: Prerequisites (làm đầu tiên)

**0a. Migration thêm [seed](file:///c:/projects/IPFactory/frontend/src/lib/api.ts#73-76) vào [universes](file:///c:/projects/IPFactory/frontend/src/lib/api.ts#54-61):**
```sql
ALTER TABLE universes ADD COLUMN seed BIGINT DEFAULT 0;
```
Khi tạo Universe: `seed = PHP_INT_MAX * lcg_value()`.

**0b. Implement `SimulationRng`:**
`app/Modules/Intelligence/Domain/Rng/SimulationRng.php`
```php
final class SimulationRng {
    public function __construct(int $universeSeed, int $tick, int $actorId) {
        $this->state = crc32("{$universeSeed}:{$tick}:{$actorId}") | 0xDEADBEEF;
    }
    public function nextFloat(): float { /* SplitMix64 */ }
    public function floatRange(float $min, float $max): float;
}
```

**0c. Implement `EntropyBudget`:**
`app/Modules/Intelligence/Domain/Entropy/EntropyBudget.php`
```php
final class EntropyBudget {
    public function __construct(float $globalEntropy, int $actorCount) {
        $this->remaining = $globalEntropy / max(1, $actorCount);
    }
    public function consume(float $amount): float; // returns actual consumed
    public function remaining(): float;
}
```

**0d. Refactor [ActorEntity](file:///c:/projects/IPFactory/backend/app/Modules/Intelligence/Entities/ActorEntity.php#5-112) → `ActorState` + `ActorTransitionSystem`:**
```
ActorState (immutable VO):           ActorTransitionSystem (pure functions):
  - traits: float[17]                  - driftTraits(state, rng, budget, field) → ActorState
  - metrics: array                     - processSurvival(state, env, rng) → ActorState
  - isAlive: bool                      - evolveTraits(state, actions) → ActorState
  - generation: int
```
Survival logic:
```php
$prob = 1 / (1 + exp(-($resilience * 0.6 + (1 - $entropy) * 0.4)));
return $rng->nextFloat() < $prob; // không còn rand() * 50
```

---

### Phase 1: Fix Hardcode + Conditional Pool

**Mục tiêu:** Thay "Ẩn Sĩ" bằng pool theo `world.axiom`. Quick win.

**1.1 — `ArchetypeResolverService`** (stepping stone):
`app/Modules/Intelligence/Services/ArchetypeResolverService.php`

```
Universal pool (luôn có):
  Chiến Binh/Dũng Sĩ       1.0
  Thương Nhân               1.0
  Học Giả/Hiền Nhân         1.0
  Lãnh Đạo/Thủ Lĩnh         0.8
  Người Thường/Bình Dân     1.5

Conditional (world.axiom):
  has_martial_arts=true  → Kiếm Sĩ/Ẩn Sĩ Võ Lâm  (Kiếm Hiệp)  1.0
  has_linh_ki=true       → Tu Chân Giả             (Tu Chân)    1.2
  has_linh_ki=true       → Tà Tu                   (Tu Ma)      0.5
  has_linh_ki=false
    && has_martial_arts  → Dưỡng Sinh Gia           (Dưỡng Sinh) 0.7
  tech_level >= 3        → Kỹ Sư/Chuyên Gia         (Kỹ Thuật)   1.0
  tech_level >= 5        → Hacker/Tin Tặc           (Siêu CN)    0.6
  has_magic=true         → Pháp Sư                 (Pháp Thuật) 0.8

Weight modifier by state:
  entropy > 0.7   → Tà Tu + Chiến Binh ×2
  entropy < 0.3   → Học Giả + Thương Nhân ×1.5
  stability < 0.4 → Lãnh Đạo ×2
```

**World axiom keys** (set thủ công vào `worlds.axiom`):
```json
{ "has_martial_arts": true, "has_linh_ki": false, "has_magic": false, "tech_level": 2 }
```

**Files sửa:** `ActorEvolutionService::ensureMinimumPopulation()`, `SpawnFromEventsAction::spawnSpontaneousActor()`

**Acceptance:** Không còn "Ẩn Sĩ" hardcode. World có `has_linh_ki: true` → có "Tu Chân Giả".

---

### Phase 2: Social Layer

**2.1 — `SocialField`** VO: `Domain/Society/SocialField.php`
```php
// aggressionField, rationalField, spiritualField, conformityField
```
Mean-field aggregation từ population traits: O(n).

**2.2 — `SocialFieldCalculator`**: maps TRAIT_DIMENSIONS → SocialField.

**2.3 — `PolarizationCalculator`**:
```
polarization_index = stddev(Dominance + Vengeance across actors)
```
Lưu vào `universe_snapshots.metrics.polarization_index`.

**2.4 — `CognitiveDynamicsEngine`**:
```
Δtrait = field_influence * 0.02  ← xã hội kéo
       - trait^2 * 0.05          ← logistic damping
       + rng.noise * 0.01        ← stochastic (dùng SimulationRng!)
```

**Acceptance:** `polarization_index` được ghi mỗi cycle. Traits drift không uniform.

---

### Phase 3: Emergent ArchetypeClassifier

**3.1 — `ArchetypeDefinition`** VO:
```php
final class ArchetypeDefinition {
    string $name;
    string $namePrefix;
    callable $scoreFunction;  // f(ActorState, BehaviorStats) → float
    ?callable $condition;     // f(World.axiom) → bool, null = universal
}
```

**3.2 — `ArchetypeClassifier`**:
```
score = scoreFunction(actor)
      * saturation_penalty(current_ratio)    // replicator dynamics
      * fitness_landscape.multiplier()        // phase modifier

classify only if: delta > 0.25 AND stable_cycles > 5
```

Score functions:
```
Chiến Binh:  0.4*Dominance + 0.3*battles_norm + 0.2*Coercion + 0.1*RiskTolerance
Học Giả:     0.5*Curiosity + 0.3*research_norm + 0.2*Pragmatism
Tu Chân:     0.4*spiritual_ratio + 0.3*Hope + 0.2*(1-Dogmatism) + entropy*0.3
Tà Tu:       0.4*spiritual_ratio + 0.3*Vengeance + 0.2*Dogmatism + 0.1*crime_norm
```

**Acceptance:** 20 actors → ≥4 loại archetype sau 50 cycle. Battle nhiều → drift Chiến Binh.

---

### Phase 4: Phase Landscape

**4.1 — `PhaseScore`** VO: `Domain/Phase/PhaseScore.php`
```php
// primitive, feudal, industrial, information, fragmented (tất cả float 0-1)
```

**4.2 — `PhaseDetector`** (NO if cứng):
```php
$fragmented   = $entropy * $polarization;
$information  = sigmoid($techLevel - 6) * (1 - $entropy) * (1 - $polarization);
$industrial   = sigmoid($techLevel - 3) * (1 - $entropy);
$primitive    = 1 - max($fragmented, $information, $industrial);
```

**4.3 — `FitnessLandscapeProvider`**:
```
warrior_multiplier  = 1 + fragmented*1.5 - information*0.5
scholar_multiplier  = 1 + information*1.2 - fragmented*0.3
merchant_multiplier = 1 + industrial*1.0
```

**Acceptance:** tech=7, entropy=0.3 → information > 0.5. entropy=0.8, polar=0.7 → fragmented > 0.5.

---

### Phase 5: Macro Dynamics

**5.1 — `MacroPressure`** (PHI TUYẾN là quan trọng):
```
warPressure       = warrior_ratio^1.5
knowledgePressure = scholar_ratio * 0.8
tradePressure     = merchant_ratio * 0.7
chaosPressure     = polarization_index * warlord_ratio
```

**5.2 — `MacroStateEvolution`** (logistic damping, NO clamp):
```
entropy     += warPressure * 0.02
entropy     -= entropy * (1 - entropy) * 0.05    // self-damping
entropy     += rng_noise * 0.01

tech_level  += knowledgePressure * (1 - tech_level/10)  // logistic cap
stability   += leadPressure * 0.01 - warPressure * 0.015
```

**Acceptance:** warrior > 50% → entropy tăng. tech_level chậm dần khi gần 10. Không crash sau 500 cycle.

---

### Phase 6: Cycle Orchestration

```
Thứ tự mỗi meta-cycle (KHÔNG đảo):
1. RunMicroCycleAction
   - SocialFieldCalculator → SocialField
   - CognitiveDynamicsEngine.update(actor, field, rng, budget) ∀ actors

2. EvolveActorsAction
   - ActorTransitionSystem.evolveTraits(state, actions)
   - BehaviorStats update

3. UpdateArchetypeAction
   - ArchetypeClassifier.classify(actor) ∀ actors

4. ReplicatorDistributionUpdater
   - compute archetype ratios + saturation

5. PolarizationCalculator → save to snapshot

6. PhaseDetector → PhaseScore → save to snapshot

7. MacroStateEvolution → update Universe.entropy, stability, tech_level
```

**DELAY:** Macro đọc snapshot N-1. Không sync với micro cùng cycle.

---

## Parallel Architecture (cho scale 100k+)

### Partition Strategy
```
partition_id = actor_id % 1024   // CỐ ĐỊNH, không đổi dù thêm worker
```
Worker chỉ claim partition range. Deterministic không phụ thuộc số node.

### Per-Actor RNG (bắt buộc)
```
seed = hash(universe_seed ⊕ tick ⊕ actor_id)
rng  = SplitMix64(seed)
```
Không bao giờ dùng shared global RNG.

### Actor Interaction — 2-phase
```
Phase 1: Actor A emits Intent { target_id: B, delta_traits: [...] }
Phase 2: Reducer sorts by target_id → aggregates → applies
```
Không cho phép Actor A mutate Actor B trực tiếp.

### Snapshot Canonicalization (trước khi hash)
```php
ksort($data);               // sort top-level keys
usort($data['actors'], fn($a, $b) => $a['id'] <=> $b['id']);
$hash = hash('sha256', json_encode($data, JSON_UNESCAPED_UNICODE));
```
PostgreSQL jsonb reorder keys. **Phải canonicalize trong PHP.**

### Tick Architecture (CHƯA CHỌN)
```
A — Synchronous gRPC:  Laravel chờ Rust trả kết quả (đơn giản, dễ debug)
B — Async Queue:       Kafka/Redis Queue (flexible, phức tạp hơn)
C — Continuous Rust:   Rust tự loop, Laravel chỉ observe
```
> **Đo thời gian tick trước khi chọn:**
> < 200ms → C tốt nhất
> Seconds  → B phù hợp hơn

### Hash Validation (determinism checker)
```php
if ($newHash !== $expectedHash) {
    Log::critical("DETERMINISM VIOLATION tick={$tick}");
    // abort + alert
}
```

---

## Tuning Constants

| Constant | Start | Max | Ghi chú |
|---|---|---|---|
| `field_influence` | 0.02 | 0.05 | Social field effect |
| `logistic_decay_k` | 0.05 | 0.15 | Entropy damping |
| `noise_amplitude` | 0.01 | 0.05 | Stochastic per tick |
| `drift_inertia_threshold` | 0.25 | — | Archetype đổi khi delta > X |
| `drift_stable_cycles` | 5 | — | Cycles ổn định trước drift |
| `phase_multiplier_max` | 2.0 | — | FitnessLandscape cap |
| `war_pressure_exponent` | 1.5 | 2.0 | Phi tuyến (đừng > 2) |
| `mutation_rate` | 0.01 | — | 1% actor random hành vi |
| `entropy_budget_per_actor` | entropy/n | — | Consume-based |
| `rng_partition_count` | 1024 | — | Fixed, không đổi |

> [!WARNING]
> Bắt đầu ở giá trị nhỏ nhất. Increase dần sau 100+ cycles log. Đừng tune bằng cảm giác.

---

## Files cần tạo mới (toàn bộ)

```
app/Modules/Intelligence/
├── Domain/
│   ├── Rng/
│   │   └── SimulationRng.php              ← Phase 0b
│   ├── Entropy/
│   │   └── EntropyBudget.php              ← Phase 0c
│   ├── BehaviorStats.php                  ← Phase 1
│   ├── Society/
│   │   ├── SocialField.php                ← Phase 2
│   │   ├── SocialFieldCalculator.php      ← Phase 2
│   │   └── PolarizationCalculator.php     ← Phase 2
│   ├── Archetype/
│   │   ├── ArchetypeDefinition.php        ← Phase 3
│   │   └── ArchetypeClassifier.php        ← Phase 3
│   └── Phase/
│       ├── PhaseScore.php                 ← Phase 4
│       ├── PhaseDetector.php              ← Phase 4
│       └── FitnessLandscapeProvider.php   ← Phase 4
├── Services/
│   ├── ArchetypeResolverService.php       ← Phase 1 (stepping stone)
│   ├── CognitiveDynamicsEngine.php        ← Phase 2
│   ├── MacroStateEvolution.php            ← Phase 5
│   └── ActorTransitionSystem.php          ← Phase 0d
└── Actions/
    └── UpdateArchetypeAction.php          ← Phase 3
```

## Files sửa (existing)
- [ActorEvolutionService.php](file:///c:/projects/IPFactory/backend/app/Modules/Intelligence/Services/ActorEvolutionService.php) — inject ArchetypeResolverService, remove hardcode
- [SpawnFromEventsAction.php](file:///c:/projects/IPFactory/backend/app/Modules/Intelligence/Actions/SpawnFromEventsAction.php) — inject ArchetypeResolverService, remove hardcode
- `EvolveActorsAction.php` — BehaviorStats + CognitiveDynamicsEngine + SimulationRng
- [ActorEntity.php](file:///c:/projects/IPFactory/backend/app/Modules/Intelligence/Entities/ActorEntity.php) → extract ra `ActorState` + `ActorTransitionSystem`

---

## Resume Checklist

Khi quay lại — làm theo thứ tự này:

- [ ] **Đo thời gian tick hiện tại** → quyết định Tick Architecture A/B/C
- [ ] **Migration:** add `seed BIGINT` vào [universes](file:///c:/projects/IPFactory/frontend/src/lib/api.ts#54-61) table
- [ ] **Phase 0b:** `SimulationRng` (SplitMix64, per-actor-per-tick)
- [ ] **Phase 0c:** `EntropyBudget` (consume-based, không shared)
- [ ] **Phase 1 (Quick win):** `ArchetypeResolverService` + fix hardcode "Ẩn Sĩ"
- [ ] **Phase 0d (song song):** `ActorState` + `ActorTransitionSystem` refactor
- [ ] **Phase 2:** Social layer (SocialField, Polarization)
- [ ] **Phase 3:** Emergent `ArchetypeClassifier`
- [ ] **Phase 4:** `PhaseDetector` + `FitnessLandscapeProvider`
- [ ] **Phase 5:** Macro dynamics + NonLinear feedback
- [ ] **Phase 6:** Cycle orchestration + parallel dispatch

---

## Ghi chú JSON Storage

**actors.metrics** (thêm fields):
```json
{
  "influence": 0.5,
  "behavior_stats": {
    "battles_won": 3, "research_actions": 12,
    "trade_actions": 5, "spiritual_actions": 0, "survival_cycles": 47
  },
  "archetype_confidence": 0.7,
  "archetype_stable_cycles": 8
}
```

**universe_snapshots.metrics** (thêm fields):
```json
{
  "entropy": 0.45, "polarization_index": 0.22,
  "phase_score": { "primitive": 0.1, "industrial": 0.6, "information": 0.2, "fragmented": 0.1 },
  "archetype_distribution": { "Chiến Binh": 0.25, "Học Giả": 0.30 },
  "snapshot_hash": "sha256:..."
}
```

**Migration path storage:**
```
< 10k actors:   PostgreSQL jsonb (hiện tại)
10k-50k actors: Binary blob (bincode) trong BYTEA column
> 50k actors:   Compressed binary (LZ4 + bincode)
```

---

## Phần III: Những Concept Bị Sót (review round 2)

### 1. Social Cohesion Index + Cultural Momentum

Thiếu trong Phase 2. Đây là **3 metric cần thiết**, plan cũ chỉ có Polarization:

| Metric | Formula | Lưu vào |
|---|---|---|
| `polarization_index` | stddev(Dominance+Vengeance) | snapshot.metrics |
| `social_cohesion` | avg(Solidarity+Conformity) × (1 - polarization) | snapshot.metrics |
| `cultural_momentum` | moving_average(Δphase_score, window=5) | snapshot.metrics |

**Cultural Momentum ảnh hưởng bifurcation:**
```
momentum cao (> 0.3)  → phase shift dễ xảy ra, ít resistance
momentum thấp (< 0.1) → phase shift cần threshold cao hơn để trigger
```
**Implement:** thêm vào `PolarizationCalculator` hoặc tạo `SocietyMetricsCalculator` riêng.

---

### 2. Micro Bifurcation — Cognitive Attractor (Radical State)

Actor không chỉ drift archetype — actor còn có thể vào **Radical Basin**:

```
Condition: |Dominance - Curiosity| > 0.4 (sustained 3+ cycles)
→ Actor vào Radical Warrior state (aggression-locked)

Condition: |Curiosity - Dominance| > 0.4 (sustained 3+ cycles)
→ Actor vào Radical Scholar state (rationality-locked)
```

**Đây KHÔNG phải archetype mới** — là một `cognitive_state` flag:
```json
// actors.metrics
{
  "cognitive_state": "radical_warrior",  // null | "radical_warrior" | "radical_scholar"
  "radical_intensity": 0.7               // 0-1, cường độ
}
```

**Ảnh hưởng:**
- Radical actors nhân đôi `BehaviorStats` phù hợp (radical_warrior → battles tăng)
- Khó drift archetype (inertia threshold tăng lên 0.4 thay vì 0.25)
- Tăng `chaosPressure` vào macro layer

**Exit condition:** Khi `|Dominance - Curiosity| < 0.2` trong 5+ cycles → exit radical state.

---

### 3. Historical Flags — Path Dependence / Hysteresis

Khi phase shift xảy ra → **cấm quay lại hoàn toàn**. Lưu trong `universe.state_vector`:

```php
// Khi PhaseDetector thấy information.score > 0.5 lần đầu:
$universe->state_vector['historical_flags']['industrialized'] = true;
$universe->state_vector['historical_flags']['peak_tech_level'] = $techLevel;

// Khi fragmented phase:
$universe->state_vector['historical_flags']['collapsed_once'] = true;
```

**FitnessLandscapeProvider đọc historical_flags:**
```
nếu industrialized = true:
  primitive.score *= 0.3    // không quay về primitive hoàn toàn
  min_tech_floor = 2        // tech_level không xuống dưới 2

nếu collapsed_once = true:
  fragmented.threshold giảm 0.1  // dễ collapse lần 2
```

**Đây là Hysteresis** — cùng state vector nhưng lịch sử khác nhau → trajectory khác.

---

### 4. Emergent Faction Formation

Khi archetype concentration duy trì cao trong nhiều cycles:

```
Trigger: warrior_ratio > 0.4 trong 3 cycles liên tiếp
→ spawn Faction("Quân Phiệt")
Archetype: Chiến Binh khu vực này có decision bias +50% cho battle actions

Trigger: scholar_ratio > 0.45
→ spawn Faction("Hội Học Giả")

Trigger: fragmented_score > 0.6
→ spawn Faction("Quân Phiệt Cát Cứ") — nhiều faction nhỏ
```

**Faction object** (lưu trong `universe.state_vector.factions`):
```json
{
  "id": "faction_001",
  "name": "Quân Phiệt",
  "ideology_vector": [0.8, 0.2, 0.1],
  "member_actor_ids": [12, 45, 67],
  "collective_decision_bias": { "battle": 1.5, "trade": 0.6 },
  "formed_at_tick": 234
}
```

**Phase thực hiện:** Sau Phase 5. Là Phase 7 bổ sung.

> [!NOTE]
> Faction Formation là emergent — KHÔNG hardcode trigger. Sử dụng threshold + concentration check trong `SocietyAnalyzer` mới.

---

### 5. Existing Archetypes → Migration vào ArchetypeClassifier

Hiện có 6 concrete class: `Archmage`, `RogueAI`, `Technocrat`, `TribalLeader`, `VillageElder`, `Warlord`.

**Vấn đề:** `BaseArchetype.createScar()` đang gọi `ApplyMythScarAction` trực tiếp → Archetype biết về Infrastructure (vi phạm DDD).

**Migration plan:**
```
1. Giữ nguyên 6 class hiện tại (không xóa)
2. Thêm interface method: applyImpact() → ArchetypeImpactEvent (DomainEvent)
3. Engine apply event, không phải Archetype tự apply
4. Ánh xạ sang ArchetypeClassifier mới:
```

| Class hiện tại | Archetype mới | Condition |
|---|---|---|
| `Warlord` | Chiến Binh cấp cao | battles_norm > 0.7 |
| `Archmage` | Tu Chân cấp cao | requires has_linh_ki |
| `Technocrat` | Kỹ Thuật cấp cao | tech_level >= 5 |
| `TribalLeader` | Thủ Lĩnh | leadActions > 20 |
| `VillageElder` | Hiền Nhân | survivalCycles > 100 |
| `RogueAI` | Siêu CN / Đặc Biệt | tech_level >= 8 + crimeActions |

**Bổ sung vào Resume Checklist:**
- [ ] Refactor `BaseArchetype.createScar()` → return `ArchetypeImpactEvent` (DomainEvent)
- [ ] Map 6 existing archetypes vào `ArchetypeDefinition` trong classifier
- [ ] Implement `SocietyMetricsCalculator` (social_cohesion + cultural_momentum)
- [ ] Add `cognitive_state` field vào `actors.metrics`
- [ ] Add `historical_flags` vào `universes.state_vector`
- [ ] Implement Faction Formation logic (Phase 7)
