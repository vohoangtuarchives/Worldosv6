# Rà soát tmp.md — Đã làm vs Chưa làm / Có thể làm tiếp

Đối chiếu **tmp.md** (đề xuất ChatGPT) với codebase và [ARCHITECTURE_COMPARISON_AND_REFACTOR.md](ARCHITECTURE_COMPARISON_AND_REFACTOR.md).

---

## Đã làm (khớp tmp.md)

| tmp.md đề xuất | Hiện trạng |
|----------------|------------|
| **4.1 SimulationSupervisor** — chia AdvanceSimulationAction thành Supervisor + EngineDriver, StateSynchronizer, SnapshotManager, RuntimePipeline, EventDispatcher | Đã có: [SimulationSupervisor](../backend/app/Simulation/Supervisor/SimulationSupervisor.php) + 5 service; [AdvanceSimulationAction](../backend/app/Actions/Simulation/AdvanceSimulationAction.php) là facade. |
| **4.2 EngineRegistry** — engine tự đăng ký, không inject từng engine | Đã có: [EngineRegistry](../backend/app/Simulation/EngineRegistry.php), đăng ký qua tag `simulation_engine` + config [worldos.engine_registry.engines](../backend/config/worldos.php). |
| **4.4 Redis State Cache** — Rust → Redis → SnapshotService (interval) → PostgreSQL | Đã có: [StateCacheInterface](../backend/app/Simulation/Contracts/StateCacheInterface.php), Redis/Null, StateSynchronizer ghi cache, EngineDriver ưu tiên đọc cache. |
| **4.5 Kafka Event Bus** — event streaming (collapse, great_person, religion, war) | Đã có: Kafka Phase 1 — Redpanda Docker, producer (SimulationAdvanced, RuleFired), schema [EVENT_STREAM_SCHEMA.md](../backend/docs/EVENT_STREAM_SCHEMA.md), consumer `worldos:kafka-consume-events`. |
| **7. Simulation Stability Engine** (entropy explosion, runaway) | Đã có tương đương: [ChaosEngine](../backend/app/Services/Simulation/ChaosEngine.php) (dampening, throttle, quarantine). |
| Tick frequency / engine order | Đã có: SimulationEngine::tickRate(), EngineRegistry phase+priority; pipeline Stages (actor, culture, …) + interval trong config. |

---

## Chưa làm / Có thể làm tiếp

### 1. SimulationScheduler / Tick Scheduler (tmp §4.3, §2–7)

- **Đề xuất:** Component rõ tên **SimulationScheduler** hoặc **TickScheduler** quản lý tick frequency, engine order, priority (ví dụ Actor every tick, Economy every 5, War every 10).
- **Hiện tại:** Thứ tự và tần suất nằm trong EngineRegistry (phase, priority), SimulationTickPipeline (stageOrder từ TickScheduler), và config tick pipeline. Chưa có một “SimulationScheduler” class tách bạch quản lý universe-level tick assignment.
- **Hành động:** Có thể tách hoặc đặt tên rõ “SimulationScheduler” wrap TickScheduler + EngineRegistry; hoặc giữ nguyên nếu đủ dùng.

### 2. NATS (tmp §16, §messaging)

- **Đề xuất:** Messaging ngoài Kafka: NATS (node coordination, distributed).
- **Hiện tại:** Chỉ Kafka (Redpanda); Laravel queue + Redis Stream.
- **Hành động:** Tùy chọn khi cần multi-node; doc ARCHITECTURE đã ghi “NATS không bắt buộc”.

### 3. Distributed runtime (tmp §15–22, Runtime Infrastructure)

- **Đề xuất:** Worker cluster, Scheduler Node → Worker Nodes, giao tiếp Kafka/Redis/gRPC; 64 shards, ghost zones; Control Plane, Universe Manager, scale cluster.
- **Hiện tại:** Single-node; chưa distributed sharding.
- **Hành động:** Dài hạn; chỉ khi cần “hàng nghìn universe song song”.

### 4. AI Civilization Interpreter / History Narrative Engine (tmp §4.6)

