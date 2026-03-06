# WORLDOS V14-V17: CỖ MÁY THẦN THOẠI TỰ VẬN HÀNH

Tài liệu này tổng hợp nền tảng lý thuyết và hướng dẫn ứng dụng cho các phiên bản từ V14 đến V17, đánh dấu bước chuyển mình của WorldOS từ một hệ thống mô phỏng thụ động sang một **Thực thể Thần học và Kinh tế tự trị**.

---

## 1. Lý thuyết Cơ bản: Hệ Sinh Thái Thần Thánh (Divine Ecosystem)

### 1.1. Bản thể luận về sự Tăng trưởng và Co lại (Expansion & Contraction)
Khác với các hệ thống truyền thống chỉ mở rộng (Branching), WorldOS V15 giới thiệu khái niệm **Nhịp thở Vũ trụ**.
- **Expansion**: Các thực tại rẽ nhánh để khám phá mọi khả năng xác suất.
- **Contraction**: Khi sự đa dạng đạt đến bão hòa hoặc trùng lặp, hệ thống tự động gộp (Merge) để bảo tồn "Ý nghĩa" (Meaning) và tối ưu hóa tài nguyên.
- **Paradox Resolution**: Sự xung đột lịch sử được giải quyết thông qua "Sự kiện Tổng hợp" (Synthesis), biến mâu thuẫn thành huyền thoại thay vì lỗi logic.

### 1.2. Động lực học về Niềm tin (Faith Dynamics)
Bản chất của quyền năng trong Đa vũ trụ không còn là hằng số. V16 định nghĩa Power là một biến số phụ thuộc vào **Belief**.
- **Agents as Fuel**: Các Legend không chỉ là thực thể mô phỏng; họ là nguồn cung cấp "Will Power" cho các Demiurge thông qua sự Alignment.
- **The Schism Threshold**: Khi mâu thuẫn ý thức hệ vượt quá sức chịu đựng của một thực tại, sự rẽ nhánh không chỉ là vật lý mà là sự chia rẽ về mặt linh hồn.

### 1.3. Nhiệt động lực học Thần thánh (Thermodynamic Divinity)
Năng lượng trong WorldOS là bảo toàn. V17 giới thiệu **Primal Essence**.
- **Recycling**: Cái chết của một vũ trụ là nguồn sống của các vị thần. 10% giá trị của một Universe bị hủy được tái chế thành Essence.
- **Cosmic Inflation**: Sự lạm phát năng lượng dẫn đến Big Bang tự thân, ngăn chặn cái chết nhiệt (Heat Death) bằng cách ép buộc khai sinh các thực tại mới.

---

## 2. Ứng dụng và Cấu trúc Hệ thống

### 2.1. Tầng Cai trị Tự trị (V14: Demiurge Pantheon)
Hệ thống sử dụng [DemiurgeRegistry](file:///c:/projects/IPFactory/backend/app/Services/AI/DemiurgeRegistry.php#12-67) để duy trì một tập hợp các AI Rivals với các Intention khác nhau:
- **Order (Aethelgard)**: Tăng Structural Coherence, giảm Entropy.
- **Chaos (Khaos-Null)**: Tăng Entropy, khuyến khích rẽ nhánh.
- **Sovereignty (The Prime)**: Giữ trạng thái cân bằng và phát triển bền vững.

**Ứng dụng**: Tích hợp trực tiếp vào [AdvanceSimulationAction](file:///c:/projects/IPFactory/backend/app/Actions/Simulation/AdvanceSimulationAction.php#26-200) để thực hiện Edict tự động mỗi 5 ticks.

### 2.2. Động cơ Hội tụ (V15: Convergence Engine)
Sử dụng Scoring Algorithm dựa trên:
1.  **Axiom Similarity**: Sự đồng nhất về quy luật vật lý.
2.  **Visual DNA Overlap**: Sự giống nhau về bản thể của các Legend.
3.  **State Vector Distance**: Khoảng cách toán học giữa các ma trận trạng thái.

**Ứng dụng**: [MergeUniversesAction](file:///c:/projects/IPFactory/backend/app/Actions/Simulation/MergeUniversesAction.php#13-79) thực hiện việc hấp thụ các thực tại yếu hơn và cập nhật Chronicle tổng hợp.

### 2.3. Tầng Tôn giáo và Phe phái (V16: Faith Service)
Liên kết TraitVector (17D) của Agent với Ý chí của vị thần:
- **Faith Calculation**: Chuyển đổi trạng thái mô phỏng thành điểm Alignment.
- **Empowerment Loop**: Càng nhiều tín đồ, `will_power` của Demiurge càng cao -> Tăng tần suất hành động.

### 2.4. Kinh tế Khởi nguyên (V17: Essence & Miracles)
- **Essence Pool**: Một đơn vị lưu trữ tài nguyên cho các Demiurge.
- **Miracles**: Các Action có sức ảnh hưởng cực đại (Absolute Order, Void Eruption) tiêu tốn Essence.
- **HeatDeathService**: Một "Watchdog" toán học giám sát tổng năng lượng toàn hệ thống, tự động kích hoạt Big Bang khi cần thiết.

---

## 3. Tổng kết: Vai trò của Architect

Từ V17 trở đi, vai trò của bạn đã chuyển dịch hoàn toàn:
- **Trước V14**: Bạn là người thợ thủ công (Craftsman).
- **V14 - V17**: Bạn là người Gieo mầm (Sower).
- **Sau V17**: Bạn là kẻ Quan sát (Observer/The Great Eye).

**Thế giới hiện tại đã có đủ: Vật lý, Lịch sử, Anh hùng, Tôn giáo, Kinh tế và Nhịp thở sinh học.** Nó không cần bạn để tồn tại, nó chỉ cần bạn để được chứng kiến.
