# Module World - Phân tích Chuyên sâu

## 1. Vai trò (Scope)
Module `World` đại diện cho tầng vật lý (Physical Layer) của mô phỏng. Nó quản lý địa lý, vật chất và các quy luật cơ bản tác động lên môi trường tự nhiên trước khi các tác nhân thông minh hoặc xã hội can thiệp.

## 2. Material Reaction Engine (Động cơ Phản ứng Vật chất)
`MaterialReactionEngine.php` xử lý các tương tác hóa-lý ở quy mô lớn:
- **Cơ chế Phản ứng**: Kiểm tra các đầu vào (Inputs) trong một khu vực (Zone). Nếu đủ số lượng và thỏa mãn điều kiện xác suất, phản ứng sẽ xảy ra.
- **Tích hợp RuleVM**: Sử dụng DSL để đánh giá các điều kiện phức tạp (ví dụ: nhiệt độ, áp suất, hoặc sự hiện diện của di vật).
- **Hệ quả**: Tiêu thụ vật chất cũ, sinh ra vật chất mới, đồng thời thay đổi năng lượng (`energy`) và entropy của khu vực đó.

## 3. Pressure Resolver (Bộ giải tỏa Áp suất)
`PressureResolver.php` tính toán mức độ căng thẳng vật chất (Material Stress):
- **Hệ số Entropy**: Mỗi loại vật chất có một hệ số áp suất riêng.
- **Cộng hưởng (Resonance)**: Nếu trong một khu vực có từ 2 đơn vị vật chất cùng loại trở lên, tác động áp suất sẽ được nhân lên 1.5 lần.
- **Ý nghĩa**: Chỉ số Stress này ảnh hưởng trực tiếp đến độ ổn định của khu vực và có thể dẫn đến các thảm họa thiên nhiên nếu vượt ngưỡng.

## 4. Geography & Environment
`GeographyEngine.php` hiện đang đóng vai trò là một Placeholder cho các hệ thống:
- **Địa hình (Terrain)**: Sự thay đổi của bề mặt hành tinh.
- **Khí hậu (Climate)**: Các chu kỳ thời tiết và biến đổi khí hậu dài hạn.
- **Thiên tai (Disasters)**: Các sự kiện ngẫu nhiên mang tính hủy diệt vật lý.

## 5. Axioms (Tiên đề)
Quy luật vật lý của mỗi vũ trụ được định nghĩa thông qua các `Axioms`. Module World chịu trách nhiệm thực thi các tiên đề này ở mức độ cơ bản nhất (ví dụ: bảo toàn năng lượng, tốc độ tăng trưởng entropy). Các module cấp cao hơn có thể sửa đổi các tiên đề này thông qua các sự kiện thăng hoa hoặc biến cố vĩ mô.
