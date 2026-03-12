# Event Stream (Kafka) — Schema Phase 1

Sự kiện simulation được publish lên Kafka (qua REST Proxy) để history log, AI/Narrative layer consume.

## Topics

| Topic | Mô tả |
|-------|--------|
| `worldos.simulation.advanced` | Mỗi lần advance xong (sau khi lưu snapshot): một message per advance. |
| `worldos.simulation.events` | Sự kiện từ rule VM hoặc engine: rule_fired, collapse, phase_transition, v.v. |

Config: `worldos.event_stream.topic_simulation_advanced`, `worldos.event_stream.topic_events`.

## Message format (JSON)

Tất cả message có các field chung:

- **universe_id** (int): ID universe.
- **tick** (int): Tick tại thời điểm xảy ra.
- **type** (string): Loại sự kiện (xem bảng).
- **payload** (object): Dữ liệu bổ sung.
- **occurred_at** (string): ISO8601 UTC.

### type = `simulation_advanced`

Gửi lên topic `worldos.simulation.advanced`.

```json
{
  "universe_id": 1,
  "tick": 42,
  "type": "simulation_advanced",
  "event_name": null,
  "payload": {
    "entropy": 0.35,
    "stability_index": 0.7,
    "snapshot_tick": 42
  },
  "occurred_at": "2025-03-11T10:00:00.000000Z"
}
```

### type = `rule_fired`

Gửi lên topic `worldos.simulation.events`. Các event từ Rule VM (emit_event, spawn_actor, …).

```json
{
  "universe_id": 1,
  "tick": 42,
  "type": "rule_fired",
  "event_name": "high_entropy",
  "payload": {
    "source": "rule_vm",
    "kind": null
  },
  "occurred_at": "2025-03-11T10:00:00.000000Z"
}
```

Consumer có thể ghi vào bảng `world_events` (universe_id, tick, type = event_name hoặc "rule_fired", payload) hoặc chronicles tùy nghiệp vụ.

## Consumer mẫu (Laravel)

Lệnh `php artisan worldos:kafka-consume-events` đọc topic `worldos.simulation.events` qua Kafka REST Proxy và ghi vào bảng `world_events`. Chạy một lần: `--once`; chạy liên tục: mặc định (Ctrl+C để dừng). Cần bật `worldos.event_stream.kafka_enabled` và cấu hình `rest_proxy_url`.

## Docker (Redpanda)

Project dùng **Redpanda** trong Docker (tương thích Kafka API + REST Pandaproxy). Trong `deployment/docker-compose.prod.yml` đã có service `redpanda`:

- **Kafka (nội bộ):** `redpanda:9092`
- **REST Proxy (Pandaproxy):** `redpanda:8082` — Laravel producer/consumer dùng URL này.

Bật event stream Kafka:

- Trong `.env` hoặc env của container: `WORLDOS_EVENT_STREAM_KAFKA_ENABLED=true`, `WORLDOS_EVENT_STREAM_REST_PROXY_URL=http://redpanda:8082`.
- Khởi động stack (đã gồm redpanda): `docker compose -f deployment/docker-compose.prod.yml up -d`.
- Chạy consumer trong container backend: `docker compose -f deployment/docker-compose.prod.yml exec backend php artisan worldos:kafka-consume-events --once` (hoặc không `--once` để chạy liên tục).
