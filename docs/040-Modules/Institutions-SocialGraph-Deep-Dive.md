# Module Institutions & SocialGraph - Phân tích Chuyên sâu

## 1. Vai trò (Scope)
Hai module này quản lý các cấu trúc vĩ mô của xã hội:
- **Institutions**: Quản lý sự tiến hóa của quốc gia, tôn giáo, các thực thể tối cao (Supreme Entities) và các rủi ro hệ thống (Great Filters).
- **SocialGraph**: Quản lý mạng lưới quan hệ giữa các Actors và Institutions bằng cách sử dụng cơ sở dữ liệu đồ thị (Neo4j).

## 2. Great Filter Engine (Động cơ Bộ lọc Vĩ đại)
`GreatFilterEngine.php` là cơ chế kiểm soát sự ổn định toàn cầu:
- **Giám sát Khủng hoảng**: Sử dụng DSL (`great_filter.dsl`) để phát hiện các dấu hiệu sụp đổ.
- **Các loại Khủng hoảng**:
    - `Singularity Collapse`: Sự sụp đổ do tiến bộ công nghệ vượt khỏi tầm kiểm soát.
    - `Institutional Stagnation`: Sự trì trệ của các thiết chế xã hội.
    - `Void Breach`: Sự xâm lấn từ các chiều không gian khác (Anomaly).
- **Tác động**: Gây ra các hình phạt nặng nề như giảm dân số (`killPct`), giảm năng lực tổ chức (`org_capacity`) hoặc gây sang chấn diện rộng.

## 3. Supreme Entity Evolution (Sự tiến hóa Thực thể Tối cao)
`SupremeEntityEvolutionService.php` điều phối sự xuất hiện của các thực thể cấp vũ trụ:
- **Sự trỗi dậy Tự nhiên (Natural Emergence)**: Khi năng lượng và độ phức tạp đạt ngưỡng, các thực thể như "Thiên Ý" (World Will) hoặc "Thực Thể Viễn Cổ" (Outer God) có thể xuất hiện.
- **Thăng hoa Anh hùng (Hero Ascension)**: Các anh hùng (Heroes) từ module Intelligence có thể thăng hoa thành các thực thể tối cao sau khi đạt được những chiến tích vĩ đại.
- **Tác động Cosmic**: Các thực thể này thay đổi vĩnh viễn các `Axioms` (quy luật) và `Ethos` (tư tưởng) của vũ trụ.

## 4. Complexity & Dynamics
- **CivilizationComplexityEngine**: Tính toán độ phức tạp của nền văn minh, mật độ thông tin và áp lực sụp đổ dựa trên các chỉ số `order`, `entropy` và `energyLevel`.
- **WorldEdict Engine**: Cho phép ban bố các sắc lệnh (Edicts) thay đổi hành vi của toàn bộ cư dân trong một khu vực hoặc quốc gia.

## 5. Social Graph Integration
`Neo4jSocialSyncer.php` đảm bảo mọi quan hệ xã hội trong SQL được đồng bộ sang Neo4j:
- **Nodes**: Actors, Institutions, Places.
- **Edges**: BELONGS_TO, ENEMY_OF, ALLIED_WITH, TRADES_WITH.
- **Pathfinding**: Sử dụng đồ thị để tính toán độ lan truyền của tin đồn, tư tưởng hoặc các cuộc xung đột ngoại giao.
