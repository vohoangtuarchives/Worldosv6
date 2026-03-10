# WorldOS — Bộ tài liệu phát triển hệ thống

Bộ tài liệu này mô tả **WorldOS v3** — kiến trúc simulation-first, IP Foundry. Đây là tài liệu chính thức cho phát triển; các tài liệu cũ nằm ngoài `docs/system/` có thể sai lệch và sẽ bị thay thế dần.

## System Documentation (V3 Standard)

### 1. Foundation (The Stage)
- [01 Architecture Overview](01-architecture-overview.md)
- [02 Core Concepts (World, Universe, Saga)](02-core-concepts.md)
- [03 Simulation Loop](03-simulation-loop.md)

### 2. Physics Layer (The Engine)
- [04 Physics Engine](04-physics-engine.md)
- [08 Governance System](08-governance-system.md)
- [09 Material System](09-material-system.md)
- [16 Simulation Kernel & Potential Field (V6)](16-simulation-kernel-and-potential-field.md) — Kernel effect-based, Potential Field, Time-Scale, Phase Pressure, topology
- [20 Rust Engine: Material & Cascade (V6)](20-rust-engine-material-cascade.md) — Resonance theo slug, material_stress, Famine→Riots→Collapse, BETA_DIFFUSION
- [21 Field-Based Simulation Architecture & Upgrade Path (V6)](21-field-simulation-architecture-and-roadmap.md) — Kiến trúc field-based, ưu điểm, thiếu sót, roadmap nâng cấp, Rust vs Laravel, observability, replay, đánh giá 70–80%

### 3. Narrative Layer (The Story)
- [05 Narrative Engine (Resonance)](05-narrative-engine.md)
- [17 Narrative LLM & Event Triggers (V6)](17-narrative-llm-and-events.md) — LLM connector, EventTriggerMapper, PerceivedArchiveBuilder
- [10 Genre System](10-genre-system.md)
- [11 IP Factory (Feedback Loop)](11-ip-factory.md)
- [12 Narrative Series System](12-narrative-series.md)
- [13 AI Neuro System](13-ai-neuro-system.md)

- [14 Future Roadmap](14-future-roadmap.md)

### 4. Reference & Operations
- [07 API & Metrics](07-api-reference.md)
- [18 Observer & Redis Streams (V6)](18-observer-and-redis-streams.md) — Redis Streams consumer, useObserver hook, TimescaleDB
- [19 Frontend Visualization (V6)](19-frontend-visualization-v6.md) — Material DAG, Timeline/Chronicles, Graph Quick View
- [06 Legacy Systems (Deprecated)](06-legacy-systems.md)
- [Gap Analysis (V3 vs Vision)](../../../../.gemini/antigravity/brain/d7a26bc4-6f03-4186-863d-c6efe75f4980/gap_analysis.md)
- [Foundation Analysis (Rules Check)](../../../../.gemini/antigravity/brain/d7a26bc4-6f03-4186-863d-c6efe75f4980/foundation_analysis.md)

## Nguyên tắc đọc

- **Authority**: Chỉ **Universe** mang runtime (tick, state). World chỉ là rule container. Saga chỉ orchestrate.
- **Snapshot-first**: Mọi tiến hóa ghi `universe_snapshots`; rollback/fork/clone từ snapshot.
- **AI**: Đánh giá và đề xuất mutation qua kernel; không sửa `state_vector` trực tiếp.

## Vị trí code chính (backend)

- Runtime: `App\Domains\Runtime\UniverseRuntimeService`
- Snapshot: `App\Domains\Cosmology\Repositories\UniverseSnapshotRepository`
- Saga orchestrator: `App\Domains\Saga\Services\SagaService`
- Kernel: `App\Domains\Evolution\Kernel\WorldEvolutionKernel`
- AI: `App\Domains\Runtime\Evaluation\*` (MetricsExtractor, UniverseEvaluatorInterface, DecisionEngine)
