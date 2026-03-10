# Macro agents contract (Deep Sim Phase 4)

Laravel spawn/update **macro agents** (army, ruler, trader); Rust kernel đọc từ state và áp effect lên pressure/entropy.

## State shape

- **Key**: `state_vector.macro_agents` — mảng object: `{ "zone_id": u32, "type": "army"|"ruler"|"trader", "strength": number }`.
- **zone_id**: Khớp với `state_vector.zones[i].id`.
- **strength**: [0, 1], mặc định 0.

## Effect (Rust)

- **Army**: Zone pressure tăng `strength * MACRO_ARMY_PRESSURE_COEFF` → dễ cascade.
- **Ruler**: Entropy zone giảm nhẹ mỗi tick (`entropy -= 0.01 * strength`).
- **Trader**: Chưa có (khi có trade flow sẽ bổ sung).

## Laravel: spawn và persistence

- **Spawn**: `MacroAgentSpawnService::spawnIfEligible()` được gọi từ listener `EvaluateSimulationResult` (sau store pressure metrics). Điều kiện spawn:
  - **Ruler**: Zone có institution `entity_type === 'CIVILIZATION'` (theo `influence_map`) và chưa có ruler cho zone đó; strength 0.5–0.8 (deterministic từ seed + tick + zone_id).
  - **Army**: Zone có `state.war_pressure >=` ngưỡng (config `worldos.macro_agents.war_pressure_threshold`, mặc định 0.5), tối đa 1 army per zone từ spawn; strength 0.3–0.6.
- **Giới hạn (B.3)**: `worldos.macro_agents.max_per_zone` (mặc định 3), `worldos.macro_agents.max_total` (mặc định 20); không spawn ruler trùng zone đã có ruler.
- **Persistence**: Service merge agent mới vào `state_vector.macro_agents` rồi `universeRepository->update(universe->id, ['state_vector' => $vec])`. Snapshot và advance tiếp theo sẽ nhận đúng state; không cần bảng riêng trừ khi cần map agent → institution/actor cho narrative.
