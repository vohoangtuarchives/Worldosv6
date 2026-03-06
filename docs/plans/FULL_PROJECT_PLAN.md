# Kế hoạch Phát triển Toàn diện WorldOS V6 (Spec Mode)

Tài liệu này xác định lộ trình phát triển chi tiết cho dự án WorldOS V6, bao gồm cả Backend, Engine, Narrative và Frontend. Kế hoạch này được thiết kế để thực thi tự chủ, giảm thiểu sự tương tác lặp lại.

## Giai đoạn 1: Simulation Depth & Engine Optimization (Hiện tại - Ưu tiên cao nhất)
**Mục tiêu**: Hoàn thiện logic mô phỏng vật lý, đảm bảo Engine Rust phản ứng chính xác với mọi thay đổi trạng thái và áp lực vật chất.

1.  **Engine State Synchronization (Đã hoàn thành)**:
    - [x] Cập nhật `UniverseState` trong Rust để hỗ trợ `scars`.
    - [x] Cập nhật `UniverseRuntimeService` trong Laravel để gửi cấu trúc `state_vector` chuẩn.
    - [x] Fix lỗi deserialize trong gRPC server.

2.  **Material System (Rust Implementation)** (Đã hoàn thành):
    - [x] `ZoneState` đã chứa `active_materials`; resonance theo slug (≥2 cùng slug → 1.5x) trong `tick()`.
    - [x] PressureResolver trong `tick()`: tác động lên entropy, order, innovation, growth; material_stress delta từ material.
    - [x] `BETA_DIFFUSION` trong constants; diffusion dùng constant.

3.  **Cascade Engine Enhancement** (Đã hoàn thành):
    - [x] Chuỗi Famine → Riots → Collapse; `CascadePhase` trong ZoneState; SimEvent::Famine/Riots/Collapse.
    - [x] Diffusion beta lấy từ `constants::BETA_DIFFUSION`.

## Giai đoạn 2: Narrative Intelligence & AI Integration
**Mục tiêu**: Kết nối hệ thống với LLM thực để tạo nội dung sống động.

1.  **LLM Connector** (Đã hoàn thành):
    - [x] `OpenAINarrativeService` + `LlmNarrativeClientInterface`; cấu hình `.env`.

2.  **Dynamic Prompt Builder** (Đã hoàn thành):
    - [x] `PerceivedArchiveBuilder`: scars, entropy trend, event_prompt_templates (crisis, golden_age, fork).

3.  **Event Trigger System** (Đã hoàn thành):
    - [x] `EventTriggerMapper`: getMetricValue (root/metrics/pressures), detectTriggeredEvents.

## Giai đoạn 3: Advanced Visualization (Frontend) (Đã hoàn thành)
**Mục tiêu**: Hiển thị dữ liệu phức tạp một cách trực quan trên Dashboard.

1.  **Material DAG Visualization**: [x] React Flow + dagre; legend active/inactive.
2.  **Timeline & Chronicles View**: [x] ChronicleTimelineView với type badges, spacing.
3.  **Interactive Graph**: [x] GraphView Quick View panel khi click node.

## Giai đoạn 4: Technical Optimization & Scaling
**Mục tiêu**: Chuẩn bị cho production.

1.  **Redis Streams** (Đã hoàn thành): [x] ObserverService xAdd/readStream; API GET observer/stream; useObserver hook.
2.  **TimescaleDB Integration**: [x] Migration hypertable `universe_snapshots` đã có.

## Lộ trình Thực thi Tự chủ (Autonomous Execution Plan)

Các Giai đoạn 1–4 đã triển khai xong các hạng mục chính (Rust Material/Cascade, Narrative LLM, Visualization, Observer/Redis). Tài liệu: [docs/system/README.md](../system/README.md).

### Bước tiếp theo (tùy chọn)
- **Review theo giai đoạn** (Potential Field plan): Review 1 sau Tháng 1–3 (MVP), Review 2–4 theo khung 12 tháng.
- **Mở rộng đa dạng**: event_type/material/flavor, narrative genre trong prompt, chỉ số đo đa dạng.
- **Giai đoạn tiếp**: Population layer, Cultural Drift nâng cao, Dynamic topology (nếu cần).
