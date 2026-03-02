# Kế hoạch Phát triển Toàn diện WorldOS V6 (Spec Mode)

Tài liệu này xác định lộ trình phát triển chi tiết cho dự án WorldOS V6, bao gồm cả Backend, Engine, Narrative và Frontend. Kế hoạch này được thiết kế để thực thi tự chủ, giảm thiểu sự tương tác lặp lại.

## Giai đoạn 1: Simulation Depth & Engine Optimization (Hiện tại - Ưu tiên cao nhất)
**Mục tiêu**: Hoàn thiện logic mô phỏng vật lý, đảm bảo Engine Rust phản ứng chính xác với mọi thay đổi trạng thái và áp lực vật chất.

1.  **Engine State Synchronization (Đã hoàn thành)**:
    - [x] Cập nhật `UniverseState` trong Rust để hỗ trợ `scars`.
    - [x] Cập nhật `UniverseRuntimeService` trong Laravel để gửi cấu trúc `state_vector` chuẩn.
    - [x] Fix lỗi deserialize trong gRPC server.

2.  **Material System (Rust Implementation)**:
    - [ ] Định nghĩa `Material` struct trong Rust (`types.rs`).
    - [ ] Cập nhật `ZoneState` để chứa danh sách `active_materials`.
    - [ ] Implement `PressureResolver` trong `tick()` của Rust:
        - Tính toán tác động của Material lên `entropy`, `stress`, `innovation`.
        - Logic cộng hưởng (Resonance) đơn giản: Nếu có >2 material cùng loại, tăng hiệu ứng 1.5x.

3.  **Cascade Engine Enhancement**:
    - [ ] Mở rộng `CascadeEngine` trong Rust để xử lý chuỗi sự kiện phức tạp hơn (vd: `Famine` -> `Riots` -> `Collapse`).
    - [ ] Thêm logic `Diffusion` (lan truyền) giữa các Zones lân cận (đã có khung, cần tinh chỉnh tham số `beta`).

## Giai đoạn 2: Narrative Intelligence & AI Integration
**Mục tiêu**: Kết nối hệ thống với LLM thực để tạo nội dung sống động.

1.  **LLM Connector**:
    - [ ] Tạo `OpenAINarrativeService` (hoặc adapter tương đương) trong Laravel.
    - [ ] Cấu hình `.env` cho API Key.

2.  **Dynamic Prompt Builder**:
    - [ ] Xây dựng `PerceivedArchiveBuilder` thông minh:
        - Lấy context từ `active_materials` (vd: "Thế giới đang dùng Lúa nước").
        - Lấy context từ `scars` (vd: "Vết sẹo chiến tranh chưa lành").
        - Lấy trend entropy (tăng/giảm).
    - [ ] Tạo template prompt cho các sự kiện: `Crisis`, `GoldenAge`, `Fork`.

3.  **Event Trigger System**:
    - [ ] Implement `EventTriggerMapper` để map chỉ số thành sự kiện định danh.

## Giai đoạn 3: Advanced Visualization (Frontend)
**Mục tiêu**: Hiển thị dữ liệu phức tạp một cách trực quan trên Dashboard.

1.  **Material DAG Visualization**:
    - [ ] Dùng React Flow để vẽ cây tiến hóa Material.
    - [ ] Highlight các node active.

2.  **Timeline & Chronicles View**:
    - [ ] Cải thiện giao diện hiển thị lịch sử sự kiện (timeline dọc).

3.  **Interactive Graph**:
    - [ ] Cho phép click vào node trên Multiverse Graph để xem chi tiết nhanh (Quick View).

## Giai đoạn 4: Technical Optimization & Scaling
**Mục tiêu**: Chuẩn bị cho production.

1.  **Redis Streams**:
    - [ ] Chuyển `ObserverService` sang dùng Redis Streams thay vì Polling.
    - [ ] Cập nhật Frontend `useObserver` hook.

2.  **TimescaleDB Integration**:
    - [ ] Migration bảng `universe_snapshots` sang Hypertable (nếu chưa).

## Lộ trình Thực thi Tự chủ (Autonomous Execution Plan)

Tôi sẽ bắt đầu thực hiện **Giai đoạn 1 (Mục 2: Material System trong Rust)** ngay lập tức, vì đây là yêu cầu ưu tiên của bạn ("uu tien back end va engine").

### Bước tiếp theo: Implement Material System trong Rust
1.  Sửa `engine/worldos-core/src/types.rs`: Thêm struct `Material` và cập nhật `ZoneState`.
2.  Sửa `engine/worldos-core/src/universe.rs`: Cập nhật logic `tick` để tính toán áp lực từ Material.
3.  Rebuild Engine và kiểm thử bằng `worldos:demo-scenario`.
