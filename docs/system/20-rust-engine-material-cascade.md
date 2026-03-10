# 20 — Rust Engine: Material System & Cascade

Tài liệu mô tả phần **Rust** của WorldOS: Material pressure (resonance theo slug, ảnh hưởng lên stress/innovation) và **Cascade Engine** (chuỗi Famine → Riots → Collapse).

## 20.1 Vị trí code

- **Crate**: `engine/worldos-core`
- **Types**: `engine/worldos-core/src/types.rs` — `ZoneState`, `ActiveMaterial`, `PressureCoefficients`, `CascadePhase`
- **Universe tick**: `engine/worldos-core/src/universe.rs` — Phase 1 (material pressure), Phase 3 (diffusion)
- **Cascade**: `engine/worldos-core/src/cascade.rs` — `tick_with_cascade()`, `SimEvent`
- **Hằng số**: `engine/worldos-core/src/constants.rs` — `BETA_DIFFUSION`, `COLLAPSE_THRESHOLD`

## 20.2 Material System (trong tick)

### Resonance theo slug

- Trước khi xử lý `active_materials`, engine đếm số lượng từng **slug** trong zone (`HashMap<String, u32>`).
- Nếu zone có **≥ 2** material cùng slug → hệ số **1.5x** cho hiệu ứng của các material đó (entropy, order, innovation, growth).
- Công thức impact: `impact = mat.output * resonance_mult * 0.01`; các delta entropy/order/innovation/growth dùng `resonance_mult` này.

### Ảnh hưởng lên material_stress

- Ngoài `update_material_stress()` (entropy, depletion, fragility, regional_scars), zone nhận thêm **material_stress_delta** từ từng material:
  - `material_stress_delta += mat.pressure_coefficients.entropy * mat.output * resonance_mult * 0.02`
- Sau khi gọi `update_material_stress()`, giá trị cuối: `material_stress = (material_stress + material_stress_delta).clamp(0.0, 1.0)`.

### Diffusion (Phase 3)

- Hệ số diffusion không hardcode: dùng **`BETA_DIFFUSION`** từ `constants.rs` (mặc định `0.05`).
- Áp cho entropy, tech, culture diffusion giữa các zone lân cận.

## 20.3 Cascade Engine

### Chuỗi Famine → Riots → Collapse

- Mỗi zone có **`cascade_phase`** (`CascadePhase`: Normal | Famine | Riots | Collapse) trong `ZoneState`; `#[serde(default)]` để snapshot cũ không có key vẫn deserialize (default Normal).
- Khi **pressure ≥ COLLAPSE_THRESHOLD** (0.85):
  - **Hazard model (Doc 21 §10)**: Không còn deterministic phase++; thay bằng **P(phase change) = sigmoid(pressure)**: `p_transition = 1 / (1 + exp(-k * (p - threshold)))`. RNG deterministic từ `(seed, tick, zone_id)`; nếu `roll < p_transition` thì mới advance phase (Normal → Famine → Riots → Collapse).
  - Khi advance: emit event tương ứng (Famine, Riots, Collapse); tăng entropy/trauma; khi chuyển Collapse: `active_materials.clear()`, **reset dynamics** (giảm entropy, trauma, inequality).
  - Khi pressure **&lt; ngưỡng**: `cascade_phase` reset về **Normal**.

### SimEvent

- Ngoài `Crisis`, `MicroMode`, `MetaCycle`, … engine có thêm: **Famine**, **Riots**, **Collapse** (và giữ variant **Collapse** cho sự kiện chuyển phase Collapse).

## 20.4 Kiểm thử

- **Build**: `cargo build -p worldos-core` (trong thư mục `engine/`).
- **Test**: `cargo test -p worldos-core`
  - `test_material_resonance_same_slug_amplifies_effect`: 2 material cùng slug → delta entropy ≥ 1.4× so với 1 material.
  - `test_cascade_phase_famine_riots_collapse`: pressure cao liên tục 3 tick → Famine → Riots → Collapse; materials bị xóa ở Collapse.
