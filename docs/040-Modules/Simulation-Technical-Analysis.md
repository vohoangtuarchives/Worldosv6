# Phân tích Kỹ thuật Chi tiết: Module Simulation

## 1. Tổng quan Kiến trúc (Architectural Overview)
Module `Simulation` đóng vai trò là hạt nhân điều phối (Kernel) của toàn bộ hệ thống WorldOS V6. Nó không trực tiếp thực hiện các quy luật (Axioms) mà cung cấp một môi trường thực thi (Runtime) cho hàng trăm Engines khác nhau.

## 2. Simulation Kernel: Động cơ của Thời gian
`SimulationKernel.php` là thành phần trung tâm, thực hiện một Tick mô phỏng theo các giai đoạn sau:

### 2.1. Phân nhóm Giai đoạn (Phase Grouping)
Các Engine được đăng ký trong `EngineRegistry` được nhóm theo `Phase` (vật lý, sự sống, xã hội, v.v.). Việc thực thi diễn ra tuần tự theo phase để đảm bảo tính nhân quả (ví dụ: vật lý phải thay đổi trước khi sinh vật đưa ra quyết định).

### 2.2. Thực thi Song song với PHP Fibers
- **Concurrency**: Các Engine được đánh dấu `isParallelSafe() = true` trong cùng một Phase sẽ được thực thi đồng thời sử dụng **PHP Fibers**. Điều này tối ưu hóa việc sử dụng CPU mà không làm phức tạp hóa logic đồng bộ.
- **Read-Only State**: Để đảm bảo tính an toàn khi chạy song song, các Engine chỉ được tiếp cận trạng thái thông qua `ReadOnlyWorldState`.

### 2.3. Cơ chế Kiểm soát Thời gian (Throttling)
Kernel giám sát thời gian thực thi của từng Engine:
- **COSMETIC Priority**: Nếu Tick đã chạy quá 0.5ms, các engine làm đẹp sẽ bị bỏ qua.
- **STOCHASTIC Priority**: Nếu Tick đã chạy quá 0.8ms, các engine ngẫu nhiên sẽ bị bỏ qua.
- Đảm bảo hệ thống giữ được tốc độ Tick ổn định ngay cả khi tải cao.

## 3. WorldState: Cấu trúc của Thực tại
`WorldState.php` không chỉ là một mảng dữ liệu phẳng, nó là một cấu trúc phân tầng phức tạp (Multi-layered Reality):

### 3.1. 5 Tầng Hiện hữu (The 5 Layers)
1. **Physical Layer**: Địa lý, tài nguyên, hệ sinh thái, hằng số vật lý.
2. **Life Layer**: Actors, chỉ số sinh học, áp lực sinh tồn.
3. **Social Layer**: Các tổ chức (Institutions), quyền lực, chiến tranh, ngoại giao.
4. **Narrative Layer**: Ý tưởng (Ideas), huyền thoại (Myths), biên niên sử.
5. **Mythic Layer**: Không gian đa chiều (Hyperspace), Thực thể tối cao (Supreme Entities), Các thực tại lồng nhau (Nested Realities).

### 3.2. Hình học Đa chiều (High-Dimensional Geometry)
Hệ thống hỗ trợ các vector không gian siêu việt (**Hyperspace Vectors**) lên tới 11D hoặc 22D. Các thông số này được "chiếu" (Project) xuống không gian 3D để hiển thị lên Dashboard thông qua các trường CFT (Survival, Power, Knowledge...).

### 3.3. Thực tại Lồng nhau (Nested Realities)
Hỗ trợ đệ quy mô phỏng. Một vũ trụ có thể chứa các vũ trụ con bên trong (`nested_realities`), tạo ra các tầng rò rỉ dữ liệu (`leakage_factor`) giữa các cấp độ thực tại.

## 4. Cơ chế Thay đổi Trạng thái (State Mutation)
Mô hình **Intent-Resolution**:
1. **Engines** không thay đổi `WorldState` trực tiếp. Chúng trả về các đối tượng `Effect`.
2. **EffectResolver**: Nhận danh sách `Effects`, tạo một bản sao có thể thay đổi (`WorldStateMutable`), áp dụng các hiệu ứng, và sau đó đóng băng kết quả thành một `WorldState` mới.
3. **Atomicity**: Nếu có bất kỳ lỗi nào trong quá trình áp dụng hiệu ứng, Kernel sẽ khôi phục lại từ `preResolveSnapshot`, đảm bảo dữ liệu không bao giờ bị hỏng (Rollback safety).

## 5. Metadata & Khả năng Quan sát (Observability)
Mỗi Tick sinh ra một `TickManifest`, lưu trữ:
- Danh sách Engine đã chạy/đã bỏ qua.
- Các hạt giống ngẫu nhiên (Seeds) để tái lập (Replay).
- Chi tiết các `Effects` và `Events` đã phát sinh.
- Thời gian thực thi chi tiết (`elapsed_ms`).

---
*Tài liệu này được trích xuất từ phân tích codebase WorldOS V6 Codebase.*