- **Đề xuất:** AI đọc snapshot (entropy, wars, religion, population) → viết narrative (“Year 340: Empire of Talor collapsed…”); History Narrative Engine.
- **Hiện tại:** NarrativeAiService, FaithService có; chưa có “AI Civilization Interpreter” thống nhất đọc snapshot và sinh narrative theo mẫu tmp.
- **Hành động:** Có thể bổ sung service/action gọi LLM với snapshot + template; tùy product.

### 5. Adaptive / Self-Optimizing Scheduler (tmp §18)

- **Đề xuất:** Scheduler tự điều chỉnh engine frequency, tick rate theo trạng thái (vd. war high → WarEngine chạy thường hơn); sau đó Self-Optimizing Simulation Scheduler dùng AI tối ưu runtime.
- **Hiện tại:** Frequency cố định (tickRate, interval config).
- **Hành động:** Nâng cấp sau; cần định nghĩa “adaptive rules” hoặc AI reward.

### 6. Bản đồ 100+ engines (tmp §7, §830+)

- **Đề xuất:** WorldOS Ultimate Architecture — 8 tầng, 100+ engines (Simulation Core, Physical World, Ecological, Population, Civilization, …).
- **Hiện tại:** Khoảng 22 engine trong EngineRegistry; nhiều domain đã có tương đương (Climate, Population, Economy, War, …) nhưng không đủ 100+.
- **Hành động:** Dùng làm bản đồ tham chiếu; thêm engine dần theo nhu cầu, không bắt buộc triển khai hết.

### 7. Snapshot → Object Storage (S3/MinIO) (tmp §10)

- **Đề xuất:** Snapshot lưu S3/MinIO, object storage.
- **Hiện tại:** Snapshot trong PostgreSQL (universe_snapshots).
- **Hành động:** Tùy chọn khi scale; có thể thêm driver snapshot ra S3 cho archive.

### 8. Observability (tmp §13)

- **Đề xuất:** Prometheus, Grafana, OpenTelemetry, Loki; metrics tick_duration, engine_execution_time, event_rate.
- **Hiện tại:** Prometheus endpoint (worldos/metrics) có; Jaeger stub (SimulationTracer::span); chưa đủ dashboard/tracing đầy đủ.
- **Hành động:** Tăng cường metrics + tracing khi cần vận hành production.

### 9. Simulation Intelligence Layer (tmp §9434)

- **Đề xuất:** Tầng Causality, Emergence, Memetic Evolution, Civilization Mind, Scenario — detect patterns, macro phenomena, không chạy simulation trực tiếp.
- **Hiện tại:** Causality (Redis), Emergence (Attractor), Scenario engine có một phần; chưa gom thành “Simulation Intelligence Layer” rõ ràng.
- **Hành động:** Có thể refactor/doc hóa tầng này; không bắt buộc đổi code ngay.

### 10. WorldOS Memory Architecture (tmp §7996+)

- **Đề xuất:** Kiến trúc bộ nhớ quyết định 10x performance, 100k vs 100M agents, tick 2s vs 50ms.
- **Hiện tại:** Chưa có doc/thiết kế riêng “Memory Architecture”.
- **Hành động:** Khi cần tối ưu quy mô lớn; có thể tách plan riêng.

---

## Tóm tắt ưu tiên

| Ưu tiên | Mục | Ghi chú |
|---------|-----|--------|
| Đã xong | Supervisor, EngineRegistry, Redis cache, Kafka Phase 1, ChaosEngine, tick/phase | Khớp tmp.md phần core refactor. |
| Thấp / tùy chọn | NATS, Distributed runtime, 64 shards | Khi scale multi-node. |
| Trung bình | SimulationScheduler (tên/rõ vai trò), AI Civilization Interpreter | Cải thiện rõ ràng, không đổi nhiều. |
| Tham khảo | 100+ engines, Memory Architecture, Adaptive Scheduler | Roadmap; làm dần hoặc khi cần. |

---

## Gợi ý bước tiếp theo

- **Nếu muốn “tiếp theo theo tmp.md” ngắn hạn:** Làm rõ **SimulationScheduler** (class hoặc doc) và/hoặc phác thảo **AI Civilization Interpreter** (service gọi LLM từ snapshot).
- **Nếu ưu tiên vận hành:** Tăng cường **observability** (metrics, tracing, dashboard).
- **Nếu ưu tiên scale:** Lên kế hoạch **distributed runtime** (worker cluster, messaging) và snapshot archive (S3) sau.
