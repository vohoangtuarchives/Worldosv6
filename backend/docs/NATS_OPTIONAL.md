# NATS (Doc §2, RÀ_SOÁT_TMP mục 2)

**NATS** được đề xuất trong tmp.md cho messaging ngoài Kafka: node coordination, distributed scheduler → worker.

## Trạng thái

- **Hiện tại:** Không dùng NATS. Scheduler chạy trong Laravel (queue jobs, Redis); Kafka (Redpanda) dùng cho event stream (Phase 1).
- **Kết luận:** **NATS không bắt buộc** cho single-node. Laravel queue + Redis (+ Kafka cho event stream) đủ.

## Khi nào cân nhắc NATS

- **Multi-node:** Nhiều worker node cần nhận lệnh advance từ một scheduler; publish/subscribe giữa nodes (heartbeat, shard assignment, cross-shard events). NATS phù hợp cho request-reply hoặc pub/sub nhẹ.
- **Lựa chọn:** Có thể dùng Kafka (đã có) cho cả event stream và job dispatch; hoặc thêm NATS riêng cho control channel (scheduler → worker) nếu muốn tách biệt.

## Tích hợp tương lai (nếu cần)

- Driver `worldos.messaging.driver`: `laravel` | `nats`.
- Khi `nats`: scheduler publish job lên subject `worldos.advance.{universe_id}`; worker subscribe và gọi advance, sau đó publish result hoặc callback Laravel.

Tham chiếu: [WORLDOS_ARCHITECTURE_MAPPING.md](WORLDOS_ARCHITECTURE_MAPPING.md) §2, [RÀ_SOÁT_TMP.md](../../docs/RÀ_SOÁT_TMP.md).
