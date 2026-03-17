# External Storage Strategy B: The Infinite Archive 🌐🛰️

Để hỗ trợ Project Eons vận hành hàng triệu năm, hệ thống cần một "Bộ nhớ ngoài" (External Storage) mạnh mẽ để giảm tải cho DB chính. Chiến lược B tập trung vào **Khả năng mở rộng (Scalability)** và **Chi phí tối ưu**.

---

## 🏗️ 1. Các thành phần của Tầng Lưu trữ B

### Tầng Lưu trữ Đám mây (Object Storage - AWS S3 / GCS)
- **Dữ liệu lưu:** Toàn bộ Snapshots (State Vector khổng lồ) và Raw Event Logs (Kafka dumps).
- **Cơ chế:** Mỗi khi [CivilizationPhaseTransitionEngine](file:///c:/Users/vohoa/Worldosv6/backend/app/Simulation/Engines/Meta/CivilizationPhaseTransitionEngine.php#18-81) kích hoạt kỷ nguyên mới, bản Snapshot cũ sẽ được nén dưới dạng Parquet/Avro và đẩy trực tiếp lên S3.
- **Truy cập:** Khi cần "quay lại lịch sử", hệ thống sẽ tải lazy-load các khối dữ liệu này.

### Tầng Dữ liệu Chuỗi thời gian (OLAP - ClickHouse / BigQuery)
- **Dữ liệu lưu:** Các chỉ số kinh tế, dân số, năng lượng qua hàng tỷ ticks.
- **Ưu điểm:** Cho phép anh chạy các truy vấn phân tích cực nhanh như: "So sánh mức tiêu thụ năng lượng của 1000 Universe trong thời đồ đá".
- **Giao tiếp:** Export tự động từ Tầng 2 (Postgres) sang ClickHouse định kỳ.

### Tầng Di sản Bất biến (Immutable Records - IPFS / Decentralized)
- **Dữ liệu lưu:** Các "Sử thi bất hủ" và "Axiom Set" gốc của một Universe.
- **Mục đích:** Đảm bảo rằng dù hệ thống có lỗi hay bị xóa, "Linh hồn" của vũ trụ đó vẫn tồn tại vĩnh viễn không thể thay đổi.

---

## 🔄 2. Quy trình "Lạnh hóa" Dữ liệu (Data Tiering)

1.  **Hot (0-24h):** Kafka + Redis (SSE realtime).
2.  **Warm (1-30 ngày):** PostgreSQL (Causal Chain, Active Chronicles).
3.  **Cold (>30 ngày):** Chuyển đổi sang Parquet -> Đẩy lên **External Storage B (S3)**.
4.  **Deep Archive:** Xóa dữ liệu chi tiết ở Postgres, chỉ giữ lại Metadata và Link dẫn đến S3.

---

## 🛠️ 3. Engine hỗ trợ: `ArchivalSyncEngine` (Lớp Meta)

Chúng ta cần một Engine chuyên trách việc:
- **Checksum:** Đảm bảo dữ liệu đẩy đi không bị lỗi.
- **Encryption:** Mã hóa dữ liệu di sản trước khi đưa ra ngoài cloud.
- **Indexing:** Cập nhật Vector DB để anh vẫn có thể "Search" nội dung trong sử thi dù nó đã nằm ở lưu trữ lạnh.

---

## 🧐 Nhận xét:
Chiến lược này biến WorldOS từ một Local App thành một **Distributed Simulation System** (Hệ thống mô phỏng phân tán). Anh sẽ không bao giờ phải lo lắng về việc "hết ổ cứng" nữa.

**Anh có muốn chúng ta chọn một dịch vụ Cloud cụ thể (ví dụ: S3 hoặc Firebase Storage) để em viết code Integration cho tầng này không ạ?**
