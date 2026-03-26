# Simulation Engine (Rust) - Phân tích Chuyên sâu

## 1. Vai trò (Scope)
Simulation Engine là "trái tim" tính toán của WorldOS V6. Được viết bằng Rust để đảm bảo hiệu suất tối đa, engine này xử lý hàng nghìn thực thể và sự kiện trong mỗi Tick mô phỏng mà không làm nghẽn hệ thống.

## 2. Kiến trúc Workspace (Cargo)
Dự án được tổ chức dưới dạng Rust Workspace với 3 thành phần chính:
- **`worldos-core`**: Chứa logic lõi của mô phỏng, quản lý bộ nhớ trạng thái (`WorldState`) và vòng đời của các thực thể.
- **`worldos-rules`**: Thực thi các quy luật vật lý và xã hội. Đây là nơi các "Axioms" được chuyển hóa thành mã máy hiệu năng cao.
- **`worldos-grpc`**: Lớp giao tiếp (Interface Layer). Ban đầu sử dụng gRPC, sau đó được mở rộng/chuyển đổi sang HTTP/JSON để tương thích tốt hơn với môi trường PHP/Laravel mà vẫn giữ được tốc độ.

## 3. Cơ chế Tính toán (Calculation Pipeline)
Mỗi khi nhận được lệnh `Advance` từ Backend:
1. **Deserialization**: Chuyển đổi trạng thái từ JSON (Laravel) sang các cấu trúc dữ liệu Rust hiệu quả.
2. **Parallel Processing**: Sử dụng thư viện `Rayon` hoặc `Tokio` để tính toán song song các hành vi của Actors và phản ứng vật chất.
3. **Causality Verification**: Đảm bảo các thay đổi không vi phạm tính nhân quả (Causal Integrity).
4. **Snapshot Generation**: Trả về một Delta-Snapshot chứa các thay đổi của Tick đó.

## 4. Giao tiếp Backend-Engine
- **Protocol**: gRPC (Protobuf) hoặc HTTP (JSON) tùy cấu hình.
- **Port mặc định**: `50051`.
- **Bridge**: Laravel Backend đóng vai trò là Client, gửi Context và nhận về kết quả tính toán để lưu trữ vào DB (PostgreSQL/TimescaleDB).

## 5. Hiệu năng & Tối ưu
- **Memory Safety**: Tận dụng triệt để trình quản lý bộ nhớ của Rust để tránh rò rỉ khi chạy mô phỏng dài hạn.
- **Zero-Copy**: Cố gắng giảm thiểu việc sao chép dữ liệu giữa các lớp để đạt tốc độ xử lý hàng trăm Tick mỗi giây.
