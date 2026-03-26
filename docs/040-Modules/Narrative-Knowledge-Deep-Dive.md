# Module Narrative & Knowledge - Phân tích Chuyên sâu

## 1. Vai trò (Scope)
Hai module này chịu trách nhiệm cho khía cạnh "Di sản" (Legacy) của hệ thống.
- **Narrative**: Đóng vai trò là "Sử gia", xâu chuỗi các sự kiện thô thành biên niên sử có ý nghĩa.
- **Knowledge**: Quản lý sự tiến hóa về tri thức, công nghệ và phát minh (hiện đang trong giai đoạn placeholder cho các engine tương lai).

## 2. Chronicle Synthesis Engine (Động cơ Tổng hợp Biên niên sử)
`ChronicleSynthesisEngine.php` là cầu nối quan trọng:
1. **Truy vấn Causal Graph**: Lấy các mối liên hệ nhân quả (Causal Links) từ đồ thị trong một khoảng tick nhất định.
2. **Định dạng Narrative**: Chuyển đổi các link thô (ví dụ: `Actor:1 -> KILLED -> Actor:2`) thành định dạng Fact Sheet để Narrative AI có thể hiểu và viết thành truyện.
3. **Phân loại**: Gắn nhãn các sự kiện theo độ quan trọng (Importance) và xác suất (Probability).

## 3. Historical Fact Engine (Động cơ Sự kiện Lịch sử)
`HistoricalFactEngine.php` chịu trách nhiệm ghi dấu các mốc son lịch sử:
- **Ghi chép sự kiện**: Chuyển đổi một `WorldEvent` (biến cố thế giới) thành một `HistoricalFact`.
- **Lưu giữ ngữ cảnh**: Ghi lại trạng thái các chỉ số (Metrics) trước và sau khi sự kiện xảy ra để phân tích tác động (Impact Analysis).
- **Liên kết thực thể**: Ghi nhận các Actors, Factions và Institutions tham gia vào sự kiện đó.

## 4. Cấu trúc Dữ liệu Narrative
- **Chronicle**: Các bản ghi văn bản mô tả diễn biến vũ trụ.
- **Myth Scars**: Các "vết sẹo" lịch sử - những sự kiện định hình nên thần thoại của một thế giới (ví dụ: thảm họa diệt vong, sự xuất hiện của thần linh).
- **HistoricalFact**: Các sự thật khách quan được hệ thống ghi nhận.

## 5. Knowledge & Technology
Hiện tại, tầng `Knowledge` lưu trữ các phát minh và tiến bộ kỹ thuật dưới dạng các flags trong `stateVector`. Trong tương lai, đây sẽ là nơi điều phối các cây công nghệ (Tech Trees) và sự lan truyền tri thức (Diffusion of Knowledge).
