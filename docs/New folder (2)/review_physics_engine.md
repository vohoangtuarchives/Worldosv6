# Review Session 2: Physics & Reality Engine (Audit Report)

## 1. Trái tim của hệ thống: Rust-gRPC Bridge

Hệ thống tính toán thực tại không nằm trong PHP mà được ủy nhiệm (delegate) cho một **Engine Rust** hiệu năng cao qua gRPC.

### 1.1. gRPC Interface (`GrpcSimulationEngineClient.php`)
- **Phân tách trách nhiệm**: Laravel chuẩn bị bối cảnh (Context), Rust thực hiện tính toán song song (Parallel computation).
- **Cơ sở hạ tầng**: Sử dụng Protobuf để định nghĩa các yêu cầu nâng cao:
    - `ProcessActorsSoa`: Xử lý hàng loạt thực thể (Hunger, Energy, Fear) theo mô hình **Structure of Arrays (SoA)** — tối ưu hóa bộ nhớ CPU cache.
    - `AnalyzeTrajectory`: Tích hợp các thuật toán Chaos Theory (Lyapunov estimate) để dự báo độ ổn định của vũ trụ.
    - `EvaluateRules`: Thực thi **RuleVM (DSL)** trực tiếp trong Rust để đạt tốc độ tối đa.

---

## 2. Quản lý Trạng thái & Persistence

### 2.1. TimescaleDB Hypertable
- **Phát hiện quan trọng**: Hệ thống sử dụng **TimescaleDB** để lưu trữ `universe_snapshots`.
- **Lợi ích**: 
    - Cho phép truy vấn ngược dòng thời gian (Time-travel query) cực nhanh.
    - Tự động phân mảng (Partitioning) dữ liệu theo Tick, giúp bảng không bị phình to làm chậm hệ thống.
    - Nén dữ liệu (Compression) tự động cho các tick cũ.

### 2.2. Snapshot Manager & Virtual Snapshots
- **Cơ chế Tiết kiệm**: Không phải tick nào cũng được lưu vào DB. Hệ thống sử dụng `snapshot_interval`.
- **Virtual Snapshot**: Các tick trung gian được giữ trong bộ nhớ (Memory-only) dưới dạng đối tượng POPO (Plain Old PHP Object), chỉ tick chính mới được ghi xuống đĩa.

---

## 3. Review về Độ chính xác (Arithmetic Precision)

### ⚠️ Quan sát về Floating Point Drift
Qua audit file `ThermodynamicPhaseEngine.php` và các engine khác:
1. **Kiểu dữ liệu**: Hệ thống sử dụng `double` (float64) trong gRPC và `(float)` trong PHP.
2. **Rủi ro**: Với các mô phỏng chạy hàng triệu tick, sai số tích lũy (Cumulative rounding errors) là không thể tránh khỏi.
3. **Cơ chế chống đỡ**:
    - **Simulation Throttling**: Tự động bỏ qua các engine không quan trọng (Cosmetic/Stochastic) nếu quá thời gian xử lý cho phép.
    - **State Rollback**: `SimulationKernel` có cơ chế rollback toàn bộ trạng thái nếu việc giải quyết hiệu ứng (Effect Resolution) thất bại, đảm bảo tính nhất quán (Consistency).

---

## 4. Kết luận Session 2
Hệ thống vật lý của WorldOS v6 được xây dựng trên những công nghệ "State-of-the-art" (Rust, gRPC, TimescaleDB). Điểm cần lưu ý duy nhất là sự phụ thuộc vào độ chính xác của số thực (Floating point).

> [!TIP]
> **Next Step**: Chuyển sang **Session 3: Narrative & Social Layer** để review cách AI "dệt" nên câu chuyện từ những con số vật lý này.
