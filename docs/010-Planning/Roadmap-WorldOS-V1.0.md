# Roadmap: WorldOS V6 - V1.0 Release (Observer & Autonomy)
*Ngày tạo: 2026-04-05*
*Trạng thái: Approved*

Theo sát nguyên lý **Phi Tương Tác** (Không làm God Mode, thế giới hoàn toàn tự trị vận hành theo Engine Nhân quả/Causality Engine), quá trình "Hoàn Thiện" V1.0 tập trung toàn lực vào việc tối đa hóa góc nhìn **Thần Nhãn (Observer Hub)** và độ tin cậy của Hạ tầng (Infrastructure).

---

## Phase 1: Spatial & Cartography UI (Vị trí Thần Nhãn Mở rộng)

### 1. Interactive Visualizer (Timeline/Map)
Triển khai thành phần hiển thị Không Gian trực quan. Thay vi chỉ đọc logs sự kiện, Observer Hub sẽ có lớp bản đồ/không gian phẳng, cho phép người dùng thấy được lãnh thổ hoặc tọa độ (zone) hình thành dựa trên dữ liệu Rust Engine gửi về.

### 2. Entity Bio-Scanner
Cơ chế "quét" (Scan). Panel thông tin chi tiết trượt xuất hiện khi hover/click vào các "Điểm nóng" trên bản đồ hoặc vào Timeline Node. Thể hiện mật độ dân số, chỉ số entropy zone, innovation rate.

### 3. Environmental Weather Engine
Lớp màng lọc khói/thời tiết (Overlay) trên Map/Observer Hub phản ứng đồng thời theo hệ số Entropy của mảng vũ trụ (vd: bão điện từ, sương mù sinh học, mưa sao băng nếu có đứt gãy hệ thống).

---

## Phase 2: Auditory Singularity (Kỷ Băng Hà Âm Thanh)

### 1. AI Generator Integration (Music/FX)
Cập nhật Narrative Loom Backend để gọi các model sinh âm thanh (Ambient soundscapes/Udio/Suno API) dựa theo cấu hình Narrative Epoch (vd: Epoch hòa bình = nhạc giao hưởng; Epoch chiến tranh = tiếng trống dập dồn / còi báo động).

### 2. Audio Spatializer (Frontend)
Trình phát nhạc chìm xuyên suốt (Background Player) tại Next.js Observer Hub. Thiết kế API để khi `HistoricalEpochShifted` bắn qua Centrifugo, Next.js sẽ chuyển luồng âm thanh mix (crossfade) mượt mà sang bản nhạc Epoch tương ứng.

---

## Phase 3: Infrastructure Consolidation (Dấu ấn Cốt Lõi)

### 1. Quality Assurance (Cột sống vững chắc)
Phủ Unit Test (PHPUnit) và các bài test cấu trúc cho luồng xung yếu nhất (Luồng nổ Kafka Event -> PHP Broadcaster Queue -> Next.js Event Subscriber).

### 2. DevSecOps Caching / Rate Limit & Throttling
- Triển khai thuật toán Adaptive Token cho Narrative Loom (Chỉ trigger Gọi OpenRouter/ChatGPT khi Impact Score đủ lớn, còn các event nhỏ sẽ bị nuốt hoặc tổng hợp bulk process).
- Tối ưu Caching (GD2/Redis) triệt để cho Timeline ở Backend PHP.

### 3. Documentation Automation & DevOps
Hoàn thiện tự động hoá tài liệu. Render Architecture Diagrams tự động, cấu hình các service tự phục hồi khi crash. Mọi thứ sẵn sàng để V1.0 chạy ổn định dài hạn (long-term autonomic run).
