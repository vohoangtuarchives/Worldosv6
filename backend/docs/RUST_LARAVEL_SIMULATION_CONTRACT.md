# Rust / Laravel simulation contract — tính toán chỉ một nơi

Quy ước tách bạch: **Rust** = authoritative simulation state (tính toán); **Laravel** = persistence + orchestration (không tính lại state mà Rust đã tính). Không trùng lặp logic giữa hai bên.

---

## 1. Authoritative simulation state keys (Rust)

Các key sau **chỉ Rust được tính và trả trong snapshot**. Laravel **chỉ merge và persist**; **không được ghi đè** bằng logic Laravel khi Rust đã trả.

| Key | Mô tả |
|-----|--------|
| `state_vector.zones[].state` | Toàn bộ zone state: free_energy, population_proxy, food/resources, entropy, v.v. (engine tiến hóa). |
| `state_vector.civilization` | settlements, total_population, economy, politics, war — khi Rust trả. |
| `state_vector.economy` | market (prices, volatility) — khi Rust trả. |

**Quy tắc:** Nếu snapshot từ engine chứa một trong các key trên (hoặc config `worldos.simulation.rust_authoritative` bật), các pipeline stage Laravel **không được ghi** key đó: CivilizationSettlementEngine, GlobalEconomyEngine, MarketEngine, PoliticsEngine, WarEngine phải **skip** (return sớm, không update).

---

## 2. Laravel-only (input hoặc meta)

| Thành phần | Vai trò | Ghi chú |
|------------|--------|--------|
| **resource_capacity** (input) | Laravel cung cấp **input** per zone cho Rust trong `prepareEngineStateInput`. Config hoặc công thức đơn giản. | Khi Rust tự tính được (terrain, climate), Laravel bỏ công thức; chỉ gửi config nếu cần. Không tính resource_capacity **sau** snapshot. |
| **cosmic_energy_pool** | Meta layer chỉ Laravel: CosmicEnergyPoolService tính inflow/decay/cap, ghi `state_vector.cosmic_energy_pool`. | Rust không có layer tương đương; không trùng. **feed_zones** phải tắt khi dùng Rust authoritative (Laravel không ghi free_energy). |
| Events / Chronicle / Cognitive / Collapse | Đọc state để narrative, post-processing, events. | Không ghi lại simulation state authoritative. |

---

## 3. Không ghi đè khi Rust đã trả

- **syncUniverseFromSnapshotData:** Đã gán `state_vector` từ snapshot; các key Rust trả đã nằm trong state.
- **Tick pipeline:** Khi `worldos.simulation.rust_authoritative` = true (hoặc từng key trong `rust_authoritative_keys`), các stage sau **kiểm tra** trước khi ghi:
  - **CivilizationSettlementEngine:** skip nếu `state_vector.civilization` đã có.
  - **GlobalEconomyEngine:** skip nếu `state_vector.civilization.economy` đã có.
  - **MarketEngine:** skip nếu `state_vector.economy.market` đã có.
  - **PoliticsEngine:** skip nếu `state_vector.civilization.politics` đã có.
  - **WarEngine:** skip nếu `state_vector.civilization.war` đã có.

Xem [GEOGRAPHY_RESOURCE_CONTRACT.md](GEOGRAPHY_RESOURCE_CONTRACT.md) cho resource_capacity và free_energy chi tiết.

---

## 4. Distributed simulation (future)

Hiện tại: **single-node** — Rust engine chạy một instance, Laravel orchestrate một world. **Hướng phát triển tương lai:** shards (phân vùng không gian), cross-shard events, ghost zones (vùng đệm biên). Chưa có implementation; kiến trúc doc §28.
