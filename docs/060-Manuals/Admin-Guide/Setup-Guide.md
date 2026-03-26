# Hướng dẫn Cài đặt & Onboarding (Setup Guide)

## 1. Chuẩn bị
- Cài đặt **Docker Desktop**.
- Cài đặt **Git**.
- Đảm bảo các cổng `8080`, `5432`, `6379`, `7687` đang trống.

## 2. Các bước cài đặt nhanh
1. **Clone dự án**:
   ```bash
   git clone <repository_url>
   cd IPFactory
   ```
2. **Khởi chạy Docker**:
   ```powershell
   docker compose -f deployment/docker-compose.prod.yml up -d --build
   ```
3. **Kiểm tra trạng thái**:
   Sau khi container `backend` khởi động, nó sẽ tự động chạy migration và seeds. Kiểm tra bằng cách:
   ```powershell
   docker compose -f deployment/docker-compose.prod.yml logs -f backend
   ```
4. **Truy cập Giao diện**:
   Mở trình duyệt: `http://localhost:3000` (Frontend) hoặc `http://localhost:8080` (API Backend).

## 3. Các lệnh hữu ích (Artisan)
Truy cập vào container backend để thực hiện các lệnh:
```powershell
docker compose -f deployment/docker-compose.prod.yml exec backend bash
```
Trong shell, bạn có thể chạy:
- `php artisan worldos:demo-scenario`: Chạy kịch bản mô phỏng mẫu.
- `php artisan test`: Chạy bộ kiểm thử.
- `php artisan migrate:fresh --seed`: Làm sạch và khởi tạo lại dữ liệu.
