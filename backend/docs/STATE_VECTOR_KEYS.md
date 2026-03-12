# State vector key convention (WorldOS)

Quy ước key trong `state_vector` (Universe / UniverseSnapshot) và cách đọc qua [WorldState](app/Simulation/Domain/WorldState.php). Engine nên ghi/đọc theo chuẩn này (doc §5).

---

## Rule VM state contract

Rule VM (Rust) nhận **state** dạng JSON. Laravel xây state này tại **RuleVmService::buildStateForVm(Universe, UniverseSnapshot)**: merge `snapshot.state_vector` với các key top-level theo [WorldOS_DSL_Spec](../docs/WorldOS_DSL_Spec.md) §3:

- **Luôn có:** `tick`, `entropy`, `global_entropy`, `stability_index`, `sci`, `instability_gradient`, `knowledge_core`
- **Từ metrics:** `global_fields` (nếu có `metrics.civ_fields`)
- **Từ state_vector:** mọi key khác (vd. `civilization`, `zones`) — DSL chỉ đọc được path có trong state trả về từ buildStateForVm

Khi thêm path mới cho DSL (vd. `civilization.politics.corruption`), đảm bảo snapshot.state_vector hoặc metrics được điền đúng trước khi gọi Rule VM.

---

## State cache (optional — Phase 2 §2.3)

Khi `worldos.state_cache.driver=redis`, **StateSynchronizer** ghi `state_vector` + tick vào Redis (key `worldos:universe:{id}:state`, TTL theo config). **EngineDriver** khi chuẩn bị input cho advance: nếu cache có bản ghi với tick ≥ universe.current_tick thì ưu tiên dùng state từ cache. Giúp giảm đọc DB khi chạy nhiều tick liên tiếp. Interface: `App\Simulation\Contracts\StateCacheInterface`; implementations: `NullStateCache`, `RedisStateCache`.

---

## Root keys (state_vector)

| Key | Ý nghĩa | Đọc qua | Ghi chú |
|-----|---------|---------|---------|
| `planet` | Layer hành tinh (địa lý, khí hậu) | `getPlanet()` | Array, thường từ engine World |
| `civilizations` | Danh sách / map nền văn minh | `getCivilizations()` | Array |
| `population` | Layer dân số (proxy, phân bố) | `getPopulation()` | Array |
| `economy` | Layer kinh tế, thương mại | `getEconomy()` | Array; có thể chứa `market`: `{ prices: { food, energy? }, updated_tick, volatility, trade_route_emitted_at_tick? }` do MarketEngine ghi; `energy` từ cosmic_energy_pool scarcity (Laravel meta); TRADE_ROUTE_ESTABLISHED phát một lần khi có zone thặng dư và zone thâm hụt |
| `knowledge` | Layer tri thức, công nghệ | `getKnowledge()` | Array |
| `culture` | Layer văn hóa (global) | `getCulture()` | Array |
| `active_attractors` | Attractor đang hoạt động | `getActiveAttractors()` | Array |
| `wars` | Xung đột / chiến tranh đang diễn ra | `getWars()` | Array |
| `zones` | Danh sách zone (topology, state từng zone) | `getZones()` | Array of zone (xem bảng Zone) |
| `entropy` | Entropy toàn cục (0..1) | `getEntropy()` | Float |
| `innovation` | Mức độ đổi mới | `getInnovation()` | Float |
| `order` | Mức độ trật tự | `getOrder()` | Float |
| `pressures` | Áp lực tích lũy (innovation, entropy, order, myth, conflict, ascension, ascension_pressure, collapse_pressure) | `getPressures()` | Object với các key float |
| `world_rules` | Quy tắc Tier 2 (entropy_tendency, order_tendency, innovation_tendency, _inertia) | `getStateVectorKey('world_rules')` | Object, engine LawEvolution ghi |
| `diplomacy` | Quan hệ ngoại giao (rel_* giữa civilization) | `getStateVectorKey('diplomacy')` | Object, ZoneConflict đọc |
| `myth`, `violence`, `spirituality` | Scalar culture/global | `getStateVectorKey('myth'|'violence'|'spirituality')` | Float, CosmicPressure đọc |
| `cosmic_energy_pool` | Power Economy: pool năng lượng vũ trụ (cosmic phase + Supreme Entity) | `getStateVectorKey('cosmic_energy_pool')` | Object: `pool`, `updated_tick`, `sources`; CosmicEnergyPoolService ghi khi `worldos.power_economy.enabled` |
| `social_graph` | Doc §22: quan hệ trust/loyalty/rivalry giữa actor | `getStateVectorKey('social_graph')` | Object: `trust`, `loyalty`, `rivalry` (mảng edge [actor_a_id, actor_b_id, weight]), `updated_tick`; SocialGraphService ghi |
| `dominant_ideology` | Hệ tư tưởng trội (aggregate từ institutions) | `getStateVectorKey('dominant_ideology')` | IdeologyEvolutionEngine ghi |
| `previous_dominant_ideology` | Hệ tư tưởng trội trước đó (để tính conversion) | `getStateVectorKey('previous_dominant_ideology')` | IdeologyEvolutionEngine ghi |
| `ideology_conversion` | Doc §10: xác suất chuyển dịch ideology (rate_per_tick) | `getStateVectorKey('ideology_conversion')` | IdeologyConversionService qua IdeologyEvolutionEngine::storeConversionRate |
| `knowledge_graph` | Doc §9: đồ thị tri thức (nodes từ Idea, edges stub) | `getStateVectorKey('knowledge_graph')` | KnowledgeGraphService — `nodes`, `edges`, `updated_tick` |
| `great_person_legacy` | Doc §11: aggregate SupremeEntity (karma, power_level) | `getStateVectorKey('great_person_legacy')` | GreatPersonLegacyService — `supreme_entity_count`, `aggregate_power_level`, `aggregate_karma`, `legacy_myth_actor_count`, `updated_tick` |

