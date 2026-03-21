# WorldOS V7: Civilizational Dynamics Engine

## 📋 Triết lý Hệ thống
WorldOS V6 là một nền tảng mô phỏng **Văn minh Tự trị** (Autonomic Civilizational Simulation). Hệ thống không chỉ mô phỏng các con số, mà mô phỏng sự nảy sinh (emergence) của văn hóa, tâm lý và lịch sử từ các quy luật vật lý và sinh học cơ bản.

---

## 🏗️ Kiến trúc Tổng quát (Hybrid Core)

WorldOS V6 sử dụng kiến trúc lai (Hybrid) để tối ưu hóa giữa tính linh hoạt của Logic nghiệp vụ và hiệu năng của Mô phỏng quy mô lớn:

### 1. PHP Orchestrator (The Brain)
- **Framework:** Laravel 12 (DDD, Action Pattern).
- **Vai trò:** Quản lý vòng đời Vũ trụ (Universe), Đa vũ trụ (Multiverse), lưu trữ trạng thái (State Management) và sinh lời dẫn truyền thuyết (Narrative Generation).
- **WorldKernel:** Lõi điều phối phân tầng (Layered Orchestration) chia mô phỏng thành 5 pha:
    - **Environment:** Vật lý, tài nguyên, địa lý.
    - **Life:** Sinh học, chuyển hóa, sinh sản.
    - **Mind:** Tâm lý cá nhân (17D Traits), nhận thức.
    - **Social:** Văn hóa, kinh tế, chính trị, tôn giáo.
    - **Meta:** Lịch sử, truyền thuyết, sự kiện đa vũ trụ.

### 2. Rust Simulation Engine (The Body)
- **Công nghệ:** Rust, gRPC (Tonic), SoA (Structure of Arrays).
- **Vai trò:** Thực hiện các phép tính toán học nặng, mô phỏng hàng ngàn Actor song song.
- **Neural SoA:** Phân hệ tâm lý 17 chiều được tích hợp sâu vào lõi tính toán, cho phép mỗi Actor có cá tính riêng biệt ảnh hưởng đến hiệu năng sinh tồn.

### 3. Next.js Dashboard (The Eye)
- **Công nghệ:** Next.js 16, Tailwind CSS.
- **Vai trò:** Quan sát dòng thời gian, biểu đồ Entropy, bản đồ nhiệt của các Zone và tương tác thủ công khi cần thiết.

---

## 📡 Cơ chế Giao tiếp: Vectorized SoA
Hệ thống sử dụng gRPC để truyền tải dữ liệu dưới dạng **SoA (Structure of Arrays)** thay vì mảng các Object. 
- **Ưu điểm:** Giảm thiểu overhead tuần tự hóa, cho phép Rust Engine sử dụng SIMD và xử lý song song cực nhanh.
- **Dữ liệu truyền tải:** Bao gồm tọa độ, chỉ số sinh tồn (đói, năng lượng, trauma) và véc-tơ cá tính 17D.

---

## 🧠 Phân hệ Tâm lý 17D (New)
Mỗi Actor trong WorldOS không còn là những chỉ số OCEAN đơn giản. Chúng tôi sử dụng véc-tơ 17 chiều bao gồm:
- **Cơ bản:** Dominance, Fear, Sociability, Curiosity...
- **Nâng cao:** Stability, Shame, Empathy, Creativity...
- **Ảnh hưởng:** Các chỉ số này quyết định trực tiếp đến tốc độ tiêu thụ năng lượng, khả năng chịu đựng chấn thương tâm lý (Trauma) và xác suất nảy sinh các hành vi đột biến.

---

## 📜 Sử thi & Vết sẹo Thế giới (Chronicles & Scars)
Mọi biến động lớn trong mô phỏng (chiến tranh, thiên tai, sụp đổ kinh tế) đều để lại:
- **World Scars:** Các "vết sẹo" trạng thái vĩnh viễn trên vũ trụ.
- **Chronicles:** Những dòng nhật ký sử thi được AI biên soạn dựa trên dữ liệu thực tế từ gRPC output, tạo nên lịch sử có chiều sâu cho mỗi thế giới.

---
**WorldOS V6 — Shaping Realities through Vectorized Causality.**
