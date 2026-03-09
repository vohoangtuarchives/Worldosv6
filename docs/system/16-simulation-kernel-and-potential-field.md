# 16 — Simulation Kernel & Potential Field (V6)

Tài liệu mô tả **Simulation Kernel** (Laravel-side, effect-based) và kiến trúc **Potential Field** dùng để simulation tự sinh lịch sử thay vì chỉ random event.

## 16.1 Simulation Kernel

- **Vị trí**: `App\Simulation\SimulationKernel`, `App\Simulation\EffectResolver`
- **Chế độ tick (Phase 5)**:
  - **`simulation_tick_driver` = `rust_only`** (mặc định): Tick thực thi hoàn toàn trên Rust. Laravel chỉ đồng bộ state từ snapshot, lưu snapshot, fire event `UniverseSimulationPulsed`, chạy listener (AEE, fork, narrative, …). SimulationKernel **không** chạy.
  - **`simulation_tick_driver` = `laravel_kernel`**: Sau khi Rust trả snapshot, nếu `simulation_kernel_post_tick === true` thì Laravel chạy `SimulationKernel::runTick()` và ghi đè snapshot bằng output của kernel (deterministic, effect-based).
- **Kích hoạt kernel**: Chỉ khi `config('worldos.simulation_tick_driver') === 'laravel_kernel'` **và** `config('worldos.simulation_kernel_post_tick') === true`.
- **Luồng (khi dùng kernel)**: Load `WorldState` từ snapshot → chạy lần lượt các engine đã đăng ký → mỗi engine chỉ **đọc** state và **emit** `Effect[]` → `EffectResolver` áp dụng toàn bộ effect lên bản copy mutable → trả về `WorldState` mới.

### Engine đăng ký (thứ tự)

| Engine | Mô tả | Time-scale factor (mặc định) |
|--------|--------|------------------------------|
| PotentialFieldEngine | Trường áp lực zone: decay, diffusion, coupling | 1 |
| ZoneConflictEngine | Xung đột zone, conquest (dùng war_pressure) | 1 |
| CosmicPressureEngine | Áp lực vũ trụ (innovation, entropy, order, myth, conflict, ascension) + Phase Pressure | 1 |
| StructuralDecayEngine | Chống đóng băng: tăng entropy / giảm order khi thế giới quá ổn định | 5 |
| CulturalDriftEngine | Drift + diffusion văn hóa giữa zone (tradition, innovation, myth, …) | 3 |
| LawEvolutionEngine | Tiến hóa world_rules (entropy_tendency, order_tendency, …) với inertia | 20 |
| AdaptiveTopologyEngine | Rewire cạnh (neighbors) giữa zone theo thời gian | 50 |

### Time-Scale

- Mỗi engine đăng ký kèm **tick factor**. Engine chỉ chạy khi `tick % factor === 0`.
- Cấu hình: `config('worldos.time_scale_factors')` — key theo tên engine (snake_case). Ví dụ `structural_decay => 5` → chạy mỗi 5 tick.

## 16.2 Potential Field (zone-level)

- **Mục đích**: Tích lũy áp lực theo zone (war, economic, religious, migration, innovation), decay + diffusion giữa zone, sau đó event (vd. xung đột) kích hoạt khi vượt ngưỡng thay vì random.
- **Thành phần**:
  - `WorldState::getZonePressures()`, `defaultZonePressureKeys()`: đọc/khởi tạo 5 pressure trong `zone.state`.
  - `ZonePressureCalculator`: tính delta pressure từ state zone, global, và neighbor; `applyCoupling()` áp cross-term (war → economic, …).
  - `PotentialFieldEngine`: normalize zone → decay + deltas → diffusion (theo topology) → coupling → ghi lại vào `zone.state`.
- **Topology**: `TopologyResolver::getNeighborIndices()` — ưu tiên `zone['neighbors']` (graph), không có thì ring. Diffusion có thể dùng trọng số qua `getNeighborIndicesWithWeights()` nếu zone có `edge_weights`.

## 16.3 Phase Pressure & Cosmic Signals

- **CosmicSignalCollector**: Thu thập tín hiệu từ WorldState (order, energy_level, entropy, myth, spirituality, violence, innovation).
- **PhasePressureCalculator**: Từ tín hiệu tính `ascension_pressure` và `collapse_pressure`.
- **CosmicPressureEngine**: Ghi hai giá trị này vào `state_vector.pressures`; `AscensionEngine` dùng làm điều kiện Eschaton (collapse_pressure > 0.95) và Ascension (ascension_pressure > 0.9).

## 16.4 Các effect chính

| Effect | Ghi vào |
|--------|--------|
| PressureUpdateEffect | state_vector.pressures (cosmic + phase) |
| ZoneFieldUpdateEffect | state_vector.zones[].state (pressure + culture nếu đã merge) |
| ZoneCultureUpdateEffect | zone.state.culture (từ CulturalDriftEngine) |
| ZoneNeighborsUpdateEffect | zone.neighbors (từ AdaptiveTopologyEngine) |
| WorldRulesUpdateEffect | state_vector.world_rules |
| StructuralDecayEffect | state_vector.entropy, state_vector.order |

## 16.5 Cấu hình (worldos.php)

- `simulation_tick_driver`: `rust_only` (mặc định) hoặc `laravel_kernel`. Xem 16.1.
- `simulation_kernel_post_tick`: bật kernel sau mỗi tick (chỉ có hiệu lực khi `simulation_tick_driver` = `laravel_kernel`).
- `potential_field_war_threshold`: ngưỡng war_pressure để ZoneConflictEngine kích hoạt conquest.
- `time_scale_factors`: factor theo tên engine.
- `eschaton_survivability`: xác suất material instance sống sót qua Eschaton theo ontology (symbolic, institutional, behavioral, physical, default).

## 16.6 Population layer & Snapshot

- Zone state hỗ trợ `population_proxy` (mặc định 0.5). `SnapshotLoader` và `ZonePressureCalculator::ensureZonePressureKeys()` khởi tạo key này; `computeDeltas()` dùng để tăng nhẹ economic_pressure.

---

Xem thêm: [03 Simulation Loop](03-simulation-loop.md), [09 Material System](09-material-system.md).
