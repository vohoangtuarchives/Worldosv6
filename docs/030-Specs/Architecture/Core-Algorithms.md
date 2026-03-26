# Các Thuật toán Lõi (Core Algorithms)

## 1. Epoch Engine (Động cơ Kỷ nguyên)
**Vai trò**: Quản lý sự tiến hóa vĩ mô của vũ trụ thông qua việc xác định thời điểm và hình thức chuyển giao giữa các thời đại (Epochs).

### Quy trình xử lý:
1. **Thu thập chỉ số**: Hệ thống trích xuất `stateVector` từ snapshot hiện tại (Entropy, Stability, Tech Level, Population).
2. **Đánh giá DSL**: Sử dụng `RuleVmService` để chạy file `epochs.dsl`, kiểm tra điều kiện `should_transition`.
3. **Xác định chủ đề (Theme)**: Nếu điều kiện thỏa mãn, hệ thống dựa trên các chỉ số để chọn Kỷ nguyên tiếp theo:
    - **Age of Chaos**: Khi Entropy > 0.8.
    - **Age of Enlightenment**: Khi Innovation > 0.7.
    - **Age of Order**: Trạng thái mặc định hoặc khi độ ổn định cao.
4. **Thực thi chuyển giao**: Gọi `TransitionEpochAction` để cập nhật database, ghi biên niên sử và phát sự kiện `EpochTransitioned`.

### Công thức modifiers:
Mỗi kỷ nguyên sẽ áp dụng các hệ số nhân (Axiom Modifiers) lên quy luật vật lý/xã hội, ví dụ: `innovation_rate`, `entropy_rate`, `stability_bonus`.

---

## 2. Prophecy Engine (Động cơ Tiên tri)
**Vai trò**: Dự báo các kịch bản tương lai tiềm năng, tạo ra nội dung phong phú cho Narrative Pipeline.

### Các kịch bản dự báo:
- **Lời Nguyền Hỗn Loạn (Cataclysm)**: Kích hoạt khi `Entropy` cao (>0.7) và `Stability` thấp (<0.4). Xác suất xảy ra ~65%.
- **Khải Huyền Thăng Hoa (Ascension)**: Kích hoạt khi `Tech Level` cao (>0.6) và `Stability` tốt (>0.6). Xác suất ~45%.
- **Dòng Thời Gian Tĩnh Lặng (Stagnation)**: Kịch bản mặc định khi không có biến động lớn. Xác suất ~90%.

### Ảnh hưởng:
Các lời tiên tri được ghi vào `Chronicle` với type `prophecy`, giúp Người quan sát chuẩn bị cho các biến cố sắp tới hoặc can thiệp để thay đổi dòng thời gian.
