# WORLDOS v4 ARCHITECTURE GDD (Game Design Document)
*Core Philosophy: Procedural Civilizational Simulation & AI Narrative Production*

## 1. TỔNG QUAN HỆ TƯ TƯỞNG (The Philosophy)
WorldOS v4 đánh dấu sự chuyển mình từ một "Công cụ nhắc việc viết truyện" thành một **Động cơ Mô phỏng Tiến hóa Văn minh (Civilizational Dynamics Engine)**. Mục tiêu tối thượng không phải là ra lệnh cho AI viết truyện, mà là nuôi dưỡng một vũ trụ sống động, có lịch sử, có vết sẹo ký ức, và để AI đóng vai trò như những "Sử gia mù" quan sát và chắp bút lại những biến cố tự nhiên nảy sinh từ thế giới đó.

### Mô Hình Tách Biệt "Não Trái - Não Phải"
Hệ thống v4 được thiết kế chia làm hai nửa hoàn toàn độc lập, đảm bảo hiệu năng kỹ thuật siêu tốc để có thể vận hành hàng chục năm không gián đoạn:

- **NÃO TRÁI (Simulation Engine - PHP/Laravel): Cỗ Máy Toán Học**
  - Đảm nhiệm việc rèn giũa *Sự Thật* và *Nhân Quả*. 
  - Chạy bằng 100% thuật toán Vector, Xác suất (Stochastic) và Công thức Động lực học.
  - Vô hình, câm lặng nhưng nhanh khủng khiếp. Có thể chạy giả lập hàng vạn năm lịch sử, tính toán hàng triệu mũi vector Áp Lực Xã Hội (Inequality, Entropy, Trauma) chỉ trong vài nhịp dao động của Server.
  - Không sinh ra chữ (Token), chỉ sinh ra "Tín hiệu Sự kiện" (Ví dụ: "Áp lực 0.9 -> Bùng nổ Cách mạng").

- **NÃO PHẢI (IPEngine & Narrative - Cụm AI Local/Cloud): Kẻ Chắp Bút**
  - Đảm nhiệm việc tạo ra *Cảm Xúc* và *Văn Chương*.
  - Nhận "Tín hiệu Sự kiện" khô khan từ Não Trái, kết hợp với các tham số bối cảnh để dệt thành những thiên sử thi bi tráng.
  - AI bị "Bịt mắt" bởi chỉ số *Màn sương Nhận Thức (Epistemic Instability)*. Nó không được thấy Sự thật Tuyệt đối (Canonical Archive) mà chỉ được thấy Lịch sử Bóp méo (Perceived Archive). Điều này ép AI phải sáng tạo thần thoại, dị bản, thuyết âm mưu, tạo ra chiều sâu vô hạn cho tác phẩm.

---

## 2. NHỮNG THAY ĐỔI / SỬA CHỮA ĐÃ ÁP DỤNG SO VỚI V3
Phiên bản v4 đã bẻ gãy các rào cản tĩnh (Static Code) của v3 để tiến vào môi trường Động (Dynamic):

### 2.1. Thay thế Tick-based bằng Event-driven Cascade
- **Cũ:** Hệ thống chạy theo tick cố định (ví dụ mỗi năm chạy mô phỏng 1 lần). Rất nặng và vô nghĩa ở những kỷ nguyên hòa bình.
- **Mới (`CascadeEngine`):** Hệ thống tích lũy *Áp lực (Pressure)* qua cơ chế Drift (Trôi dạt). Chỉ khi Áp lực vượt ngưỡng `COLLAPSE_THRESHOLD`, máy tính (PHP) mới bóp cò (Trigger) kích nổ sự kiện (Event). Một sự kiện nổ ra có thể kéo theo (Cascade) 3-4 sự kiện khác như quân bài domino cho đến khi thế giới tìm lại điểm cân bằng.

### 2.2. Ký Ức Văn Minh (Civilization Residuals)
- **Cũ:** Nền văn minh chỉ có "Trạng thái hiện tại" (Cao, Thấp, Tốt, Xấu). Lịch sử trôi qua là quên sạch.
- **Mới (`CivilizationResidual`):** Lịch sử lưu lại "Sẹo" (Trauma). Một cuộc Đại chiến cách đây 2000 năm sẽ để lại `war_trauma`. Nỗi đau này phân rã từ từ qua từng năm (`decay()`), nhưng khi vẫn còn tồn tại, nó cộng dồn vào Áp lực Xã Hội hiện tại khiến mầm mống bạo loạn dễ bùng nổ hơn. 

### 2.3. Chuyển Presets thành WorldSeed Archetypes
- **Cũ:** 24 Presets bị đóng khung bởi các nhãn dán cứng nhắc (Level Tech: Hiện đại, Level Power: Tu tiên).
- **Mới (`WorldSeed`):** Rút gọn về 8 Archetypes lõi (Ví dụ: Ascension Mysticism, Tech Stratified). Sử dụng 4 Vector mở liên tục (Ontology, Epistemic, Civilization, Energy) để định nghĩa sức mạnh bằng Toán học thay vì bằng Chữ. (VD: `energy_density: 0.9` -> Linh khí sung túc. `energy_density: 0.1` -> Kỷ nguyên Mạt pháp).

