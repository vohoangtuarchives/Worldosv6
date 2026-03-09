# State vector key convention (WorldOS)

Quy ước key trong `state_vector` (Universe / UniverseSnapshot) và cách đọc qua [WorldState](app/Simulation/Domain/WorldState.php). Engine nên ghi/đọc theo chuẩn này (doc §5).

---

## Root keys (state_vector)

| Key | Ý nghĩa | Đọc qua | Ghi chú |
|-----|---------|---------|---------|
| `planet` | Layer hành tinh (địa lý, khí hậu) | `getPlanet()` | Array, thường từ engine World |
| `civilizations` | Danh sách / map nền văn minh | `getCivilizations()` | Array |
| `population` | Layer dân số (proxy, phân bố) | `getPopulation()` | Array |
| `economy` | Layer kinh tế, thương mại | `getEconomy()` | Array |
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

---

## pressures (subkeys)

Dùng bởi CosmicPressureEngine, AscensionEngine. Các key: `innovation`, `entropy`, `order`, `myth`, `conflict`, `ascension`, `ascension_pressure`, `collapse_pressure` (float 0..1).

---

## Zone structure (state_vector.zones[])

Mỗi phần tử zone thường có:

| Key | Ý nghĩa |
|-----|---------|
| `id` | Id zone (string hoặc int) |
| `state` | Trạng thái zone: `order`, `entropy`, `war_pressure`, `economic_pressure`, `religious_pressure`, `migration_pressure`, `innovation_pressure`, `culture` (object), `population_proxy` |
| `neighbors` | Mảng id zone lân cận (topology) |
| `conflict_status` | Optional, do Effect ghi (vd. `active`) |

Pressure zone: xem `WorldState::getZonePressures($zone)` và `WorldState::defaultZonePressureKeys()`.

---

## Snapshot / persistence

`UniverseSnapshot.state_vector` lưu JSON đủ các key trên. Engine đọc qua WorldState (SnapshotLoader build từ snapshot); thay đổi state chỉ qua Effect → EffectResolver, không ghi trực tiếp vào state_vector trong engine.
