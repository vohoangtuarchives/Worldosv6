# Review Session 3: Narrative & Social Layer (Audit Report)

## 1. Narrative Loom: Orchestration bằng LangGraph

Hệ thống kể chuyện (Narrative) không phải là một prompt đơn lẻ mà là một **Đồ thị Trạng thái (StateGraph)** phức tạp với hơn 15 Node chuyên biệt.

### 1.1. Luồng xử lý (LangGraph Flow)
- **Engine Nodes**: Tính toán các chỉ số "Narrative Entropy" (độ hỗn loạn của truyện) và "Dramatic Arc" (nhịp độ cao trào).
- **Agent Nodes (The Council)**: 
    - `The Historian`: Tóm tắt sự kiện vật lý.
    - `The Psychologist`: Phân tích động cơ nhân vật dựa trên "Tâm trạng tập thể" từ Laravel.
    - `The Wordsmith`: Chuyển hóa dữ liệu thành văn chương (Prose).
    - `The Critic`: Rà soát chất lượng và có quyền kích hoạt **Vòng lặp sửa đổi (Revision Loop)** nếu nội dung không đạt yêu cầu.
- **Visual Integration**: `VFX Director` đề xuất các thay đổi về màu sắc/hạt (particle) dựa trên cảm xúc của chương truyện.

---

## 2. Social Engine: Đa nhân cách & Trí nhớ

### 2.1. Oasis Profile Generator (Lớp Persona)
- **Deep Reality Enrichment**: Mỗi nhân vật được "tiêm" (inject) tri thức về Kỷ nguyên (Era) và Hệ thống sức mạnh (Power System) tương ứng. Điều này ngăn chặn việc nhân vật thời Tiền sử nói về AI.
- **Zep Hybrid Search**: Sử dụng tìm kiếm hỗn hợp trên Zep Entity Graph để trích xuất "Hồi ức dài hạn" (LTM) khi sinh Profile.

### 2.2. Neo4j Social Syncer (Lớp Quan hệ)
- **Graph Insight**: Laravel đồng bộ hóa các mối quan hệ (Bố-con, Tin tưởng, Sợ hãi) vào Neo4j.
- **Anomalous Cliques**: Hệ thống tự động tìm kiếm các "nhóm lợi ích" hoặc "vùng sợ hãi" trong biểu đồ xã hội để làm đầu vào (Input) cho AI kể chuyện. Đây là cầu nối quan trọng giữa **Con số** và **Câu chuyện**.

---

## 3. Đánh giá Kỹ thuật (Audit Findings)

### ✅ Ưu điểm (Strengths)
1. **Tinh vi & Chân thực**: Việc chia nhỏ vai trò Agent (Historian vs Wordsmith) giúp nội dung kể chuyện có chiều sâu lịch sử và tính nhất quán cao.
2. **Context-Awareness**: Nhân vật thực sự hiểu mình đang ở thời đại nào nhờ lớp tri thức được tách biệt hoàn toàn.

### ⚠️ Rủi ro & Nút thắt (Risks & Bottlenecks)
1. **Chi phí & Độ trễ LLM**: Mỗi nhịp Pulse chạy qua 15+ Node LLM. Với quy mô hàng ngàn Agent, chi phí API và thời gian đợi sẽ cực kỳ lớn.
    - *Đề xuất*: Cần cơ chế **Lazy Profile Generation** (chỉ sinh khi cần) và **Result Caching**.
2. **Desync Social Graph**: Nếu Neo4j không được cập nhật kịp thời so với PostgreSQL, AI sẽ kể về những mối quan hệ đã bị hủy diệt trong mô phỏng vật lý.

---

## 4. Kết luận Session 3
Lớp Narrative và Social là linh hồn tạo nên sự khác biệt của WorldOS. Sự kết hợp giữa Neo4j (Quan hệ), Zep (Hồi ức) và LangGraph (Tư duy) tạo nên một hệ thống mô phỏng xã hội cực kỳ sống động.

> [!TIP]
> **Next Step**: Chuyển sang **Session 4: Frontend Visualization (VFX)** để review cách chúng ta dùng React/Three.js để "vẽ" ra thực tại này cho người dùng.