### 2.4. Phân tầng Cosmology Rõ Ràng (World > Universe > Timeline)
Trong v4, Vũ trụ quan (Cosmology) được phân định lại cực kỳ sắc bén để mở đường cho Multiverse:
- **World (Thế Giới Khung):** Nằm ở tầng cao nhất. World **chỉ** chứa logic vật lý mỏ neo, các nguyên tắc, định luật sơ khai bất di bất dịch của vũ trụ (Archetypes, hằng số ma pháp/khoa học, biên độ Vector). World không có thời gian bay.
- **Universe (Vũ Trụ Cụ Thể):** Một World làm cha có thể chứa *vô hạn* Universe anh em. Các Universe này có thể phát triển hoàn toàn độc lập hoặc có khả năng va chạm, giao thoa lẫn nhau (Multiverse Collision/Crossover). Tất cả đều phải tuân thủ định luật vật lý của World cha.
- **Timeline (Dòng Thời Gian):** Sự sống thực sự. Khái niệm Timeline chỉ xuất hiện khi một Universe bắt đầu chạy mô phỏng hoặc tiến hành **Fork (Rẽ nhánh)** do một sự kiện mang tính bước ngoặt sinh ra nhánh mới.

---

## 3. CƠ CHẾ KHO DỮ LIỆU ĐA TẦNG (Contextual Translation Library)
Để biến Toán Học ở "Não Trái" thành Văn Chương ở "Não Phải" mà không bị nhàm chán lặp đi lặp lại, v4 thiết kế một màng lọc Chuyển ngữ. Trái tim của chất lượng truyện nằm ở đây:

**Tầng 1: Ma trận Miêu tả Đa chiều (Multi-dimensional Flavor Text)**
Khi Giá trị Toán học (Vd: `epistemic_instability = 0.9`) được kích hoạt, hệ thống không xuất ra con số, mà bốc ngẫu nhiên (hoặc bốc theo traits) từ Kho Dữ Liệu Flavor Text:
> *"CẢNH BÁO CHO NHÀ SỬ HỌC: Mọi ghi chép về Kỷ nguyên Cổ đại đã trở thành Thần Thoại. Tôn giáo ánh sáng tin rằng Vua Arthur là rồng giáng thế, trong khi nhóm học giả Ngầm cho rằng đó chỉ là tên một loại vũ khí hủy diệt."*

**Tầng 2: Điểm Kích Nổ Sự Kiện Linh Hoạt (Event Triggers Library)**
Các tín hiệu Bạo loạn hay Khủng hoảng không được đặt tên chết. Tên sự kiện do Kho từ điển dệt nên từ thông số xung quanh:
> **Tín hiệu nổ:** `Social Instability` + **Vector Map:** `energy_density` cực thấp = **Truyền cho AI Prompt:** *"Khởi nghĩa Nông dân Đòi Lương thực trong Kỷ nguyên Mạt Pháp."*
> **Tín hiệu nổ:** `Social Instability` + **Vector Map:** `tech` cực cao = **Truyền cho AI Prompt:** *"Cuộc đình công đẫm máu chống lại Tập đoàn Cybernetics."*

**Tầng 3: Nhặt Nhạnh "Sẹo" (Residual Injection)**
Prompt luôn gắn thêm đuôi: *"Hãy nhớ, 2000 năm trước có trận Đại Chiến, tàn tích tâm lý vẫn hằn sâu vào con người ở năm nay."* Cấp cho truyện một chiều sâu lịch sử mà không con AI độc lập nào tự bịa ra mượt mà được.

---

## 4. PHƯƠNG HƯỚNG TƯƠNG LAI: DATABASE TRANSITION
Hiện tại Hệ thống dùng chung **PostgreSQL**. Điều này tốt cho Giai đoạn khởi đầu (Lưu User, Config tĩnh, Lịch sử ngắn). 

Tuy nhiên, với tham vọng Lịch sử chặng ngàn năm chằng chịt, Relational DB (Bảng quan hệ của SQL) sẽ gặp nút thắt lớn khi xử lý Mạng lưới Nhân qủa (Cái gì sinh ra cái gì).

**Lộ trình Nâng cấp Database Cốt lõi:**
1. **Lưu trữ Network/History (Mối quan hệ nhân vật, sự kiện):** Chuyển dịch lên **Graph Database (Neo4j / ArangoDB)**. Dữ liệu thành các Điểm (Node) và Cạnh (Edge). Khi AI cần tóm tắt dòng họ để viết truyện, Graph Query trả về kết quả trong vài mili-giây thay vì JOIN 10 cái bảng ở SQL. (Graph RAG).
2. **Lưu trữ Vector Tương đồng (Context Search):** Dùng **Vector Database (Qdrant / Milvus)** để nhét các tọa độ `WorldStateVector`. Giúp tìm kiếm siêu tốc: *"Lôi ra các giai đoạn lịch sử Bạo loạn Tương Tự ở kiếp trước để cho AI viết về Hiện tượng Luân Hồi lặp lại."*

PostgreSQL vẫn được giữ lại làm Tổng kho (Master Data) lưu Tài Khoản và Billing.
