# Design: Frontend Phase 2 - The Auditor Expansion 🌌🔍

Hệ thống WorldOS V6 hiện đã có bộ não tự trị (Autonomy) hoạt động tốt ở Backend. Mục tiêu của giai đoạn này là biến "Observer Console" thành một trung tâm điều khiển trực quan, minh bạch và đầy cảm hứng.

## 1. Reality Pulse (Nhịp đập thực tại)

Thay vì chỉ hiển thị con số Entropy khô khan, chúng ta sẽ có một thành phần thị giác trung tâm.

- **Component**: `RealityCore.tsx`
- **Visuals**: Một khối đa diện 3D (sử dụng Three.js) nằm tại trung tâm Dashboard.
- **States**:
    - **Stability > 0.8**: Xanh lục dịu nhẹ, chuyển động chậm.
    - **Entropy > 0.7 (Critical)**: Khối đa diện bắt đầu nứt vỡ (glitch effects), đổi sang màu cam đỏ, nhịp đập nhanh.
    - **Autonomy Active**: Xuất hiện các luồng mã (code streamers) bao quanh khối đa diện để "hàn gắn" thực tại.

## 2. Autonomy Audit (Nhật ký Tiến hóa)

Minh bạch hóa các quyết định của AI khi nó tự sửa mã nguồn Simulation.

- **Component**: `MutationStream.tsx`
- **Feature**: Hiển thị card sự kiện cho mỗi lần `AUTOPOIESIS_MUTATION`.
- **Content**:
    - "Đã phát hiện sự mất cân bằng Entropy tại `physics.dsl`"
    - "Hành động: Chèn cơ chế ổn định `autopoiesis_stabilize`"
    - **Diff View**: Một modal nhỏ cho phép so sánh code DSL trước và sau khi AI can thiệp.

## 3. Timeline of Divergence (Dòng thời gian phân kỳ)

Cải tiến UI Timeline để phân biệt rõ ràng:
- **Causal Ticks**: Tiến trình tự nhiên.
- **Interventions**: Những lần bạn (Observer) can thiệp (fork, snapshot, set axiom).
- **Mutations**: Những lần hệ thống tự sửa đổi chính mình.

## 4. AI Diagnostics Lab (Trang chẩn đoán)

Một khu vực kỹ thuật để quản lý các "thần tối cao" (LLM Drivers).

- **Testing**: Nút "Ping" cho Zai, OpenRouter, OpenAI.
- **Metadata**: Xem độ trễ (latency), số token đã tiêu tốn cho phiên làm việc hiện tại.
- **Config**: Sửa nhanh `.env` parameters trực tiếp từ giao diện (với quyền admin).

---
**Kế hoạch thực hiện dự kiến:**
1. Code `RealityPulse` component (Three.js/Framer Motion).
2. Tích hợp real-time events từ Centrifugo để cập nhật Mutation Stream.
3. Xây dựng trang AI Lab.
