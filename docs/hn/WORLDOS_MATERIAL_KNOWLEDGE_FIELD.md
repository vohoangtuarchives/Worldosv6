# WORLDOS MATERIAL & KNOWLEDGE FIELD SPEC
**Version:** 1.4 (Full Technical Reference)  
**Scope:** Universe Layer  
**Compliance:** World Constitutional Invariants  

Tài liệu này đặc tả toàn bộ Tầng Vật Chất (Material Field), Tầng Tri Thức (Knowledge Field), Chu Kỳ Phân Rã Meta (Meta-Cycle Engine), cấu hình Thời Gian (Hybrid Temporal Engine) và Kiến trúc Code Kỹ thuật (Runtime Engine) của WorldOS.

---

## I. Tinh Thần Cốt Lõi (Ontology & Axioms)
**Axiom M1 – Universal Materiality**  
Mọi thực thể (Regime, Civilization, Tech, Knowledge) đều là cấu trúc tổ chức của vật liệu. Không có "linh hồn lơ lửng" (Magic/Spirit) ngoài Material. Công nghệ là vật liệu tổ chức cao, dân số sở hữu tri thức là vật chất mang thông tin.

**Axiom M2 – Entropy Never Disappears**  
Entropy không thể bị xóa cục bộ toàn diện. Nó chỉ có thể tích tụ, chênh lệch hoặc chuyển vùng:
- Sự thịnh vượng (Golden Age) không làm giảm Entropy Toàn cục. Nó chỉ xuất khẩu Entropy ra ranh giới (vùng bị ngoại biên hoặc bóc lột).

**Axiom M3 – Entropy Accumulates, Then Phase-Transitions**  
Khi Entropy đạt giới hạn và tính kết nối cấu trúc giảm mạnh $\to$ Vũ trụ bẻ gãy cấu trúc cũ để thiết lập lại một trạng thái Entropy Distribution mới (Sinh ra Meta-Cycle).

---

## II. Material Field (Vật Chất Thô)

### 1. Zone Material State
Mỗi **Zone `z`** chứa tài nguyên vật lý được ràng buộc vĩnh viễn:
```rust
pub struct Material {
    pub base_mass: f64,       // Lượng vật chất khả dụng tối đa (Bất biến/Không tự sinh)
    pub structured_mass: f64, // Phần base_mass đã được "tổ chức" (Hạ tầng, đô thị, công cụ)
    pub free_energy: f64,     // Năng lượng dùng để tái tổ chức vật chất
    pub entropy: f64,         // Mức độ phân rã [0.0, 1.0]
}
```
**Bảo toàn Invariant:** `structured_mass <= base_mass`. 

### 2. Physical Transformations
- **Tổ chức (Organization)**: Chuyển `base` $\to$ `structured`. Cần Tốc độ khai thác (`extraction_rate`), Độ ổn định (`stability`), và Công năng (`tech_efficiency`). Hiệu ứng: $\text{entropy} += k_1 \times \Delta \text{structured}$.
- **Suy thoái tự nhiên (Decay)**: Mỗi tick, `structured_mass` tự rụng theo $\text{entropy}$. Hệ thống càng lớn, phí duy trì càng lớn. Cấu trúc càng phức tạp càng dễ vỡ rụng.
- **Phá hủy do Cú sốc (Conflict/Shock)**: Chiến tranh tiêu hủy mạnh `structured_mass`, tăng vọt vĩnh viễn `entropy` tại vùng đó.

### 3. Material Stress & Economic Coupling
Sự cạn kiệt vật chất gây tác động lên Xã hội & Cấu trúc. Định nghĩa `MaterialStress`:
- `MaterialStress` tỉ lệ thuận với $( \text{entropy level} ) + ( \text{base\_mass depletion ratio} ) + ( \text{structured fragility} )$.
- Nó trở thành trọng số cho **Secession Pressure (Áp lực ly khai $P\_z$)** và quyết định Entity Spawn Probability. Rebellion trong vùng vì thế có nguyên nhân vật chất trực tiếp, không phải kịch bản thả tự do!

---

## III. Knowledge & Tech Envelope (Tầng Tri Thức & Công Nghệ)

