# Đặc tả Chức năng Nghịch đảo (Reverse-Engineered Specs)

## Tổng quan
Dựa trên cấu trúc codebase hiện tại, WorldOS V6 tập trung vào trải nghiệm "Giám sát tối cao" (Supreme Observation) của người dùng đối với các thực thể mô phỏng.

## 1. Danh sách các Epic (Tính năng lớn)

### Epic 1: Quản lý Đa vũ trụ (Multiverse Management)
- **Mục tiêu**: Cho phép người dùng khởi tạo, phân nhánh và quản lý hàng loạt thực tại khác nhau.
- **Tính năng chính**:
    - Danh sách các Universe với chỉ số Entropy/Stability.
    - Cơ chế Forking (Nhánh hóa) vũ trụ từ một điểm tick cụ thể.
    - Quản lý trạng thái (Active/Paused/Snapshot).

### Epic 2: Động lực học Kỷ nguyên (Era & Epoch Dynamics)
- **Mục tiêu**: Mô phỏng sự thay đổi vĩ mô của lịch sử theo thời gian.
- **Tính năng chính**:
    - Chuyển giao kỷ nguyên tự động (Epoch Transition).
    - Áp dụng các chủ đề (Themes) và quy luật (Axiom Modifiers) mới cho từng thời đại.
    - Lưu giữ di sản (Legacy) giữa các thời đại.

### Epic 3: Hệ thống Biên niên sử (Narrative Pipeline)
- **Mục tiêu**: Biến dữ liệu mô phỏng khô khan thành những câu chuyện có ý nghĩa.
- **Tính năng chính**:
    - Tự động hóa việc ghi chép Chronicle (Biên niên sử).
    - Phân tích vết sẹo thần thoại (Myth Scars) - những biến cố gây tác động sâu sắc.
    - Quản lý hồ sơ Sử gia (Historian Profiles) để thay đổi phong cách ghi chép.

### Epic 4: Trí tuệ Tác nhân (Actor Intelligence)
- **Mục tiêu**: Mô phỏng hành vi của các nhân vật và tổ chức (Institutions).
- **Tính năng chính**:
    - Theo dõi quyết định và hành động của Actors.
    - Mô phỏng các phe phái (Factions) và quan hệ xã hội.
    - Sự trỗi dậy của các thực thể tối cao (Supreme Entities).

## 2. Luồng Người dùng Chính (User Flows)
1. **Khởi tạo & Quan sát**: Tạo Universe -> Chạy simulation -> Xem metrics real-time.
2. **Can thiệp & Phân nhánh**: Phát hiện vấn đề (Entropy cao) -> Fork Universe -> Thay đổi Axioms -> So sánh kết quả.
3. **Nghiên cứu Lịch sử**: Đọc Chronicles của một Actor -> Xem các mốc Epoch -> Phân tích Causal Links (mối quan hệ nhân quả).
