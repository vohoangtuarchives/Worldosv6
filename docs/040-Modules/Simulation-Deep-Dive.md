# Module Simulation - Phân tích Chuyên sâu

## 1. Vai trò (Scope)
Module `Simulation` là trung tâm điều phối toàn bộ vòng đời của một vũ trụ. Nó không chỉ thực hiện các phép tính thô (ủy quyền cho Rust Engine) mà còn quản lý ý nghĩa của các kết quả đó thông qua hệ thống Narrative và Axioms.

## 2. Các Thực thể Domain (Domain Entities)
Nằm tại `app/Modules/Simulation/Entities/`, các thực thể này là "Pure PHP" (không phụ thuộc vào Eloquent):

- **UniverseEntity**: Đại diện cho một vũ trụ đang vận hành. Chứa `stateVector` (vector trạng thái), `entropy`, `stabilityIndex` và các quy luật `axioms`.
- **RelicEntity**: Các di vật ngoại chiều (Extradimensional Relics) có khả năng bẻ cong quy luật vật lý.
- **WorldEntity**: Cấu hình gốc của một thế giới (Seed, Genre, Constants).
- **SnapshotEntity**: Bản ghi đóng băng trạng thái tại một thời điểm (Tick).

## 3. Simulation Kernel (Lõi điều phối)
`SimulationKernel.php` là thành phần quan trọng nhất:
- **Đăng ký Engine**: Quản lý `EngineRegistry` để nạp các engine thành phần (`InnovationEngine`, `StabilityEngine`, v.v.).
- **Xử lý Effect**: `EffectResolver` giải quyết các tác động chéo giữa các quy luật khi một sự kiện xảy ra.
- **Vòng lặp Tick**: Điều phối luồng dữ liệu từ State -> Engine -> Result -> State Update.

## 4. Các Logic xử lý chính (Actions)
- **TransitionEpochAction**: Thực hiện bước nhảy vọt về thời đại. Cập nhật `axiom_modifiers` để thay đổi vĩnh viễn hành vi của vũ trụ.
- **WavefunctionCollapseAction**: "Sụp đổ hàm sóng" - quyết định một kết quả cụ thể từ nhiều khả năng mô phỏng khi có sự quan sát (Observer Effect).
- **ManifestRelicAction**: Hiện thực hóa các vật phẩm đặc biệt dựa trên các điều kiện hiếm trong mô phỏng.

## 5. Tích hợp Infrastructure
Sử dụng **Repository Pattern** để chuyển đổi giữa Domain Entities và Eloquent Models:
- `UniverseEloquentRepository`: Chuyển đổi dữ liệu từ bảng `universes` sang `UniverseEntity`.
- **Event Bus**: `SimulationEventBus` phát các sự kiện nội bộ để các module khác (như Narrative) có thể lắng nghe và phản hồi.
