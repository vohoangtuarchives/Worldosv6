# User Stories (Suy luận từ Codebase)

Dưới đây là các User Story đại diện cho các tính năng đã được triển khai trong hệ thống WorldOS V6.

## 1. Nhóm Quản lý Mô phỏng (Simulation Control)
- **US 1**: Là một Người quan sát, tôi muốn tiến mô phỏng theo từng Tick để có thể theo dõi sự thay đổi chi tiết của vũ trụ.
    - *AC*: Hệ thống phải gọi được Rust Engine và cập nhật State Vector sau mỗi tick.
- **US 2**: Là một Người quan sát, tôi muốn tạm dừng mô phỏng khi Entropy quá cao để ngăn chặn sự sụp đổ tức thời của vũ trụ.
    - *AC*: Trạng thái Universe phải chuyển sang `paused` và dừng các tiến trình background.

## 2. Nhóm Tiến hóa Lịch sử (Evolution & Epochs)
- **US 3**: Là một Người quan sát, tôi muốn vũ trụ tự động chuyển sang kỷ nguyên mới khi trình độ công nghệ đạt ngưỡng cần thiết.
    - *AC*: `EpochEngine` phải xác định chính xác thời điểm `should_transition` và áp dụng đúng `axiom_modifiers`.
- **US 4**: Là một Người quan sát, tôi muốn nhận được thông báo về các biến cố "Thiên Đạo" khi có sự thay đổi kỷ nguyên.
    - *AC*: Một `BranchEvent` loại `epoch_transition` phải được tạo ra với mô tả chi tiết.

## 3. Nhóm Nội dung & Biên niên sử (Narrative)
- **US 5**: Là một Người quan sát, tôi muốn đọc các bản tóm tắt lịch sử bằng ngôn ngữ tự nhiên thay vì nhìn vào các con số raw data.
    - *AC*: Hệ thống phải tổng hợp dữ liệu Snapshot thành các thực thể `Chronicle`.
- **US 6**: Là một Người quan sát, tôi muốn theo dõi "vết sẹo thần thoại" của một vũ trụ để hiểu rõ những thảm họa trong quá khứ đã định hình thực tại như thế nào.
    - *AC*: API phải cung cấp danh sách `Myth Scars` liên kết với các sự kiện lớn.

## 4. Nhóm Tác nhân & Xã hội (Actors & Factions)
- **US 7**: Là một Người quan sát, tôi muốn xem các quyết định quan trọng của một anh hùng (Hero) cụ thể để hiểu động lực của họ.
    - *AC*: API Actor phải trả về danh sách `Agent Decisions` kèm theo `Impact` score.
