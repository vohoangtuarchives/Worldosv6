# Simulation calibration (Deep Sim Phase 2.3)

Hằng số kernel (Rust) ảnh hưởng đến "healthy" simulation band (Doc 21 §4e). Sau khi chạy batch metrics (`worldos:simulation-batch`), có thể điều chỉnh để variance_pressure oscillates.

## Nguồn hằng số

- **Rust**: `engine/worldos-core/src/constants.rs` — COLLAPSE_THRESHOLD, BETA_DIFFUSION, HAZARD_SIGMOID_STEEPNESS, PHASE_DIFFUSION_*, EVENT_CASCADE_*, POPULATION_FLOW_*.
- **Pressure weights** (trùng với Rust `pressure_at_zone`): `SimulationMetricsLogger::PRESSURE_WEIGHTS` (inequality 0.2, entropy 0.3, trauma 0.2, material_stress 0.3).

## Recommended ranges (gợi ý)

| Constant | Hiện tại | Gợi ý | Tác dụng |
|----------|----------|--------|----------|
| COLLAPSE_THRESHOLD | 0.85 | 0.8–0.9 | Cao hơn → ít collapse hơn. |
| BETA_DIFFUSION | 0.05 | 0.03–0.08 | Cao hơn → diffusion nhanh, zone đồng đều hơn. |
| HAZARD_SIGMOID_STEEPNESS | 8.0 | 5–12 | Cao hơn → chuyển phase gần deterministic hơn. |

Điều chỉnh từng nhóm, chạy lại 10k ticks, so sánh variance/collapse_rate. Ghi lại bộ giá trị ổn định trong comment tại constants.rs hoặc trong file này.