Công nghệ (Tech) và Tri thức (Knowledge) đều là **vật liệu đã được tổ chức** (Structured Pattern).
- **Hard Tech**: Là phần `structured_mass` cơ khí/hạ tầng. Bị thiêu rụi siêu nhanh khi có bạo loạn lớn hoặc khủng hoảng Meta-Cycle. Suy tàn tức khắc mất đi.
- **Soft Tech (Embodied Knowledge)**: Kỹ năng sống, tri thức tổ chức xã hội truyền miệng hoặc ghi chép trong não dân. Decay chậm hơn Hard Tech, nhưng dễ bị bóp méo (Distortion/Mythification) khi Entropy tăng trong cộng đồng.

### 1. Tech Ceiling của mỗi Civilization
Không có một "Tech Cap Toàn Cầu" tuyến tính.
Mỗi nền văn minh $k$ có mức trần:
$$ \text{Theoretical\_Ceiling}_k = \text{base\_physical\_cap} \times \text{cultural\_openness} \times \text{material\_surplus\_factor} \times \text{institutional\_stability} $$

Và mức công nghệ hiện tại: $\text{Current\_Frontier}_k \le \text{Theoretical\_Ceiling}_k$. 
- Động lực phát triển: $\Delta \text{Tech} \propto (\text{Ceiling} - \text{Frontier})$. Càng lên cao càng chậm. Thiếu surplus (năng lượng/tài nguyên dôi dư) do Material Stress lập tức trì hoãn Tech Frontier. Đạt trần $\to$ Đóng khung (Stagnation).

### 2. Tầng lưu trữ Universe Knowledge
Knowledge được bóc ra từ Zone để đẩy lên Mạng Vũ Trụ dưới dạng dư ảnh khi Zone Collapse:
1. `EmbodiedKnowledge` (Sống với Zone).
2. `KnowledgeResidual` (Sót lại chút xíu sau Collapse).
3. **`KnowledgeCoreSignature`** (Trường cốt lõi Tri thức Vũ Trụ, xuyên Suốt chu kỳ). Tích lũy không giới hạn $\to \infty$, nhưng mức dung nạp (Usable Core) giới hạn bởi World Constraints. Trải qua Meta-cycle, lõi này bị Distortion tỉ lệ thuận Global Entropy Index. Các nền thế hệ sau thường nhầm phần Tàn dư này là Thần Thoại / Bí Thuật (Mythification) của người tiền cổ.

---

## IV. Meta-Cycle Engine (Chuyển Pha Vũ Trụ)

Trong dài hạn, Universal Entropy Index (GEI) tăng mãi không thể đảo ngược, tới mức triệt tiêu `Structural Coherence Index` (Chỉ số Mạch lạc Hình Cấu - SCI).

1. **Trigger Stochastic (Event-Driven)**
   Không cưỡng ép Deterministic tuyệt đối. Thay vào đó, nếu `SCI < CriticalThreshold` tại một ngưỡng sai lệch ngẫu nhiên nhỏ $\to$ Kích hoạt MetaCycle.
   
2. **Hiệu ứng Quét Diện Cực Điểm của Một Trận Meta-Cycle**
   - Sự sụp đổ $\approx 80\%$ toàn cầu `StructuredMaterial`.
   - Quét $\approx 50\%$ toàn cầu `EmbodiedKnowledge`.
   - `BaseMaterial` không bao giờ biến mất, vẫn giữ nguyên để các nền văn minh hậu kỳ bắt đầu lại.
   - Trọng lực Core Signature (Lõi tàn tích Kiến thức) bẻ cong (Biased Initialization) lại tham số khởi tạo (seed) cho kỷ nguyên sau, đảm bảo Lịch sử lặp lại nhưng "có âm vang".

### V. Temporal Execution Model (Không Gian Thời Gian)

Sử dụng **Hybrid Epoch Batch Architecture**:

1. **Micro Tick (Liên tục/Khối lượng nhẹ)**
   Tính toán vi phân cho các quá trình tốn CPU: Entropy Decay, Cultural Diffusion, Drift Material Extraction. 
