# Frontend Architecture - Observer's Console V2

## 1. Vai trò (Scope)
Frontend của WorldOS V6 không chỉ là một Dashboard thông thường mà là một "Observer's Console" (Bảng điều khiển của Người quan sát) đầy mê hoặc. Nó cung cấp cái nhìn trực quan vào các chiều không gian và cho phép can thiệp vào các dòng thời gian.

## 2. Tech Stack & Aesthetics (Thẩm mỹ)
- **Framework**: Next.js 16 (App Router).
- **Styling**: Vanilla CSS kết hợp với hệ thống Design System tùy chỉnh.
- **Aesthetics**: Glassmorphism, Glow effects, và các yếu tố lấy cảm hứng từ phim Sci-fi.
- **Animations**: `framer-motion` cho các vi chuyển động (micro-animations) mượt mà.

## 3. Quản lý Trạng thái (State Management)
- **Zustand**: Sử dụng `useSimulationStore` để quản lý trạng thái tập trung của tick hiện tại, danh sách actors, và các chỉ số Axioms.
- **Persistence**: Một số trạng thái (như vũ trụ đang chọn) được lưu vào `localStorage`.

## 4. Đồng bộ Thời gian thực (Real-time Sync)
- **Centrifugo (WebSockets)**: Frontend kết nối với server Centrifugo để nhận các broadcast sự kiện ngay lập tức.
- **Sự kiện chính**: `AnomalyDetected`, `TickAdvanced`, `NewChronicleEntry`.

## 5. Các Thành phần UI Đặc trưng
- **AxiomFluxMonitor**: Giám sát các hằng số vật lý của vũ trụ đang theo dõi.
- **AncientLivingMap**: Bản đồ địa lý sinh động hiển thị mật độ dân cư và các điểm nóng sự kiện.
- **CausalGraph**: Hiển thị mạng lưới nhân quả giữa các thực thể dưới dạng đồ thị.
- **ChronicleStream**: Luồng văn bản biên niên sử liên tục được cập nhật bởi Narrative AI.

## 6. Layout & UX
- **Global Shell**: Bao bọc toàn bộ ứng dụng, cung cấp Sidebar điều hướng và thanh trạng thái hệ thống.
- **Portal Entry**: Trang nhà đóng vai trò là "Cổng vào đa vũ trụ", liệt kê các vũ trụ khả dụng với các chỉ số tổng quát.
