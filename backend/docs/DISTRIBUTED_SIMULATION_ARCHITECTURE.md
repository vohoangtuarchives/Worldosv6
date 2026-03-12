# Distributed Simulation Architecture (Doc §28)

Thiết kế hạ tầng mô phỏng phân tán: shards, cross-shard events, ghost zones. **Chưa triển khai** — single-node hiện tại.

## Mục tiêu

- Chạy nhiều universe song song (scale "hàng nghìn universe").
- Chia không gian (spatial partition) thành **shards** (ví dụ 64 shards).
- **Ghost zones**: vùng biên giữa các shard, sao chép state cần thiết để engine không cần gọi cross-node cho mỗi neighbor.

## Thành phần đề xuất

| Thành phần | Mô tả |
|------------|--------|
| **Scheduler Node** | Điều phối: gán universe/shard cho worker, phát lệnh advance. |
| **Worker Nodes** | Chạy advance cho một hoặc nhiều shard; đọc/ghi state local + ghost. |
| **Control Plane** | API, auth, queue (Laravel hiện tại). |
| **Universe Manager** | Quản lý vòng đời universe, fork, snapshot. |
| **Messaging** | Kafka (event stream đã có), Redis (state/cache), tùy chọn NATS (node coordination). |
| **Cross-shard events** | Event xảy ra ở shard A ảnh hưởng zone ở shard B → gửi qua message bus; worker B áp dụng khi nhận. |

## Sharding mô hình

- **Spatial partition**: map zone_id → shard_id (ví dụ zone_id % num_shards).
- **Ghost zones**: mỗi worker giữ bản sao read-only (hoặc bounded stale) của zones nằm ở shard khác nhưng là neighbor của zones local. Cập nhật ghost qua message (event-driven hoặc periodic sync).
- **64 shards**: số lượng tùy chọn; có thể bắt đầu với ít shard (4–8) để kiểm thử.

## Giao thức

- **Laravel → Worker**: REST hoặc gRPC (advance request với state input).
- **Worker → Laravel**: snapshot + metrics (HTTP callback hoặc queue).
- **Worker ↔ Worker**: qua Kafka/Redis pub-sub (cross-shard events, ghost updates).

## Trạng thái hiện tại

- Single-node: toàn bộ advance chạy trên một process (Laravel + Rust engine).
- Chưa có shard, ghost zones, worker cluster. Khi cần scale, triển khai theo doc này và ADR bổ sung.

## Tham chiếu

- [WORLDOS_ARCHITECTURE_MAPPING.md](WORLDOS_ARCHITECTURE_MAPPING.md) §28
- [RÀ_SOÁT_TMP.md](../../docs/RÀ_SOÁT_TMP.md) mục 3 (Distributed runtime)