- **E2E**: Laravel gửi `state_vector` với `zones[].state.cascade_phase` (string lowercase); snapshot cũ không có key vẫn hoạt động nhờ `#[serde(default)]`.

## 20.5 Tương thích Laravel

- State vẫn là JSON trong gRPC (`state_vector_json` / `state_input`); không đổi proto.
- `cascade_phase` serialize/deserialize dạng string lowercase (`"normal"`, `"famine"`, `"riots"`, `"collapse"`).

## 20.6 Simulation Replay (Deterministic Debugging) — Doc 21 §4d

Để debug bug tại tick M (vd. 5234), cần **replay từ tick N đến M** với cùng seed và snapshot tại N.

**Replay workflow**:

1. **Load snapshot tại tick N**: Laravel gọi `UniverseSnapshotRepository::getAtTick(universe_id, N)` để lấy state đã lưu.
2. **Lấy seed**: Seed nằm trong world/universe config (world_seed, axiom, genome) gửi qua gRPC; đảm bảo cùng config khi replay.
3. **Gửi state + seed cho Rust engine**: Gọi `SimulationEngineClientInterface::advance(universe_id, M - N, state_input_from_snapshot_N, world_config)` — `state_input` phải là state_vector từ snapshot N, không phải state hiện tại của universe.
4. **So sánh output**: Nếu đã có snapshot lưu tại tick M, so sánh `state_vector` (hoặc hash) của kết quả advance với snapshot M để verify determinism (cùng input → cùng output).

**Yêu cầu**: Rust kernel deterministic với seed; snapshot tại N phải tồn tại. Command `php artisan worldos:replay --universe=ID --from-tick=N --to-tick=M` thực hiện các bước trên và in diff nếu snapshot M tồn tại.

## 20.7 Population Flow (Doc 21 §4.1)

- **ZoneState**: Có trường **`population_proxy`** [0,1] (mặc định 0) — proxy cho dân số zone.
- **Phase 3 (diffusion)**: Ngoài entropy, tech, culture, civ_fields, engine tính **population pressure** và **flow** giữa zone láng giềng:
  - `population_pressure_i = population_proxy_i / (resources_proxy_i + ε)`. **Resources proxy** (Deep Sim Phase 1): nếu `resource_capacity > 0` thì dùng `(resource_capacity * 1.5 + 0.5).max(0.1)`; ngược lại fallback = `(base_mass*0.01 + 1)*(1 - material_stress*0.5) + free_energy*0.001`.
  - Với mỗi cặp (i, j) láng giềng: `flow_ij = k * (pressure_i - pressure_j)` chỉ khi pressure_i > pressure_j; flow bị giới hạn `MAX_POPULATION_FLOW_PER_TICK` mỗi cạnh.
  - `population_proxy_i -= Σ flow_ij`, `population_proxy_j += flow_ij`; clamp trong [0, 1].
- **Hằng số**: `constants::POPULATION_FLOW_COEFFICIENT`, `constants::MAX_POPULATION_FLOW_PER_TICK`.

## 20.9 Resource capacity & geography (Deep Sim Phase 1)

- **ZoneState**: Trường **`resource_capacity`** [0,1] (mặc định 0). Khi > 0, kernel dùng làm nguồn cho resources proxy trong population pressure (zone giàu tài nguyên hút dân).
- **Nguồn**: Laravel có thể ghi `zones[].state.resource_capacity` vào state trước khi gọi Rust (input state cho tick tiếp theo) hoặc sau khi Rust trả về (ghi vào snapshot để tick sau đọc). Contract: GeographyEngine / ClimateEngine hoặc engine tổng hợp output per-zone attribute (terrain, climate_aridity, river_adjacent) hoặc trực tiếp `resource_capacity`; xem [backend/docs/GEOGRAPHY_RESOURCE_CONTRACT.md](../../backend/docs/GEOGRAPHY_RESOURCE_CONTRACT.md).

## 20.10 Innovation / diversity generator (Deep Sim Phase 3)

