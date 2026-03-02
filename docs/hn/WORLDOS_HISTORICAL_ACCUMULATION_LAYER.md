# WORLDOS HISTORICAL ACCUMULATION LAYER SPEC
**Version:** 1.0  
**Scope:** Cultural, Institutional, Path Dependency & Generational Dynamics  
**Compliance:** World Constitutional Invariants  

Hệ thống mô phỏng của WorldOS đi từ "động lực học tức thời" (Dynamics) tiến lên "lịch sử có tính tích lũy" (Historical Accumulation). Các Layer này giúp thế giới không reset sau khủng hoảng, hình thành bề dày lịch sử, sự tiến hóa của văn hóa, mô hình thể chế và cơ chế trôi dạt thế hệ.

---

## 1. Cultural State Vector ($C_z$)
Mỗi Zone $z$ duy trì một Vector Văn Hóa đại diện cho niềm tin, giá trị tập thể:
$C_z(t) \in \mathbb{R}^k$ (với $k$ là số chiều văn hóa, e.g., 5–8 chiều).

**Các chiều văn hóa ví dụ:**
- *Tradition Rigidity* (Độ cứng nhắc truyền thống)
- *Innovation Openness* (Sự cởi mở đổi mới)
- *Collective Trust* (Niềm tin tập thể)
- *Violence Tolerance* (Mức độ chấp nhận bạo lực)
- *Institutional Respect* (Sự tôn trọng thể chế)
- *Myth Intensity* (Cường độ huyền thoại)

### Đặc tính bắt buộc (Axioms of Culture):
1. **Slow Internal Drift (Trôi dạt nội sinh chậm)**: $C_z(t+1) = C_z(t) + \epsilon \cdot \text{InternalDynamics}$. Định hình sự thay đổi cực chậm của con người.
2. **Event Influence (Chấn động biến cố)**: Khủng hoảng, chiến tranh tác động mạnh ($\Delta C_{\text{event}}$), nhưng vẫn kẹp trong khoảng $[0,1]$.
3. **Inertia (Tính quán tính lịch sử)**: Sự thay đổi $\Delta C$ bị triệt tiêu ($\to 0$) nếu Vector đang tiệm cận các giá trị cực đoan ($0$ hoặc $1$).
4. **Spatial Influence (Lan truyền văn hóa)**: $C_z(t+1) \mathrel{+}= \beta \sum (C_{\text{neighbor}} - C_z)$. Lan truyền như nhiệt lượng qua Topology Map. Trung tâm đồng hóa cao, ngoại vi cô lập khép kín.

**Tác động lên Regime**: Culture không trực tiếp đổi state $X(t)$. Culture là hệ số Scale của: Nhạy cảm khủng hoảng (Crisis sensitivity), Ngưỡng sụp đổ (Instability threshold). *Ví dụ: Violence Tolerance cao làm hệ dễ bùng nổ xung đột hơn bình thường.*

---

## 2. Institutional Structure Layer ($I$)
Giá trị niềm tin (Culture) hình thành nên Thể chế (Institution), và Thể chế định hướng hành vi tập thể. Khác với State hiện tại, Thể chế mang tính ngưng tụ lịch sử dài hạn.

### Persistent Political Entity (Thực Thể Thể Chế Bền Vững)
Khi phong trào/tư tưởng tồn tại đủ lâu ($\tau_{\text{survival}}$), nó biến thành một Chính đảng, Triều đại, hoặc Tôn giáo bền vững (**Entity**):
```rust
struct PoliticalEntity {
    ideology_vector: Vector,         // Trục tư tưởng
    institutional_memory: Memory,    // Ký ức thể chế (truyền đời dài hạn, Trauma)
    organizational_capacity: f64,    // Năng lực tổ chức
    legitimacy: f64,                 // Tính chính danh
    influence_map: Map<ZoneId, f64>, // Tầm ảnh hưởng xuyên vùng
}
```

- **Institutional Memory**: Tích lũy tuyến tính có hệ số rã chậm ($\lambda \to 1$). Xây dựng Ký ức về thù hận, chấn thương xã hội, truyền thống vương quyền.
- **Tương tác Thể chế**: Thực thể tác động trực tiếp lên Tín nhiệm vùng (`Trust_z`) và Áp lực Nhạy cảm (`Stress_z`).
- **Sinh Lão Bệnh Tử**: Entity KHÔNG BẤT TỬ. Khi `org_capacity` hoặc `influence` quá thấp trong thời hạn dài $\to$ Chết hẳn (Ngăn chặn bùng nổ Complexity O(n) và rác hệ thống Memory).

---

## 3. Path Dependency & Myth Scar (Vết Hằn Lịch Sử Khách Quan)
Khi một Thể chế lớn chết đi, nó KHÔNG XÓA SẠCH mà để lại **Myth Scar - Vết hằn Văn minh**. Lịch sử tích tụ chấn thương và biểu tượng:

