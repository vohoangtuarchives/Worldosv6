# Kiến Trúc Lõi Của WorldOS Game Engine & Social Physics
**Tài liệu:** WORLDOS_ARCHITECTURE_SIMULATION_ENGINE.md
**Mục tiêu:** Định nghĩa kiến trúc lõi của Simulation Engine phục vụ hai mục đích: Nghiên cứu cấu trúc xã hội (Theory Discovery) và Tạo tình huống cốt truyện (Narrative Generation).

## 1. Triết Lý Thiết Kế: Bimodal Discovery & Hybrid Simulation
WorldOS không phải là một trò chơi mô phỏng thông thường. Nó là một **Phòng thí nghiệm vật lý xã hội có hỗ trợ AI**, hướng tới việc khám phá hai trạng thái cực đoan:
- **Stable Equilibrium:** Thế giới ổn định vĩnh viễn (nhưng có thể nhàm chán).
- **Runaway Collapse:** Thế giới sụp đổ nhanh chóng do xung đột phe phái.

Sự thú vị của hệ thống nằm ở biên giới chuyển pha (Phase Transition/Criticality), nơi một thế giới đứng chênh vênh giữa trật tự và hỗn loạn. Hệ thống đòi hỏi tính Deterministic (quyết định luận) ở diện rộng và Noise (nhiễu ngẫu nhiên có kiểm soát) ở mức vi mô.

## 2. Mô Hình Đa Vũ Trụ (Multiverse Directed Acyclic Graph - DAG)
Hệ thống quản lý không gian các khả năng (possibility space) thông qua mô hình: **Independent Universes + Branching from Existing Universe (A+B)**.

*   **WorldTemplate (Luật Vĩ Mô):** Cố định. Là bộ gene (Genome) định nghĩa phân phối tâm lý, tài nguyên, các vùng không gian.
*   **UniverseInstance (Dòng thời gian):** Đại diện cho một mẫu số cụ thể của Template, phát triển tuyến tính bằng Seed.
*   **Branch Injection:** Tại các thời điểm "tới hạn" (Criticality Detector bật xanh), hệ thống cho phép tạo nhánh mới bằng cách tiêm (inject) một sự kiện bên ngoài (External Shock) mà không được phép thay đổi luật vĩ mô (Macro Law) hay bản chất của tác nhân. Giao thức này cho phép AI/Player khảo sát độ rẽ nhánh (divergence) của lịch sử mà không phá vỡ tính nguyên vẹn của Timeline.

## 3. Kiến Trúc Vận Hành Đa Độ Phân Giải (Hybrid Matrix)
Để phục vụ cụm tính toán phân tán mà không bị phình to ngân sách bộ nhớ (state explosion), vòng lặp thế giới sử dụng 2 chế độ:

### 3.1. Chế Độ Vĩ Mô (Macro Mode - default 90% runtime)
Hệ thống chỉ tính toán các biến số tổng hợp:
*   Phân phối của lực lượng (Faction Dominance)
*   Sự phân cực (Polarization Index)
*   Sức chịu đựng của hệ thống đối với xung đột (Fatigue)
Tác nhân cá nhân (Agent) không tồn tại vật lý trong trạng thái này.

### 3.2. Chế Độ Vi Mô (Micro Mode - triggered 10% Crisis Window)
Khi chỉ số bất ổn (Instability Gradient) vượt quá ngưỡng an toàn, hệ thống Zoom-in vào Micro Mode bằng mô hình **Semi-Agent**.
*   Các Agent được khởi tạo deterministically từ Macro State + Universe Seed.
*   Agent chỉ tồn tại trong một khung thời gian khủng hoảng ngắn (Crisis Window - vài chục Tick).
*   Tương tác diễn ra trong mạng lưới thưa (Sparse Graph) và cảm nhận Trường Ảnh Hưởng (Faction Influence Field) đè lên Khu Vực Không Gian (Spatial Zone).
*   Kết thúc Window, kết quả xung đột nén lại thành Macro Delta, push một Event trọng đại và vứt bỏ Agent (Grabage Collected).

## 4. Giải Phẫu Tác Nhân (Agent Anatomy) & Động Lực
Trong Micro Mode, Agent mang đặc điểm tâm lý sinh ra từ văn hóa chung của xã hội, không phải là một instance trống rỗng.
*   **12D Trait Vector:** Bao gồm 4 nhóm chuẩn hóa Orthogonal: Quyền Lực (Dominance, Ambition...), Xã Hội (Loyalty, Empathy...), Nhận Thức (Pragmatism...), Phản Ứng Cảm Xúc (Fear, Vengeance...). Trị số là Continuous Value (0-1).
*   **Archetype:** Khung định hướng chiến lược (Discrete Value - vd: Warlord, Zealot, Opportunist).
*   **Short-term Memory:** Bộ nhớ vòng (Ring Buffer cap 5) chứa các sự kiện ức chế hoặc kích thích tạm thời. 

**Quyết định hành động (Decision Flow):**
`Action Utility = Base Score (Archetype + Zone Context) + DotProduct(12D Trait, Context Weight Vector) + Structured Micro Noise(Seed, Tick, Agent)`

## 5. Vai Trò Của Trí Tuệ Nhân Tạo (AI Integration Layer)
LLM và AI Machine Learning **tuyệt đối KHÔNG tham gia vào vòng lặp tính toán (Inner Simulation Loop)** để bảo vệ tính Deterministic và Performance.
Trách nhiệm của AI được nâng lên mức độ phân tích chuyên sâu (Meta-Analysis):

1.  **Theory Discovery (Analytical AI):** Đọc Feature Vectors của 100+ Universes sau khi mô phỏng xong để chạy Clustering, tìm quy luật sụp đổ ẩn sâu trong Trait distribution.
2.  **Narrative Rendering (Compiler AI):** Lắng nghe Event Timeline (VD: FactionShifted, ZealotUprising) và biên dịch chúng thành Biên niên sử (Chronicle), Thần Thoại (Myth) hoặc Báo cáo phân tích với format ngôn ngữ tự nhiên.
3.  **Evolutionary Search (Search AI):** Thay đổi (mutate) nhẹ nhàng cấu hình Macro Parameters ở chạy lô batch để tối đa hóa composite score "Interestingness" (độ thú vị đo qua tần suất Phase Transition).

## 6. Sơ Đồ Bounded Context (Laravel DDD Structure)
Mã nguồn Laravel được tách bạch chặt chẽ qua các Queue Workers bất đồng bộ:
*   `Domain\WorldTemplate\`: Nắm giữ Macro Law Config, Evolution Genome.
*   `Domain\Universe\`: Quản lý Instance ID, Seed, Interval Snapshot, Branch Manager.
*   `Domain\Simulation\`: Core TickEngine, Crisis Detector, MicroSession, AgentFactory, InfluenceEngine.
*   `Domain\EventStream\`: Message broker đẩy DomainEvent tới hệ thống phân tích.
*   `Domain\Narrative\`: Trực rẽ Read-Model kết hợp LLM để đúc kết Chronicle.
*   `Domain\AIResearch\`: Batch job extraction feature, Novelty Search, Fitness scoring.
