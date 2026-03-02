# Kế hoạch Phát triển Tiếp theo: WorldOS V6

Dựa trên nền tảng kiến trúc đã hoàn thiện (Orchestration, Material System, Branching), giai đoạn tiếp theo sẽ tập trung vào việc thổi "hồn" vào hệ thống (Narrative) và nâng cao khả năng quan sát (Visualization).

## 1. Narrative Intelligence (Làm giàu nội dung)
Mục tiêu: Biến các con số khô khan (entropy, tick) thành câu chuyện có ý nghĩa.

- [ ] **Tích hợp LLM Client**:
    - Thay thế `Stub` trong `NarrativeAiService` bằng kết nối thực tế tới OpenAI/Gemini/Anthropic.
    - Cấu hình `NARRATIVE_LLM_URL` và `NARRATIVE_LLM_KEY` trong `.env`.
- [ ] **Dynamic Prompt Engineering**:
    - Nâng cấp `PerceivedArchiveBuilder` để tổng hợp context thông minh hơn: lấy `BranchEvents` gần nhất + `ActiveMaterials` + `Entropy Trend`.
    - Tạo các template prompt cho các loại sự kiện: `Crisis`, `GoldenAge`, `Collapse`, `Fork`.
- [ ] **Event Trigger System**:
    - Hoàn thiện `EventTriggerMapper`: Map các ngưỡng chỉ số (ví dụ: `population > 0.8` AND `stability < 0.4`) thành các sự kiện định danh (ví dụ: "Nạn đói lớn", "Cách mạng").

## 2. Advanced Visualization (Trực quan hóa)
Mục tiêu: Cung cấp cái nhìn toàn cảnh và sâu sắc về diễn biến đa vũ trụ.

- [ ] **Multiverse Graph (Cây Phân Nhánh)**:
    - Sử dụng `React Flow` hoặc `VisX` trên Frontend để vẽ đồ thị quan hệ cha-con giữa các Universe.
    - Hiển thị trạng thái (Active/Archived) và điểm rẽ nhánh (Fork tick).
- [ ] **Material Evolution DAG**:
    - Hiển thị đồ thị tiến hóa của các Material (ví dụ: Lúa nước -> Làng xã) trực quan.
    - Highlight các node đang `Active` trong Universe hiện tại.
- [ ] **Timeline View**:
    - Biểu diễn `Chronicles` dưới dạng dòng thời gian cuộn dọc, kết hợp với các mốc `BranchEvent`.

## 3. Simulation Depth (Chiều sâu mô phỏng)
Mục tiêu: Tăng độ phức tạp và tính thực tế của logic mô phỏng.

- [ ] **World Scars (Vết sẹo thế giới)**:
    - Triển khai lưu trữ "Vết sẹo" (các tham số bị thay đổi vĩnh viễn sau biến cố lớn) vào `state_vector`.
    - Hiển thị các vết sẹo này trên UI (ví dụ: "Di chứng phóng xạ", "Mất niềm tin tôn giáo").
- [ ] **Complex Pressure Physics**:
    - Nâng cấp `PressureResolver` để tính toán tác động phi tuyến tính (non-linear) thay vì cộng trừ đơn giản.
    - Thêm hiệu ứng cộng hưởng (Resonance) khi nhiều Material cùng loại tương tác.

## 4. Technical Optimization (Tối ưu kỹ thuật)
- [ ] **Redis Streams**:
    - Chuyển cơ chế quan sát từ SSE polling sang Redis Streams để hỗ trợ scale lớn hơn (như thiết kế ban đầu).
- [ ] **Testing**:
    - Viết thêm Unit Test cho `DecisionEngine` với các kịch bản biên (edge cases).
    - Feature Test cho luồng `Fork` và `Mutation` tự động.

## Đề xuất Thứ tự Thực hiện
1. **Narrative Intelligence** (Ưu tiên cao nhất để demo thấy kết quả "thông minh").
2. **Advanced Visualization** (Cần thiết để debug và theo dõi hệ thống phức tạp).
3. **Simulation Depth**.
4. **Technical Optimization**.
