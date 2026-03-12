# Simulation Intelligence Layer (Causality & Emergence)

Tài liệu này định nghĩa thiết kế và nguyên lý hoạt động của **Simulation Intelligence Layer** trong hệ thống WorldOS, tập trung vào hai yếu điểm chính: **Human-like Causality (Tính nhân quả)** và **Macro Emergence (Sự nổi lên của các hình thái vĩ mô)**.

---

## 1. Mục tiêu (Objective)

Hệ thống WorldOS không chỉ là "chạy random events". Tầng Intelligence được thiết kế để:
1.  **Causality (Nhân quả):** Mọi sự kiện vĩ mô (chiến tranh, sụp đổ kinh tế, đổi mới công nghệ) đều phải có nguồn gốc từ chuỗi tác động vi mô (Micro interactions). Không có sự kiện "từ trên trời rơi xuống" mà không có dấu vết nhân quả trước đó.
2.  **Emergence (Tính hợp trội/Nổi lên):** Các thực thể cấp cao (Civilization Archetype, Khủng hoảng, Kỷ nguyên) tự thân hình thành thông qua sự tương tác phức tạp của hàng vạn Actor (Cá nhân, tổ chức nhỏ), thay vì được hardcode theo một kịch bản cố định.

---

## 2. Kiến trúc Causality (Chuỗi Nhân Quả)

### Từ Vi mô đến Vĩ mô (Bottom-up Causality)
-   **Micro Actions:** Ở tầng đáy, các Actor (cá thể/gia đình) tương tác thông qua `ZoneActorIndex`. Việc tích hợp Memory Indexing cho phép hệ thống tra cứu nhanh các mối quan hệ (bạn bè, kẻ thù, nợ nần) trong từng cell không gian (`Zone`).
-   **Local Aggregation:** Những bất mãn (dissatisfaction) cục bộ hoặc thành tựu rải rác tạo ra các **Activity Signals** (`chaos_level`, `wealth_accumulation`).
-   **Macro Drivers:** Các Engine cấp cao hơn (`DecisionEngine`, `WarEngine`) đọc các signals này thay vì đọc trực tiếp state của từng Actor. Nếu `chaos_level` vượt ngưỡng, tỷ lệ xảy ra bạo loạn tăng lên. Sự kiện bạo loạn (Macro Event) chính là kết quả tất yếu (Causality) của bất mãn tích tụ (Micro Actions).

### Phản hồi Vĩ mô xuống Vi mô (Top-down Causality)
-   Khi một Macro Event xảy ra (VD: Đại hỏa hoạn, Đổi chế độ), nó tác động ngược lại **State Vector** của vũ trụ.
-   Các thông số vĩ mô như *Pressure*, *Instability* đè nặng lên các quy tắc hành vi của Actor ở lượt (tick) tiếp theo, làm thay đổi bộ trọng số hành động của họ (thêm stress, thay đổi nhu cầu sinh tồn).

---

## 3. Kiến trúc Emergence (Tính Hợp Trội)

Emergence là sự xuất hiện của cấu trúc trật tự phức tạp từ các thành phần đơn giản.

### 3.1. Nhận diện Hình thái (Archetype Discovery)
WorldOS sử dụng **Possibility Space Navigator** (nằm trong `DecisionEngine`) để theo dõi các thông số sinh thái (Survival, Power, Wealth, Knowledge, Meaning).
-   Hệ thống không cố tình ép một vũ trụ trở thành "Thương quốc" (Merchant Republic). Thay vào đó, nó **nhận diện** (detect) xem vector trạng thái hiện tại đang gần với Archetype nào nhất thông qua tính toán khoảng cách Euclidean trong không gian 5D.
-   **Novelty (Độ mới lạ):** Nếu hệ thống tự trôi xa khỏi tất cả các Archetype đã biết (Distance > $0.35$), hệ thống tự động gắn nhãn "Novel Archetype". Đây là minh chứng rõ nhất của Emergence.

### 3.2. Cơ chế phân nhánh (Forking as Adaptive Emergence)
Khi mức độ phức tạp (Complexity) và áp lực lên hệ thống vượt qua khả năng chứa đựng của cấu trúc hiện tại (Entropy cao):
-   Hệ thống sẽ **Fork** (phân nhánh). Ở điểm phân nhánh, hai thực tại tách ra làm các phép thử dị biệt.
-   Sự tiến hóa của các vũ trụ song song tạo ra một cây "Multiverse", nơi các nhánh chết đi (Archive) do thiếu Complexity/Novelty, và các nhánh mạnh (sức bền cấu trúc cao - SCI) tiếp tục phát triển.

---

## 4. Công cụ Đo lường và Thực thi

Tầng Simulation Intelligence phụ thuộc vào các module sau để hiện thực hóa:
1.  **ZoneActorIndex (Rust/Memory):** Xây dựng đồ thị nhân quả cục bộ, đảm bảo tính liên kết xã hội ở vi mô.
2.  **Adaptive Scheduler:** Đẩy nhanh tốc độ xử lý của các Engine đang ở "điểm nóng" (VD: đang có chiến tranh thì War Engine chạy 1 tick / giây thay vì 10 tick / giây).
3.  **DecisionEngine (Possibility Space Navigator):** Chấm điểm Novelty, Complexity, và Divergence để quyết định số phận vĩ mô (Fork, Archive, hay Continue).
4.  **BranchEventRepository:** Lưu trữ điểm phân kỳ của các chuỗi nhân quả, truy vết lý do tại sao một thực tại sụp đổ dựa vào lịch sử sự kiện (Saga events).
