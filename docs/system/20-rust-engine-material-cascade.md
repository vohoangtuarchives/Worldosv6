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
  - Chuyển phase: **Normal → Famine → Riots → Collapse**; sau Collapse giữ Collapse, vẫn có thể emit Crisis.
  - Emit event tương ứng: `SimEvent::Famine`, `SimEvent::Riots`, `SimEvent::Collapse`.
  - Ở mỗi bước tăng dần entropy/trauma (Famine nhẹ, Riots mạnh hơn, Collapse mạnh nhất).
  - Khi chuyển sang **Collapse**: `active_materials.clear()` cho zone đó.
  - Scar được ghi vào `state.scars` (ví dụ "Tick N: Famine (Zone i)").
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

---

Xem thêm: [16 Simulation Kernel & Potential Field](16-simulation-kernel-and-potential-field.md), [09 Material System](09-material-system.md).
