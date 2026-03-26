---
name: approve-daily-reports
description: Skill tự động đăng nhập vào vietnamtourist.app và duyệt tất cả báo cáo công việc chưa xác nhận cho nhân viên.
metadata:
  version: "1.0"
---

# Hướng dẫn sử dụng Skill Approve Daily Reports

Skill này giúp tự động hóa quy trình kiểm tra và phê duyệt các báo cáo công việc hàng ngày trên hệ thống Vietnam Tourist.

## Cấu hình (Bắt buộc)
Skill này yêu cầu thông tin tài khoản từ file `.env` đặt tại gốc dự án hoặc trong thư mục skill.
Thông tin cần thiết:
```env
VIETNAMTOURIST_EMAIL=your_email@vietnamtouristvn.vn
VIETNAMTOURIST_PASSWORD=your_password
```

## Quy trình thực hiện
Khi được kích hoạt, Agent sẽ thực hiện các bước sau:

1. **Đọc cấu hình**: Tìm nạp `VIETNAMTOURIST_EMAIL` và `VIETNAMTOURIST_PASSWORD`. Nếu không thấy, yêu cầu người dùng cung cấp.
2. **Đăng nhập**:
   - Truy cập `https://vietnamtourist.app/login`.
   - Nhập thông tin tài khoản và nhấn Đăng nhập.
3. **Truy cập trang duyệt báo cáo**:
   - Chuyển hướng đến `https://vietnamtourist.app/staff/task/report/approve`.
4. **Xử lý báo cáo**:
   - Tìm tất cả các báo cáo có trạng thái "Chưa xác nhận" (hoặc "Mới tạo").
   - Thực hiện thao tác xác nhận cho từng báo cáo.
5. **Thông báo**:
   - Tổng kết số lượng báo cáo đã duyệt thành công qua tin nhắn chat.

## Lưu ý
- Nếu không có báo cáo nào cần duyệt, chỉ cần thông báo "Không có báo cáo nào cần duyệt".
- Chụp ảnh màn hình dashboard và trang duyệt báo cáo để lưu vết nếu cần thiết.