2. **Macro Event Trigger (Event-Driven Shock)**
   Thay vì chạy script rề rà, mọi cú sốc lớn như Dân số nội chiến (Regime Split), Spawn Faction, Áp lực Ly khai $\to$ Đẩy vào **Event Priority Queue** xử lý.
3. **Batch Epochs**
   WorldOS là mô phỏng lịch sử ngoại vi (offline mode), KHÔNG ĐƯỢC CHẠY Real-time Loop. Simulation sẽ tick nén ví dụ: 1000 MicroTick = 1 Epoch. Khi kết thúc Epoch System Core mới gửi Data Snapshot lên tầng Laravel bằng Data Diff nhỏ. Khớp 100% việc tạo History Track mà không đốt I/O Redis/DB.

---

## VI. Fixed Zone Topology (Kiến trúc Ranh Giới Định Hình O(n²))

*Quan trọng:* Một Zone **không thể bị tách vật lý (spawn mới)** hoặc nhập làm mất ID Zone cấu trúc trong runtime.
1. Khống chế **O(E)**: Diffusion và Material Trade luôn diễn ra ở Đồ thị Liên thông tĩnh được tạo ban đầu.
2. Đế chế mở rộng hay co hẹp chỉ đổi thuộc tính `RegimeOwner` hoặc `Border_Weight`.
3. Sẽ vẫn có nội chiến, sụp đổ, tranh đoạt quyền lực $\to$ Nhờ State thay vì sinh/diệt Polygon trên bản đồ. Giữ được Performance tuyệt hảo và Snapshot Deterministic qua vạn năm.

---

## VII. Rust Core Parallel Software Architecture (Tầng Cấu trúc Mã nguồn)

### 1. SlotMap Data Layout & Thread Safety
Sử dụng mô hình Single-Source-Of-Truth an toàn cao không lồng Lock (No `Arc<Mutex>`) kết hợp `Rayon` Data Parallelism.

```rust
use slotmap::{SlotMap, new_key_type};
new_key_type! { pub struct ZoneId; }

pub struct Universe {
    pub zones: SlotMap<ZoneId, Zone>,
    pub knowledge_core: KnowledgeCore,
    pub global_entropy: f64,
}
```

### 2. Parallel Local Map $\to$ Deterministic Sequential Reduce
Nguyên tắc chạy Logic mỗi Tick:
1. **Phase 1: Local Zone Update (Parallel Worker)**
   Loop `zones.par_iter_mut()` tính toán Gradient Entropy, Material Extraction, Knowledge Decay cục bộ. Không Read/Write Zone bên dưới. Trả kết quả trung gian là `ZoneDelta` (có chứa Commands).
2. **Phase 2: Global Reduction (Single Thread)**
   Vẽ lại `Global Entropy`, `KnowledgeCoreSignature Accumulation` từ Array `Deltas` tuyến tính. Không Race-condition. Bắt seed cố định.
3. **Phase 3: Cross-Zone Diffusion Event (Single Thread / Chunked)**
   Xử lý sự kiện ảnh hưởng khuếch tán giữa kề Zone nếu có chênh lệch Trade hay Entropy.

### 3. Structural Zone Commands (Deferred Execution)
Nếu sau này có nhu cầu thay thế hay gỡ khối Zone $\to$ Bắt buộc dùng Mô Hình `Command Event`. Trong chu kỳ song song (Parallel Loop) cấm thao tác mảng. Chỉ Emit các Lệnh `ZoneCommand::Spawn`, `ZoneCommand::Destroy` lưu theo `Queue` chờ `Phase 2: Sync` thực thi.

---
**Laravel Boundary Constraint**: Framework PHP (Laravel) nằm ở **Tầng Application** xử lý Snapshot, Schedule Job Batch và Request API Dashboard (Gửi Lệnh `trigger_event` xuống qua gRPC). Mã Toán Vật lý Sinh Cực Lịch Sử tuyệt đối giữ dưới tầng Kernel Rust. Mọi sự kiện Replay chỉ cần đẩy đúng `Seed` + `Hash InitialState`.

*Hiến pháp Lịch Sử Cấu Trúc Khép Kín Vật Lý $\to$ Văn Hóa $\to$ Tri Thức đã được bảo đảm.*
