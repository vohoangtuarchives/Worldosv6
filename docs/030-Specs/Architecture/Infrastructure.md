# Tài liệu Hạ tầng (Infrastructure)

## 1. Kiến trúc Containerization
WorldOS V6 sử dụng Docker để đồng bộ hóa môi trường phát triển và triển khai. Toàn bộ các dịch vụ được điều phối thông qua Docker Compose.

## 2. Các Dịch vụ Thành phần
| Dịch vụ | Công nghệ | Vai trò |
| :--- | :--- | :--- |
| **Proxy** | Nginx | Đóng vai trò Reverse Proxy, định tuyến yêu cầu đến Backend và Frontend. |
| **Backend** | PHP 8.4 (Laravel 12) | Xử lý logic nghiệp vụ, quản lý API và database. |
| **Engine** | Rust | Thực hiện các phép tính mô phỏng hiệu suất cao (Core Sim). |
| **Main DB** | PostgreSQL (TimescaleDB) | Lưu trữ dữ liệu quan hệ và chuỗi thời gian (Snapshots). |
| **Graph DB** | Neo4j | Lưu trữ cấu trúc Narrative và các mối quan hệ đồ thị phức tạp. |
| **Cache/Queue** | Redis | Lưu trữ đệm và quản lý hàng đợi tác vụ (Jobs). |
| **Real-time** | Centrifugo | Xử lý các thông điệp WebSocket thời gian thực cho Dashboard. |
| **Event Stream** | Redpanda | (Tùy chọn) Xử lý luồng sự kiện theo mô hình Kafka. |

## 3. Quản lý Mạng (Networking)
Các dịch vụ giao tiếp với nhau trong một mạng nội bộ Docker.
- Backend giao tiếp với Engine qua **gRPC/HTTP** (Port 50052).
- Frontend giao tiếp với Backend qua **REST API** (Port 8080).
- Dữ liệu Real-time được đẩy từ Backend sang Centrifugo và đến Frontend qua WebSocket.
