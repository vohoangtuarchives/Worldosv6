# WorldOS V6

Civilizational Dynamics Engine — Kiến trúc & triển khai theo [WORLDOS_V6.md](WORLDOS_V6.md).

## Tự tiến hóa và quan sát

WorldOS V6 mặc định chạy ở chế độ **tự tiến hóa**: thế giới advance theo xung (scheduler `worldos:autonomic-pulse` mỗi phút), fork và sự kiện nảy sinh từ trạng thái mô phỏng (DecisionEngine, criticality). Dashboard dùng để **quan sát** dòng thời gian và đa vũ trụ; can thiệp thủ công (Advance, Fork) chỉ để thí nghiệm hoặc debug.

## Quick Start (Demo V6)

Cách nhanh nhất để trải nghiệm WorldOS V6 với đầy đủ tính năng (Graph, Narrative, Forking, Scars):

1. **Khởi động hệ thống**:
   ```bash
   docker compose up -d
   ```

2. **Chạy kịch bản Demo** (tạo thế giới mẫu; sau đó thế giới tiếp tục **tự tiến hóa** theo scheduler):
   ```bash
   # Build backend container (nếu chưa)
   docker compose build backend

   # Chạy kịch bản: Genesis -> Stability -> Crisis -> Fork
   docker compose exec backend php artisan worldos:demo-scenario
   ```

3. **Quan sát trên Dashboard**:
   - Truy cập: http://localhost:3000
   - Bạn sẽ thấy:
     - **Multiverse Graph**: Hiển thị vũ trụ gốc và nhánh con vừa được tạo (Fork).
     - **Universe Detail**: Chọn vũ trụ gốc (thường là ID mới nhất - 1) để xem:
       - **World Scars**: Huy hiệu "PRE WAR TENSION" màu đỏ.
       - **Chronicles**: Các dòng sử thi do AI sinh ra mô tả khủng hoảng.
       - **Metrics**: Biểu đồ Entropy tăng vọt trước khi phân nhánh.

## Cấu trúc repo

- **backend/** — Laravel (Orchestration, DDD, API)
- **frontend/** — Next.js 16 (Dashboard, Writer UI)
- **engine/** — Rust (Simulation Engine, gRPC server)
- **docs/** — Tài liệu hệ thống
  - [docs/system/](docs/system/) — Tài liệu kỹ thuật (architecture, simulation, narrative, API)
  - **V6 bổ sung**: [Simulation Kernel & Potential Field](docs/system/16-simulation-kernel-and-potential-field.md), [Narrative LLM & Events](docs/system/17-narrative-llm-and-events.md), [Observer & Redis Streams](docs/system/18-observer-and-redis-streams.md), [Frontend Visualization](docs/system/19-frontend-visualization-v6.md)

## Chạy local (Phase 1)

### 1. Cơ sở dữ liệu & Redis

```bash
docker compose up -d
```

### 2. Backend (Laravel)

```bash
cd backend
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```

Hoặc chỉ seed Cosmology + Material: `php artisan db:seed --class=CosmologySeeder` và `php artisan db:seed --class=MaterialSeeder`. Lệnh `php artisan worldos:demo` tạo nhanh Multiverse, World, Saga, Universe mặc định.

API: http://localhost:8000

### 3. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

UI: http://localhost:3000

### 4. Simulation Engine (Rust) — tùy chọn Phase 1

Cần cài [Rust](https://rustup.rs). Sau đó:

```bash
cd engine
cargo run -p worldos-grpc --bin worldos-engine
```

Engine lắng nghe gRPC tại `[::1]:50051` và **HTTP bridge** tại `[::1]:50052`. Để Laravel gọi engine thật qua HTTP: trong `.env` đặt `SIMULATION_ENGINE_GRPC_URL=http://localhost:50052` (hoặc `http://127.0.0.1:50052`). Để trống thì dùng stub (snapshot giả).

## Biến môi trường Backend

- `DB_*` — PostgreSQL (dùng khi chạy `docker compose up`)
- `REDIS_*` — Redis
- `SIMULATION_ENGINE_GRPC_URL` — Địa chỉ engine (vd. `localhost:50051`)

## Đã triển khai

- **Phase 1:** Nền tảng (backend Laravel, frontend Next.js, engine Rust workspace), Cosmology migrations, gRPC .proto, Docker Compose (PostgreSQL, Redis).
- **Phase 2:** Engine Rust: worldos-core (Zone, UniverseState, 3-phase tick, Pressure, Cascade), worldos-grpc server (Advance → tick_with_cascade → snapshot).
- **Phase 3:** Orchestration: Models (World, Universe, Saga, UniverseSnapshot, BranchEvent), UniverseSnapshotRepository, UniverseRuntimeService, SagaService, MetricsExtractor, UniverseEvaluator, DecisionEngine, API `/api/worldos/simulation/advance`, `saga:advance-v3` command.
- **Phase 4:** Material System: bảng materials, material_instances, material_pressures, material_mutations, material_logs; MaterialLifecycleEngine, PressureResolver, MaterialMutationDag, MaterialSeeder (Vietnamese, European, Futuristic).
- **Phase 5:** Narrative: FlavorTextMapper, EventTriggerMapper, ResidualInjector, PerceivedArchiveBuilder, NarrativeAiService; bảng flavor_texts, event_triggers, chronicles.
- **Phase 6:** AnalyticalAiService, SearchAiService, ObserverService (Redis Streams), migration TimescaleDB hypertable (tùy chọn), [docs/system/15-timescaledb-setup.md](docs/system/15-timescaledb-setup.md).
- **Dashboard:** GET sagas, universes, universes/{id}/snapshot; POST simulation/advance, saga/run-batch; nút **Seed demo** (POST demo/seed) khi chưa có saga; lệnh `worldos:demo` và CosmologySeeder.
