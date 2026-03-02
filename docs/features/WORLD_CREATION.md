# World Creation Specification (Genesis Protocol)

## 1. Tổng quan (Overview)
Trong hệ thống **WorldOS**, **World (Thế Giới)** không phải là một hành tinh hay một vũ trụ đơn lẻ. Nó là **tập hợp các quy luật vật lý, siêu hình và logic nền tảng** (Physics & Metaphysics Framework).

Mọi **Universe (Vũ trụ)** được sinh ra trong một World sẽ thừa hưởng toàn bộ các quy luật này. Nếu World là "Engine Game", thì Universe là một "Session Game" đang chạy.

Việc tạo World (Genesis) là bước đầu tiên và quan trọng nhất để định hình thực tại.

---

## 2. Input Parameters (Tham số Đầu vào)

Khi khởi tạo một World mới, Demiurge (Người dùng) cần cung cấp các thông tin sau:

### 2.1. Basic Information (Cơ bản)
| Field | Type | Required | Description | Ý nghĩa |
| :--- | :--- | :--- | :--- | :--- |
| `name` | String | Yes | Tên định danh của thế giới. | Ví dụ: "Cyberpunk 2077", "Middle Earth", "Dune Arrakis". |
| `description` | Text | No | Mô tả ngắn gọn về bối cảnh. | Giúp AI (LLM) hiểu ngữ cảnh để sinh nội dung (Chronicles) phù hợp. |
| `slug` | String | Auto | URL-friendly ID. | Dùng trong API routing. |

### 2.2. Axioms (Hệ Tiên Đề - Physics Laws)
Đây là "Source Code" của thực tại. Các tham số này quyết định vũ trụ sẽ vận hành ra sao.

| Axiom Key | Type | Default | Ý nghĩa & Tác động |
| :--- | :--- | :--- | :--- |
| `entropy_conservation` | Boolean | `true` | **Bảo toàn Entropy**: Nếu `true`, hỗn loạn không tự sinh ra/mất đi. Nếu `false`, vũ trụ có thể tự ổn định (Magic) hoặc tự sụp đổ nhanh chóng. |
| `energy_density` | Float (0-1) | `1.0` | **Mật độ Năng lượng**: Quyết định tốc độ phát triển. Cao = Phát triển nhanh nhưng dễ nổ (High Volatility). Thấp = Chậm chạp, chết chóc (Heat Death). |
| `physics_engine` | Enum | `'newtonian'` | `'newtonian'` (Chuẩn), `'quantum'` (Bất định), `'magic'` (Phá vỡ quy tắc). Ảnh hưởng đến cách tính toán sự kiện va chạm. |
| `time_dilation` | Float | `1.0` | **Giãn nở thời gian**: Tỉ lệ trôi của thời gian so với Tick hệ thống. |

**Ví dụ JSON:**
```json
{
  "entropy_conservation": true,
  "energy_density": 0.8,
  "physics_engine": "quantum"
}
```

### 2.3. World Seed (Hạt Giống Văn Minh)
Định hình "DNA" của các nền văn minh sẽ xuất hiện.

| Seed Key | Type | Description |
| :--- | :--- | :--- |
| `archetypes` | Array | Các khuôn mẫu nhân vật/tổ chức (vd: `['warrior', 'scholar', 'merchant']`). |
| `starting_resources` | Object | Tài nguyên ban đầu (vd: `{'gold': 1000, 'mana': 0}`). |
| `bias` | String | Xu hướng hành vi (vd: `'aggressive'`, `'peaceful'`, `'scientific'`). |

---

## 3. Quy trình Xử lý (Processing Flow)

1.  **Validation**: Hệ thống kiểm tra xem tên có trùng không và Axioms có hợp lệ (không mâu thuẫn logic) không.
2.  **Instantiation**: Lưu bản ghi vào Database (`worlds` table).
3.  **Physics Initialization**: Engine khởi tạo các hằng số vật lý dựa trên Axioms.
4.  **Saga Ready**: World ở trạng thái sẵn sàng để tạo Saga (Dòng thời gian).

---

## 4. Ví dụ Thực tế (Use Cases)

### Case A: Thế giới Hard Sci-Fi (Thực tế)
-   **Name**: "Proxima Centauri B"
-   **Axioms**:
    -   `entropy_conservation`: `true` (Vật lý chuẩn)
    -   `magic_allowed`: `false`
    -   `energy_density`: `0.5` (Tài nguyên khan hiếm)
-   **Kết quả**: Các vũ trụ con sẽ phát triển chậm, logic chặt chẽ, chiến tranh vì tài nguyên.

### Case B: Thế giới High Fantasy (Phép thuật)
-   **Name**: "Eldoria"
-   **Axioms**:
    -   `entropy_conservation`: `false` (Phép thuật có thể đảo ngược entropy)
    -   `magic_allowed`: `true`
    -   `energy_density`: `2.0` (Năng lượng dồi dào)
-   **Kết quả**: Các vũ trụ con đầy biến động, kỳ lạ, có thể sụp đổ bất cứ lúc nào do năng lượng quá tải.

---

## 5. API Reference
**Endpoint**: `POST /api/worldos/worlds`

**Body:**
```json
{
  "name": "Eldoria",
  "description": "A land of magic and mystery.",
  "axioms": {
    "magic": true,
    "tech_level": 0
  }
}
```
