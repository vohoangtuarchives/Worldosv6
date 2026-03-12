# WorldOS Memory Architecture (Doc §24, RÀ_SOÁT_TMP mục 10)

Kiến trúc bộ nhớ quyết định **10x performance**: 100k vs 100M agents, tick 2s vs 50ms. Tài liệu thiết kế; triển khai từng phần trong Rust (worldos-core) và Laravel.

## Mục tiêu hiệu năng

| Quy mô | Actors | Zones | Edges | Tick time mục tiêu | Throughput |
|--------|--------|-------|--------|--------------------|-------------|
| Nhỏ | 1k–10k | 256–1k | 10k | 5–20 ms | 50–200 tick/s |
| Trung bình | 100k | 4k | 1M | 20–100 ms | 10–50 tick/s |
| Lớn | 100M | 64k+ | 100M+ | 50–500 ms | 2–20 tick/s |

## Thành phần

### 1. ECS & SoA (Structure of Arrays)

- **Zone state:** Mỗi zone một bản ghi; state theo zone (entropy, material_stress, civ_fields, …) — **đã có** trong Rust `ZoneState`, Laravel state_vector.zones.
- **Actor storage:** SoA cho 17 traits: mảng riêng cho từng chiều (dom, amb, coe, …) thay vì array of struct — **một phần** (Rust `Agent` vẫn là struct; có thể tách sang SoA khi scale).

### 2. ZoneActorIndex (Spatial index)

- **Mục đích:** O(1) hoặc O(k) truy vấn "actors trong zone Z". Tránh scan toàn bộ agents.
- **Cấu trúc:** `zone_to_actors: Vec<Vec<ActorId>>` — **đã có** trong [worldos-core/src/memory.rs](../../engine/worldos-core/src/memory.rs).
- **Cập nhật:** Khi agent spawn/di chuyển, cập nhật index; rebuild từ zones khi load snapshot.

### 3. Social Graph (CSR — Compressed Sparse Row)

- **Mục đích:** Đồ thị xã hội (trust, loyalty, rivalry) scale 1M+ cạnh mà không tốn O(n²).
- **Cấu trúc:** `offsets`, `edges`, `weights` — **đã có** `SocialGraphCsr` trong [worldos-core/src/memory.rs](../../engine/worldos-core/src/memory.rs).
- **Laravel:** SocialGraphService ghi state_vector.social_graph; có thể export sang CSR khi gọi Rust.

### 4. Hot / Warm / Cold state

| Loại | Nội dung | Vị trí |
|------|----------|--------|
| **Hot** | State đang advance (zones, agents, graph) | RAM, Redis cache (optional) |
| **Warm** | Snapshot gần đây, replay | PostgreSQL, Redis |
| **Cold** | Archive lâu dài | S3/MinIO (SnapshotArchiveInterface) |

### 5. Tick duration & throughput

- **Đo lường:** `tick_duration_ms` trong snapshot metrics và Cache `worldos.tick_duration_ms.{universe_id}`; Prometheus `worldos_tick_duration_ms`.
- **Mục tiêu:** Giữ tick &lt; 50 ms cho 100k actors khi đã tối ưu (ZoneActorIndex, CSR, ít allocation).

## Tham chiếu

- [WorldOS_Architecture.md](../../docs/WorldOS_Architecture.md) §24 (Spatial Index, Graph CSR)
- [WORLDOS_ARCHITECTURE_MAPPING.md](WORLDOS_ARCHITECTURE_MAPPING.md) §24
- [RÀ_SOÁT_TMP.md](../../docs/RÀ_SOÁT_TMP.md) mục 10