---

### civilization.economy (GlobalEconomyEngine, Doc §16)

Ngoài `total_surplus`, `total_consumption`, `updated_tick` còn có:

| Key | Ý nghĩa |
|-----|---------|
| `trade_flow` | Luồng thương mại tổng (proxy route_capacity × supply × demand) |
| `hub_scores` | Map zone_index → hub_score (connectivity + surplus share) |
| `inequality` | Doc §7: `gini_index`, `surplus_concentration`, `elite_share_proxy`, `updated_tick`; InequalityEngine ghi |

### civilization.demographic (DemographicRatesService, Doc §13)

| Key | Ý nghĩa |
|-----|---------|
| `stage` | stage_1 … stage_4 (DemographicStages) |
| `birth_rate`, `death_rate` | Tỉ lệ sinh/tử theo stage |
| `urban_ratio_proxy`, `updated_tick` | Tỉ lệ đô thị (proxy), tick cập nhật |

### civilization.discovery (CivilizationDiscoveryService, Doc §36)

| Key | Ý nghĩa |
|-----|---------|
| `fitness` | Điểm fitness (lifespan, innovation, population, stability, cultural richness) |
| `updated_tick` | Tick cập nhật |

### civilization.politics (PoliticsEngine + LegitimacyEliteService, Doc §17)

Ngoài các key do PoliticsEngine ghi còn có:

| Key | Ý nghĩa |
|-----|---------|
| `legitimacy_aggregate` | Trung bình legitimacy từ InstitutionalEntity (LegitimacyEliteService) |
| `elite_ratio` | Tỉ lệ elite (founders + phần members) / tổng actor sống |
| `elite_overproduction` | max(0, elite_ratio - threshold) |

### cognitive_aggregate (ActorCognitiveService, Doc §21)

Ngoài `destiny_gradient`, `causal_curiosity`, `anomaly_sensitivity`, `existential_tension`, `civilization_tendency` còn có:

| Key | Ý nghĩa |
|-----|---------|
| `mental_state` | `beliefs`, `goals`, `emotions` (fear, anger, hope, pride) |
| `perception_state` | `information_accuracy`, `rumors` (số lượng) |
| `cognitive_biases` | `confirmation_bias`, `loss_aversion`, `status_quo_bias`, `authority_bias` |

---

## pressures (subkeys)

Dùng bởi CosmicPressureEngine, AscensionEngine. Các key: `innovation`, `entropy`, `order`, `myth`, `conflict`, `ascension`, `ascension_pressure`, `collapse_pressure` (float 0..1).

---

## Zone structure (state_vector.zones[])

Mỗi phần tử zone thường có:

| Key | Ý nghĩa |
|-----|---------|
| `id` | Id zone (string hoặc int) |
| `state` | Trạng thái zone: `order`, `entropy`, `war_pressure`, `economic_pressure`, `religious_pressure`, `migration_pressure`, `innovation_pressure`, `culture` (object), `population_proxy`, `free_energy` (optional, Power Economy feed) |
| `neighbors` | Mảng id zone lân cận (topology) |
| `conflict_status` | Optional, do Effect ghi (vd. `active`) |

Pressure zone: xem `WorldState::getZonePressures($zone)` và `WorldState::defaultZonePressureKeys()`.

---

## Snapshot / persistence

`UniverseSnapshot.state_vector` lưu JSON đủ các key trên. Engine đọc qua WorldState (SnapshotLoader build từ snapshot); thay đổi state chỉ qua Effect → EffectResolver, không ghi trực tiếp vào state_vector trong engine.
