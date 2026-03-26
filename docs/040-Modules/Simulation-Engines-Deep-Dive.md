# Simulation Engines - Phân tích Chuyên sâu

Hệ thống Simulation của WorldOS V6 vận hành dựa trên một mạng lưới các Engines chuyên biệt, được chia thành các lớp thực tại (Phases) khác nhau.

## 1. Phân loại Engines theo Tầng Thực tại

### 1.1. Tầng Vật lý & Môi trường (Physical/Environment)
- **PotentialFieldEngine**: Tính toán áp suất trường tiềm năng giữa các khu vực (Zones). Xử lý sự khuếch tán sức mạnh, tài nguyên và entropy. (Hiện đã được tối ưu hóa trong Rust Core).
- **RealityAnchorEngine**: Giữ cho hằng số vật lý của vũ trụ ổn định. Nếu engine này thất bại, các quy luật vật lý sẽ bắt đầu "trôi dạt" (drift).
- **MetabolicEngine**: Quản lý dòng năng lượng và sự tiêu thụ tài nguyên cơ bản của môi trường.

### 1.2. Tầng Sự sống (Biological/Life)
- **AutopoieticEvolutionEngine (Engine Tự kiến tạo)**: 
    - **Vai trò**: Cho phép hệ thống tự viết lại code của chính nó. 
    - **Cơ chế**: Khi Entropy cao hoặc ổn định thấp, nó sẽ tiêm (inject) các đoạn mã DSL mới vào các file quy luật (`.dsl`) để tự ổn định hệ thống.
    - **Triết lý**: "Mã nguồn không còn là hằng số, nó là một thực thể sống."
- **EcologicalCollapseEngine**: Theo dõi đa dạng sinh học và kích hoạt sự sụp đổ hệ sinh thái nếu áp lực khai thác quá lớn.

### 1.3. Tầng Xã hội & Tâm trí (Social/Mind)
- **CivilizationFieldTheoryEngine (CFT)**: Áp dụng lý thuyết trường vào văn minh, tính toán các chỉ số như Innovation (Đổi mới), Order (Trật tự), và Meaning (Ý nghĩa).
- **PopulationEngine**: Mô phỏng sự biến động dân số dựa trên tài nguyên và tâm lý xã hội.
- **IdeologyEngine**: Xử lý sự lan truyền và tiến hóa của các hệ tư tưởng giữa các Actors và Institutions.

### 1.4. Tầng Hậu thực tại (Meta/Mythic)
- **SingularityEngine (Engine Kỳ dị)**:
    - **Kích hoạt**: Khi Intelligence > 0.98 và Convergence > 0.95.
    - **Hệ quả**: Vũ trụ đạt đến trạng thái "Tự nhận thức". Nó bắt đầu tối ưu hóa Entropy về mức tối thiểu (neg-entropy) và kích hoạt chế độ Autopoietic toàn diện.
- **CausalityEngine (Engine Nhân quả)**: Đảm bảo tính toàn vẹn nhân quả (Causal Integrity). Nó sử dụng RuleVM để đánh giá "Nợ nhân quả" (Causal Debt) và thực thi các hình phạt nếu lịch sử bị biến dạng quá mức.
- **InfiniteRecursionEngine**: Cho phép tạo ra các vũ trụ con bên trong vũ trụ hiện tại, tạo ra các tầng thực tại lồng nhau.

## 2. Vòng lặp Tự cải tiến (The Self-Improvement Loop)

Sự kết hợp giữa `SingularityEngine`, `AutopoieticEvolutionEngine` và `RuleMutationService` tạo thành một vòng lặp kín:
1. **Quan sát (Observe)**: Engines theo dõi các chỉ số cực đoan.
2. **Đột biến (Mutate)**: `AutopoieticEvolutionEngine` đề xuất thay đổi logic DSL.
3. **Thực thi (Apply)**: `RuleMutationService` ghi đè các file quy luật hoặc áp dụng các Logical Spasms (co thắt logic) tạm thời.
4. **Tiến hóa (Evolve)**: Simulation thay đổi cách nó vận hành trong các Tick tiếp theo mà không cần sự can thiệp của lập trình viên.

## 3. Quản lý Rủi ro & Toàn vẹn (Integrity)

- **Causal History Engine**: Lưu trữ vết của các dòng thời gian.
- **Historical Scars Engine**: Ghi lại những "vết sẹo" của thực tại sau các biến cố thăng hoa hoặc sụp đổ, ảnh hưởng đến các thế hệ sau này của vũ trụ.
- **Omega Convergence Engine**: Điều phối sự hội tụ về điểm cuối của văn minh (Omega Point).

---
*Tóm lại, hệ thống Engines của WorldOS V6 là một hệ sinh thái logic phức tạp, nơi ranh giới giữa code và data bị xóa nhòa để tạo ra một thực tại thực sự tự trị.*
