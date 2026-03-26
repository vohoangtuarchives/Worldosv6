# Module WorldOS - Phân tích Chuyên sâu

## 1. Vai trò (Scope)
`WorldOS` đóng vai trò là lớp giao diện (Interface Layer) và cổng vào (Gateway) của toàn bộ hệ thống. Nó chịu trách nhiệm tiếp nhận yêu cầu từ Frontend (Observer Console) và điều phối đến các module nghiệp vụ bên dưới.

## 2. Cấu trúc Interface (Http)
- **Controllers**:
    - `UniverseController`: Quản lý CRUD và các thao tác điều khiển (Pulse, Advance, Fork).
    - `NarrativeController`: Cung cấp dữ liệu về biên niên sử và các vết sẹo thần thoại.
    - `ActorController`: Truy xuất thông tin nhân vật và các thực thể tối cao.
- **Requests**: Chứa logic validate dữ liệu đầu vào cho các thao tác can thiệp vào mô phỏng.
- **Resources**: Chuyển đổi Domain Entities thành định dạng JSON chuẩn cho Frontend.

## 3. Quản lý Đấng sáng tạo (Demiurges)
Một phần đặc thù của Module này là quản lý các thực thể `Demiurges` (Đấng sáng tạo) - đại diện cho các quyền năng can thiệp cấp cao vào mã nguồn của vũ trụ.

## 4. Cơ chế Điều phối (Actions)
Module WorldOS không trực tiếp chứa nhiều logic nghiệp vụ nặng mà chủ yếu sử dụng các Action từ các module khác:
- Khi gọi `/simulation/advance`, nó sẽ gọi `AdvanceSimulationAction` từ module Simulation.
- Khi truy cập `/chronicles`, nó tương tác với các service của module Narrative.

## 5. Tích hợp Real-time
Module này tích hợp chặt chẽ với Centrifugo để đẩy các thông báo về "Anomalies" (Bất thường) hoặc "Global Events" lên dashboard của Người quan sát ngay lập tức.
