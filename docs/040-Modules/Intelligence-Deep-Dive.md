# Module Intelligence - Phân tích Chuyên sâu

## 1. Vai trò (Scope)
Module `Intelligence` là bộ não của các thực thể trong dự án. Nó chịu trách nhiệm mô phỏng quá trình ra quyết định, học tập và tiến hóa của các `Actors` từ mức độ cá nhân đến các cá nhân xuất chúng (Great People).

## 2. Mô hình Nhu cầu (Needs Model)
Hệ thống sử dụng một vector nhu cầu 8 chiều (8-Attractor aligned) để định hướng hành vi:
- **Survival**: Sinh tồn cơ bản.
- **Reproduction**: Duy trì nòi giống.
- **Wealth/Power**: Tích lũy tài sản và quyền lực xã hội.
- **Knowledge/Meaning**: Tìm kiếm tri thức và ý nghĩa hiện sinh.
- **Status/Belonging**: Vị thế và sự thuộc về cộng đồng.

## 3. Actor Behavior Engine (Động cơ Hành vi)
`ActorBehaviorEngine.php` điều phối việc chọn hành động dựa trên Utility AI:
1. **Chuẩn bị State**: Thu thập dữ liệu từ `WorldState`, Traits của Actor và các trường lực (Fields) môi trường.
2. **Đánh giá DSL**: Chạy `cognitive_models.dsl` qua `RuleVmService` để tính toán trọng số cho các hành động (`score_idle`, `score_eat`, `score_battle`, v.v.).
3. **Lựa chọn hành động**: Sử dụng thuật toán Softmax-ish để chọn hành động có xác suất cao nhất nhưng vẫn đảm bảo tính biến thiên ngẫu nhiên.
4. **Ghi chép (ActorEvent)**: Mọi quyết định đều được ghi lại để phục vụ cho Narrative AI.

## 4. Sự thăng hoa của Cá nhân xuất chúng (Great Person Crystallization)
Một cơ chế cực hiếm (`GreatPersonEngine`) cho phép một Actor bình thường trở thành anh hùng hoặc vĩ nhân khi đạt đủ các chỉ số về năng lực (Capabilities) và mật độ mạng lưới xã hội (Social Density). Khi đó, một `SupremeEntity` sẽ được khởi tạo để dẫn dắt nền văn minh.

## 5. Cấu trúc Domain
- **ActorEntity**: Quản lý các thuộc tính `traits` (Big Five), `metrics` và `capabilities`.
- **AgentDecisionEntity**: Lưu trữ lịch sử các quyết định và tác động (Impact) của chúng lên thế giới.