- **Cultural drift**: Mỗi tick, mỗi zone cộng delta nhỏ **deterministic** (từ `hash(seed, tick, zone_id)`) lên `innovation_openness` và `myth_belief`; clamp [0,1]. Hằng số `CULTURAL_DRIFT_MAGNITUDE` (mặc định 0.008). Diffusion không xóa hết khác biệt.
- **Tech discovery proxy**: Với xác suất deterministic `1/TECH_DISCOVERY_MOD` (vd. 1/500), và khi `material_stress < 0.75` và `population_proxy > 0.1`, zone nhận `knowledge_frontier += TECH_DISCOVERY_DELTA` (clamp dưới tech_ceiling). Roll từ `(seed, tick, zone_id)`.
- Cả hai giữ determinism (replay được).

## 20.11 Macro agents (Deep Sim Phase 4)

- **State**: `UniverseState.macro_agents: Vec<MacroAgent>`. Mỗi **MacroAgent** có `zone_id`, `type` (army | ruler | trader), `strength` [0,1]. Snapshot cũ không có key → default `[]`.
- **Army**: Trong `pressure_at_zone(zone_index)` cộng thêm `sum(army.strength) * MACRO_ARMY_PRESSURE_COEFF` cho armies tại zone đó → zone có quân đội tăng pressure (cascade dễ hơn).
- **Ruler**: Trong tick, sau Phase 1 zone loop: mỗi zone có ruler thì `entropy -= 0.01 * strength` (clamp ≥ 0) → tăng order.
- **Trader**: Chưa implement (trade flow Phase 1.3 optional); có thể bổ sung khi đã có trade flow.
- **Spawn**: Laravel ghi `macro_agents` vào state (trước khi gọi Rust hoặc vào snapshot sau tick); Rust chỉ đọc và áp effect. Xem backend contract spawn/persistence.

## 20.12 Trade flow (Deep Sim Phase C)

- **ZoneState**: Trường **`wealth_proxy`** [0,1] (mặc định 0) — proxy cho “wealth”/resource giữa zone, dùng cho flow thương mại.
- **Phase 3 (sau population flow)**: Engine tính **effective wealth** mỗi zone: nếu `wealth_proxy > 0` dùng giá trị đó; ngược lại khởi tạo từ `resource_capacity` (nếu > 0) hoặc công thức `(base_mass*0.01+1)*(1-material_stress*0.5)+free_energy*0.001`, clamp [0,1].
- **Flow**: Giữa zone láng giềng (i, j): `flow_ij = k_trade * (wealth_i - wealth_j) / n_neighbors`, clamp theo `MAX_TRADE_FLOW_PER_TICK` mỗi cạnh. Mỗi cặp (i, j) chỉ tính một lần (i < j) để tránh double-count. `wealth_proxy_i -= flow`, `wealth_proxy_j += flow`; sau đó clamp [0, 1]. Deterministic.
- **Hằng số**: `constants::TRADE_FLOW_COEFFICIENT` (0.04), `constants::MAX_TRADE_FLOW_PER_TICK` (0.08).

## 20.8 Event Cascade — Pressure Injection (Doc 21 §10)

- Khi emit **Famine**, **Riots** hoặc **Collapse** (sau khi advance phase của zone đó), engine **bơm pressure** vào **neighbor zones** trong cùng tick:
  - Delta: `EVENT_CASCADE_ENTROPY_NEIGHBOR`, `EVENT_CASCADE_TRAUMA_NEIGHBOR`, `EVENT_CASCADE_INEQUALITY_NEIGHBOR` (constants).
  - **Không** đổi phase của neighbor; structural cascade (hazard sigmoid) vẫn quyết định phase ở tick sau. Event chỉ tăng pressure để cascade có thể lan.
- Bảng delta có thể mở rộng (vd. event_type → entropy/trauma/inequality) trong constants hoặc config.

---

Xem thêm: [16 Simulation Kernel & Potential Field](16-simulation-kernel-and-potential-field.md), [09 Material System](09-material-system.md), [21 Field-Based Simulation Architecture](21-field-simulation-architecture-and-roadmap.md).
