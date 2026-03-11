# Geography → Resource proxy contract (Deep Sim Phase 1)

Laravel có thể cung cấp **resource capacity** per zone để Rust kernel dùng trong population pressure và flow (Doc 21 §4, Deep Simulation Roadmap Phase 1).

## Phân vai: Rust authoritative, Laravel persistence

- **Rust Engine** = authoritative simulation state (tính toán trạng thái mô phỏng).
- **Laravel** = persistence + orchestration (lưu trữ và điều phối).

**Quy tắc `free_energy`:**
- **Rust:** tính `free_energy` (calculate).
- **Laravel:** persist `free_energy` (ghi lại giá trị từ engine, không tự sửa).
- **Laravel không tự modify `free_energy`** — mọi giá trị zone `free_energy` đến từ Rust; Laravel chỉ lưu snapshot/state trả về từ engine.

## Contract

- **Key trong state**: `state_vector.zones[i].state.resource_capacity` — số thực [0, 1], optional (mặc định 0).
- **Khi `resource_capacity > 0`**: Rust dùng làm resources proxy cho zone đó khi tính population pressure: `resources = (resource_capacity * 1.5 + 0.5).max(0.1)`.
- **Khi `resource_capacity` = 0 hoặc vắng mặt**: Rust fallback công thức cũ: `(base_mass*0.01 + 1)*(1 - material_stress*0.5) + free_energy*0.001`.

## Cách Laravel cung cấp resource_capacity (chỉ input)

- **Laravel chỉ cung cấp input cho Rust:** Trong `AdvanceSimulationAction::prepareEngineStateInput`, mỗi zone được gán `state.resource_capacity` từ:
  - **Config** (ưu tiên): `config('worldos.geography.resource_capacity')` — mảng `zone_id => 0.0–1.0`.
  - **Công thức mặc định**: `0.3 + 0.2 * (zone_id % 3)`, clamp [0, 1], khi config không có entry cho zone.
- **Laravel không tính resource_capacity sau snapshot** — không post-process ghi đè từ terrain/climate sau khi Rust trả. Khi Rust engine tự tính được resource_capacity (terrain, climate), Laravel bỏ công thức trên và chỉ gửi config nếu cần. Contract tổng: [RUST_LARAVEL_SIMULATION_CONTRACT.md](RUST_LARAVEL_SIMULATION_CONTRACT.md).

## Engine / nguồn gợi ý

- **GeographyEngine** (`Modules/World/Services/GeographyEngine.php`): Hiện stub; có thể output effect hoặc trực tiếp ghi per-zone attribute (terrain_type, river_adjacent) — sau đó map sang `resource_capacity` (ví dụ river_adjacent → +0.2, terrain fertile → +0.3).
- **ClimateEngine**: Tương tự, aridity / temperature → modifier lên resource_capacity.
- **AgricultureEngine**: Có thể cập nhật resource_capacity theo sản lượng nông nghiệp ước lượng.

Logic deterministic (công thức terrain+climate → capacity) có thể chuyển vào Rust sau để tránh logic drift (Doc 21 §5); bước đầu Laravel ghi là đủ.

## Power Economy: cosmic pool và free_energy

**Cosmic energy pool** (cấp universe): **CosmicEnergyPoolService** tính và ghi `state_vector.cosmic_energy_pool` (inflow, decay, cap). **Quyết định (B): meta layer chỉ Laravel** — Rust không có layer tương đương; không trùng logic. Chi tiết authoritative vs Laravel-only: [RUST_LARAVEL_SIMULATION_CONTRACT.md](RUST_LARAVEL_SIMULATION_CONTRACT.md).

**free_energy trong zone:** **Rust tính `free_energy`**, **Laravel chỉ persist**. Laravel không được tự ghi `zones[i].state.free_energy`.

- **`worldos.power_economy.feed_zones`**: Khi bật, CosmicEnergyPoolService chuyển một phần cosmic pool sang `zones[i].state.free_energy` → **vi phạm** contract. Khi dùng Rust authoritative (`worldos.simulation.rust_authoritative` = true), **phải tắt feed_zones** (false). Luồng cosmic pool → zone nếu cần: triển khai phía Rust.