### Objective Myth Scar Field
- Scar tồn tại ở mức độ **Trường Nền Văn Minh (Civilizational Field)**, không thuộc Regime, không thuộc Entity. Chẳng ai tuyên truyền được nó.
- **Thành phần**: `ideology_vector_snapshot`, `emotional_intensity`, `trauma_level`, `symbolic_power`.
- **Bóng Ma Lịch Sử**: Ngay cả khi vương triều chết, nó tạo ra Bias Field kéo nhẹ Zone Vector $C_z$ về quá khứ qua từng Micro-tick. Vết hằn lan tỏa xuyên khoảng cách (Propagation Kernel $\propto \exp(-\gamma \cdot \text{distance})$), ảnh hưởng liên lục địa. Mất cả ngàn tích phân mới tàn lụi sẹo.
- Khu vực có Scar Trauma cao $\to$ Rất khó ổn định, độ nhạy cảm Stress cực hạn.

Lịch sử "trôi dạt" theo con đường rẽ nhánh (Path Dependency) tự nhiên, tái lặp lại các "cuộc phục hưng lỗi" hoặc "nổi dậy vòng lặp" mà không cần Scripting/Event Hardcode.

---

## 4. Dynamic Zone Split & Pre-Secession Instability (Ly Khai & Bất Ổn Vùng)
Biên giới đế chế mở rộng và co rút dựa trên Động lực học Ly khai (Secession Dynamics), nhưng mô phỏng Lịch sử phải có độ trễ:

### Secession Pressure (Áp lực Ly khai - $P_z$)
$$ P_z = a \cdot D_z + b \cdot S_z - c \cdot \text{InstitutionalTrust}_z $$
Trong đó: $D_z$ là Độ lệch Văn hóa (`Cultural Divergence`) so với thủ đô; $S_z$ là Stress chính trị/kinh tế vật chất.

### Các Giai Đoạn Hysteresis Lịch Sử
Không tách quốc gia tức thời khi $P_z$ vượt ngưỡng. Động lực qua 4 giai đoạn:
1. `Stable`: Bình thường.
2. `Agitating` (Kích động): Khi $P_z > T_{\text{agitate}}$. Trust giảm nhanh, phân cực Radical hóa, nhưng vẫn có thể phục hồi nếu Regime Reforms.
3. `Destabilized` (Chấn động): Xung đột leo thang. Mức bạo lực cực đại. Xảy ra Spawn Agent (Tác nhân chính trị nổi dậy) mang theo `Ideology_vector` dị biệt.
4. `Split` (Ly khai): Vượt $T_{\text{split}}$ đủ thời gian $\tau_2$.
   - Split KHÔNG tạo Node mành (Graph Topology $Z$ cố định). Zone chỉ thay cấu trúc `Owner_Regime` (Tách quyền lực).
   - Tái cấu trúc Cạnh Viền (Border Reconfiguration). Lịch sử viết lại bản đồ phân cực thực thể thế giới.

---

## 5. Multi-Civilization Competitive Engine (Nền Văn Minh Cạnh Tranh & Tàn Dư)
WorldOS hỗ trợ Đa nền văn minh (Multi-Civilization) tồn tại và cạnh tranh phi tuyệt đối vĩnh viễn (Khước từ Thuyết "Hội tụ lịch sử cuối cùng"). Đa văn minh song song $\to$ Replayibility cao nhất.

### Civilization Emergence (Sự Lộ Diện Văn Minh)
Không Hardcode. Civilization tự hình thành thành Emergent Structure khi một Cluster các Zone có:
- Cultural Vector $C_z$ có độ phương sai rất thấp so với một Lõi Văn Hóa chung (`core_cultural_attractor`).
- Cluster liên thông địa lý kết nối rất kín.
- Kế thừa một chùm Scar Field (`scar_cluster`).

### Overextension & Civilization Sụp Đổ
- $\text{Expansion Pressure}$ tăng dẫn đến quá tải Hạ tầng (Material Field Base mất cân đối).
- Cấu trúc sụp đổ $\to$ Hệ chuyển trạng thái sang **Residual Form (Hạt giống Tàn Dư)** thay vì Delete.
- Chế độ **Irreducible Civilizational Core (Lõi Bất Khả Biến)**: Khi Civilization A nuốt chửng Civilization B, Lõi của B KHÔNG MẤT, nó chìm vào trường ẩn (`Latent Attractor`). Ngàn năm sau có thể kích hoạt lại để nổi loạn chia cắt bản đồ 1 lần nữa. Các Nền Văn Minh chỉ mượn xác nhau để cạnh tranh. Lịch sử WorldOS không bao giờ dừng (No End-of-History).
