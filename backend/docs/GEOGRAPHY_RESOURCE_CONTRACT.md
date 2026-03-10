# Geography → Resource proxy contract (Deep Sim Phase 1)

Laravel có thể cung cấp **resource capacity** per zone để Rust kernel dùng trong population pressure và flow (Doc 21 §4, Deep Simulation Roadmap Phase 1).

## Contract

- **Key trong state**: `state_vector.zones[i].state.resource_capacity` — số thực [0, 1], optional (mặc định 0).
- **Khi `resource_capacity > 0`**: Rust dùng làm resources proxy cho zone đó khi tính population pressure: `resources = (resource_capacity * 1.5 + 0.5).max(0.1)`.
- **Khi `resource_capacity` = 0 hoặc vắng mặt**: Rust fallback công thức cũ: `(base_mass*0.01 + 1)*(1 - material_stress*0.5) + free_energy*0.001`.

## Cách Laravel ghi giá trị

1. **Trước khi gọi Rust (input state)**: Trong `AdvanceSimulationAction::prepareEngineStateInput`, mỗi zone được gán `state.resource_capacity` từ:
   - **Config** (ưu tiên): `config('worldos.geography.resource_capacity')` — mảng `zone_id => 0.0–1.0`. Key `worldos.geography.resource_capacity` trong `config/worldos.php`.
   - **Công thức mặc định**: `0.3 + 0.2 * (zone_id % 3)`, clamp [0, 1], deterministic khi config không có entry cho zone.
2. **Sau khi Rust trả về (snapshot)**: Listener hoặc bước post-process đọc snapshot mới, tính `resource_capacity` per zone (ví dụ từ terrain_type, climate_aridity), ghi vào `state_vector.zones[i].state.resource_capacity` rồi lưu snapshot. Tick tiếp theo state này sẽ được gửi lại cho Rust.

## Engine / nguồn gợi ý

- **GeographyEngine** (`Modules/World/Services/GeographyEngine.php`): Hiện stub; có thể output effect hoặc trực tiếp ghi per-zone attribute (terrain_type, river_adjacent) — sau đó map sang `resource_capacity` (ví dụ river_adjacent → +0.2, terrain fertile → +0.3).
- **ClimateEngine**: Tương tự, aridity / temperature → modifier lên resource_capacity.
- **AgricultureEngine**: Có thể cập nhật resource_capacity theo sản lượng nông nghiệp ước lượng.

Logic deterministic (công thức terrain+climate → capacity) có thể chuyển vào Rust sau để tránh logic drift (Doc 21 §5); bước đầu Laravel ghi là đủ.
