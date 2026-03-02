# WorldOS V6 — Kiến trúc & Đặc tả kỹ thuật

WorldOS V6 là Động cơ Mô phỏng Tiến hóa Văn minh (Civilizational Dynamics Engine), thiết kế để duy trì một vũ trụ lịch sử tiến hóa tích lũy và lưu trữ “sẹo” ký ức; AI chỉ đóng vai trò “sử gia mù”, tạo văn bản dựa trên tín hiệu sự kiện từ mô phỏng, không can thiệp trực tiếp vào trạng thái mô phỏng. Hệ thống được vận hành theo triết lý Huyền Nguyên, trong đó mỗi xác định đòi hỏi ranh giới rõ ràng (T1), sinh ra các mối quan hệ (T2) và cấu trúc ổn định tương đối qua thời gian (T3). Nhân quả theo hướng cấu trúc biến đổi liên tục (T4), cho phép các tác nhân phát triển trong không gian khả thể mở rộng (T5), với mục đích nổi sinh cục bộ (T6) và cơ chế phản tư (T7) trong giới hạn hữu hạn (T8). Ba nguyên tắc “sắt” kế thừa từ phiên bản trước quy định tính nhất quán cơ bản: (1) Mỗi Universe là đơn vị kinh tế độc lập (trạng thái, lịch sử), (2) Authority tuyệt đối của World (luật bất biến) và Universe (state machine), (3) lưu trữ và phục hồi trạng thái dựa trên snapshot (Snapshot-first). Kiến trúc nhấn mạnh phân tách rõ giữa mô phỏng (Não Trái – sử dụng toán học, xác suất, động lực học) và chuyển ngữ văn chương (Não Phải – AI Narrative, chỉ tiếp cận Perceived Archive do Epistemic Instability).
1. Mô hình Vũ trụ (Cosmology)
1.1. World (Thế giới khung)
World là tầng cao nhất, định nghĩa các quy luật vật lý, pháp thuật, và tham số nền (hằng số, giới hạn năng lượng, tech ceiling, tập Archetype của WorldSeed, biên độ vector v.v.) cho tất cả Universe con. World không tham gia vào chu trình thời gian chạy; nó giống “bộ gen” quy định cấu trúc ban đầu cho các Universe.
Về mặt vật chất, World chứa các tiên đề (Axiom) cơ bản: mọi thực thể vật chất đều là tổ chức của vật liệu (Material Organization), entropy không biến mất mà tích tụ dần (luật M2), và khi entropy tích lũy đủ sẽ gây chuyển pha (M3). Các hằng số của World (như energy_density, tech ceiling toàn cục) quyết định các quy luật vật chất áp dụng cho mọi Universe con.
**Absolute Authority:** World nắm giữ quyền năng tuyệt đối. Khi một Axiom bị thay đổi bởi Kiến trúc sư, một **Axiom Shift** sẽ được kích hoạt, lan tỏa sự thay đổi thực tại tới mọi Universe con đang hoạt động dưới dạng các Branch Event đồng loạt.

1.4. Quản trị xuyên không gian (Trans-Dimensional Governance)
Khác với sự tiến hóa tự thân của Universe, tầng Quản trị cho phép sự can thiệp có chủ đích:
- **Sắc lệnh (Edicts):** Các đạo luật vĩ mô được Kiến trúc sư ban hành (ví dụ: "Thiên kiếp", "Đại xá thiên hạ"), làm thay đổi tức thời các chỉ số ổn định hoặc kích hoạt các chuỗi sự kiện đặc thù.
- **Ngai vàng Kiến trúc sư (Architect's Throne):** Giao diện điều khiển tối cao cho phép can thiệp vào hằng số Axiom và thực thi quyền năng xuyên đa vũ trụ.
1.2. Universe (Vũ trụ cụ thể)
Mỗi World có thể sinh ra nhiều Universe độc lập (emergent). Universe là một máy trạng thái tiến hóa tuân thủ luật của World cha: bao gồm chu kỳ tick, vector trạng thái, và lưu giữ snapshot theo thời gian.
Universe lưu trữ trạng thái của mọi Zone thành phần, bao gồm Vật chất (base_mass, structured_mass, free_energy, entropy) và Tri thức (EmbodiedKnowledge, CivilizationResidual, KnowledgeCoreSignature) theo từng Zone. Các tham số này được khởi tạo từ WorldSeed và phát triển theo thời gian.
**Origin Heritage (Di sản nguồn gốc):** Mỗi Universe khi khởi tạo (root) sẽ kế thừa một "DNA di sản" (ví dụ: Vietnamese Heritage). Di sản này tự động gieo rắc các Material đặc thù (Lúa nước, Thờ cúng Tổ tiên) và các Archetype nhân vật (Village Elder) ngay từ thời điểm Genesis, tạo nên bản sắc độc bản cho thực tại.
Universe có thể phân nhánh (fork): nếu xảy ra sự kiện đột phá (External Shock) tại một tick cụ thể, hệ thống cho phép tạo Universe con (điểm phân nhánh, parent_universe_id) để khám phá kịch bản khác mà không phá vỡ tính toàn vẹn lịch sử hiện tại. Ngoài ra, các Universe có thể va chạm/giao thoa (multiverse interactions) hoặc hội tụ (convergence) khi chúng đạt đến trạng thái cộng hưởng thiên đạo.
1.3. Timeline (Dòng thời gian)
Timeline là lịch sử tích lũy của một Universe. Khi một Universe chạy mô phỏng, hệ thống lưu lại các snapshot trạng thái và ghi nhận các Event (sự kiện) tại những bước ngoặt quan trọng. Mỗi lần fork tạo ra một nhánh timeline mới, song song với nhánh gốc.
Lưu trữ dữ liệu: Mọi thông tin về multiverse được tổ chức dạng đồ thị có hướng (DAG):
multiverses → universes (có parent_id) → universe_states/snapshots (cơ sở dữ liệu TimescaleDB lưu tick và vector trạng thái) → branch_events (ghi fork hoặc collapse) → universe_interactions (ghi va chạm/giao thoa).
2. Kiến trúc Hệ thống & Thành phần chính
2.1. Kiến trúc tổng thể
Hệ thống gồm nhiều tầng tương tác thông qua API và dịch vụ nội bộ:
Khách hàng (Client) giao tiếp qua API Gateway (xác thực, giới hạn truy cập).
Orchestration (Laravel/PHP): Đóng vai trò điều phối (Saga/Lifecycle Universe), xử lý logic nghiệp vụ, lập lịch tác vụ xuống Động cơ Mô phỏng, lưu trữ dữ liệu.
Động cơ Mô phỏng (Simulation Engine) viết bằng Rust: Thực thi các tick mô phỏng, tính toán thay đổi trạng thái (áp dụng toán học, sự kiện), và xuất snapshot. Kết nối với Orchestration qua gRPC (đồng bộ) hoặc Message Queue (bất đồng bộ).
Lớp AI: Bao gồm các dịch vụ AI/ML ngoài (Analytical AI, Search AI, Narrative AI) để phân tích dữ liệu mô phỏng, đề xuất thay đổi, tạo văn bản.
Cơ sở dữ liệu (DB): Lưu trữ thông tin người dùng (PostgreSQL), lịch sử mô phỏng và đồ thị (TimescaleDB, GraphDB), và vector trạng thái (VectorDB). Kết hợp Redis/Kafka cho streaming và caching, hỗ trợ Observer (dashboard, WebSocket, Redis Streams) phát tán sự kiện thực tế đến giao diện người dùng hoặc AI.
Hình 1. Mô tả tổng quan kiến trúc hệ thống (minh họa các thành phần và luồng dữ liệu chủ yếu).
2.2. Orchestration (Laravel Backend)
Bối cảnh DDD: Mỗi khía cạnh lớn của hệ thống được triển khai trong một Domain riêng biệt: WorldTemplate (định nghĩa luật vĩ mô, bộ gene Evolution Genome), Universe (thực thể instance với seed, snapshot, quản lý phân nhánh), Simulation (điều khiển tick engine, phát hiện khủng hoảng, tạo phiên Micro/Macro, AgentFactory), EventStream (xử lý sự kiện), Narrative (đọc chế độ chỉ, LLM tạo Chronicle), AIResearch (trích xuất đặc trưng, tìm kiếm tiên hóa, đánh giá tính mới lạ).
Dịch vụ chính:
UniverseSnapshotRepository: Lưu và truy xuất snapshot toàn cục. Lưu các bản ghi {universe_id, tick, state_vector, entropy, stability_index, metrics}. API chính: save(Universe, metrics), getAtTick(universeId, tick), getLatest(universeId).
UniverseRuntimeService: Điểm entry duy nhất cho engine mô phỏng. Hàm advance(universeId, ticks) thực thi các tick bằng cách gọi WorldEvolutionKernel (tickUniverse), nhận về state mới và lưu snapshot qua Repository.
SagaService: Quản lý Saga (chạy batch nhiều universe cho một experiment). Phương thức: spawnUniverse(World, parentUniverseId?), runBatch(Saga, ticksPerUniverse), fork(Universe, fromTick), genesisV3(Saga, ticks) để khởi tạo World từ preset và chạy simulation lần đầu.
MetricsExtractor và UniverseEvaluatorInterface: Sau mỗi batch, trích xuất metric (entropy trend, complexity index, stability) từ snapshot để đánh giá UniverseMetrics. Dựa trên đó, trả về EvaluationResult gồm IP-score, khuyến nghị (fork/continue/archive), và đề xuất đột biến macro (mutation suggestion).
DecisionEngine: Nhận EvaluationResult, ra quyết định (ví dụ fork, archive hoặc tiếp tục) và có thể áp dụng áp lực chọn lọc (selective pressure) theo đề xuất.
Các dịch vụ khác: StyleAdvisorService (gợi ý thay đổi phong cách phát triển sau một quãng trajectory nhất định), DigestArcAction (ghi nhận kết thúc Arc, lưu vào StoryBible), SerialArcPlanner (kế hoạch biểu đồ căng thẳng (tension spikes)), v.v.
Tương tác với Simulation Engine: Laravel khởi động và điều phối simulation engine. Sau khi gọi UniverseRuntimeService::advance, engine Rust chạy xong và trả về snapshot. Dữ liệu sẽ được lưu vào PostgreSQL/TimescaleDB, sau đó có thể kích hoạt các dịch vụ narrative (gửi trigger_event qua gRPC đến dịch vụ AI) hoặc lưu trả lịch sử. Laravel cũng lưu lịch sử Saga, người dùng, tài khoản qua cơ sở dữ liệu Postgres chính.
2.3. Lớp Trí tuệ Nhân tạo (AI Layer)
Analytical AI (Theory Discovery): Đọc tập vectors đặc trưng từ hàng trăm Universe (ví dụ distribution của 17D traits), sử dụng clustering và thuật toán mining để tìm quy luật sụp đổ (phase transition) hoặc điểm đến hạn của mô hình.
Search AI (Evolutionary Search): Thực hiện tìm kiếm tiến hóa trên không gian tham số macro: biến đổi (mutate) các tham số macro law trong batch simulations nhằm tối ưu hóa độ “thú vị” (interestingness, ví dụ tăng tần suất chuyển pha), tìm cấu hình hay kịch bản ngẫu nhiên mới. Không tham gia vào vòng lặp mô phỏng bên trong, mà chủ yếu tác động ở cấp Saga.
Narrative/Compiler AI: Chịu trách nhiệm tạo nội dung văn bản từ lịch sử sự kiện. Sử dụng ngữ cảnh có sẵn (Perceived Archive, Residual, v.v.) để chắp nối thành Chronicle, Myth, báo cáo. Quy tắc: AI chỉ đọc Perceived Archive (vốn mờ do Epistemic Instability), không đọc Canonical Archive và không tác động vào state của mô phỏng.
2.4. Cơ sở dữ liệu và Lưu trữ
PostgreSQL: Lưu trữ dữ liệu hệ thống cốt lõi: thông tin người dùng, cấu hình, tính toán, tác vụ điều phối, billing, v.v. (trong giai đoạn hiện tại).
TimescaleDB: Mở rộng PostgreSQL để lưu universe_snapshots (time-series) hiệu quả. Lưu bảng lịch sử trạng thái theo tick của từng Universe.
GraphDB (tương lai): Dự kiến dùng Neo4j/ArangoDB cho dữ liệu đồ thị lịch sử — mối quan hệ nhân vật–sự kiện, sử dụng Graph RAG (retrieval-augmented generation) để truy vấn lịch sử dạng mạng lưới.
VectorDB (Lộ trình): Hiện tại sử dụng bảng `ai_memories` trong PostgreSQL để giả lập lưu trữ vector (JSON embedding) và tìm kiếm ngữ nghĩa (Cosine Similarity).
   - **Long-term Memory (LTM):** Hệ thống đã tích hợp LTM với metadata phong phú (`embedding_version`, `source`, `importance`, `expires_at`) để quản lý vòng đời ký ức.
   - **Migration Ready:** Kiến trúc Driver-based cho phép chuyển đổi mượt mà sang Qdrant/Milvus/pgvector trong tương lai mà không ảnh hưởng nghiệp vụ.
Cập nhật mở rộng (Scale): Giai đoạn 1: Chạy đơn (Rust single process, Postgres single instance, Redis single, PHP single container). Giai đoạn 2: Phân tán (Rust cluster, Postgres sharded + TimescaleDB, Redis cluster/Kafka, Laravel auto-scale trên Kubernetes).
3. Động cơ mô phỏng (Simulation Engine)
Động cơ mô phỏng là lõi vật lý của hệ thống. Viết bằng Rust với cấu trúc dữ liệu SlotMap giúp quản lý song song (parallel) các Zone trong Universe một cách an toàn (không dùng Arc<Mutex>). Mỗi Universe trong engine gồm zones: SlotMap<ZoneId, Zone>, knowledge_core, global_entropy. Quy trình mỗi tick mô phỏng gồm ba pha: (1) Cập nhật cục bộ Zone (song song): từng Zone tính toán ZoneDelta và có thể phát ra lệnh ZoneCommand (Spawn/Destroy) vào queue, (2) Tổng hợp toàn cục (đơn luồng): cập nhật giá trị global_entropy, KnowledgeCore từ các delta, (3) Khuếch tán liên vùng (đơn luồng): Trade/Entropy giữa các Zone kề lân cận. Các nguyên lý chính:
Event-driven & CascadeEngine: Hệ thống tích lũy Pressure qua Drift nội tại. Khi vượt ngưỡng COLLAPSE_THRESHOLD, phát sinh một Event (chẳng hạn xung đột, khủng hoảng chính trị). Một Event có thể kích hoạt liên tiếp (cascade) 3–4 event khác cho đến khi hệ thống đạt cân bằng mới. Công nghệ này cho phép xử lý bất đẳng hướng, không cần chạy đầy đủ tick mọi năm nếu không có ngưỡng vượt.
Branch Injection (Tiêm cú sốc): Tại điểm Criticality (theo Detector vật lý), cho phép tạo nhánh Universe mới bằng cách tiêm một External Shock (ví dụ thiên tai, chiến tranh sâu sắc) mà không thay đổi Luật vĩ mô (Macro Law) hay đặc tính tác nhân (agent nature). Kỹ thuật này mở rộng không gian khả thể (theo Huyền Nguyên T5) để người chơi/AI khám phá kịch bản mới mà không phá vỡ line lịch sử gốc.
Hai chế độ phân giải (Macro/Micro): Phần lớn thời gian (~90%), engine chạy Macro Mode: chỉ cập nhật các biến tổng hợp như Faction Dominance, Polarization Index, Fatigue, không tạo agent cụ thể. Khi Gradient Độ bất ổn (Instability Gradient) vượt ngưỡng định sẵn, engine chuyển sang Micro Mode (Crisis Window) trong một khoảng thời gian nhất định: chia nhỏ một số tác nhân ra mô phỏng chi tiết (Semi-Agent) với vecto đặc trưng 17D, thuộc tính Archetype cụ thể, và bộ nhớ ngắn hạn (ring buffer). Trong Micro Mode, hệ thống xây dựng đồ thị thưa (sparse graph) với Faction Influence Field, tính toán hành vi của từng agent theo công thức hành động, sau đó kết hợp kết quả vào sự thay đổi Macro và tạo sự kiện. Kết thúc window, agent được loại bỏ.
3.1. Agent và quyết định hành động
Agent: Là tác nhân bán thực thể xuất hiện trong Micro Mode (một vùng khủng hoảng). Mỗi agent có: (1) Trait vector 17 chiều $\mathbf{T}_{17} \in [0,1]^{17}$ định tính cách (theo các nhóm: Quyền lực, Xã hội, Nhận thức, Cảm xúc, v.v.), (2) Archetype (ví dụ: Warlord, Zealot, Opportunist, …), (3) Short-term Memory (bộ đệm kích thích/ức chế ngắn hạn, độ dài 5). Các chiều trait được chuẩn hóa [0,1]; tài liệu cũ ghi 12 chiều nhưng **V6** chuẩn hóa thành 17 chiều. Bảng ánh xạ chỉ số → tên chiều (17D) như sau; khi triển khai có thể tinh chỉnh theo WorldSeed/Archetype:

| Chỉ số | Tên chiều (gợi ý) | Nhóm |
|--------|-------------------|------|
| 0 | Dominance | Quyền lực |
| 1 | Ambition | Quyền lực |
| 2 | Coercion | Quyền lực |
| 3 | Loyalty | Xã hội |
| 4 | Empathy | Xã hội |
| 5 | Solidarity | Xã hội |
| 6 | Conformity | Xã hội |
| 7 | Pragmatism | Nhận thức |
| 8 | Curiosity | Nhận thức |
| 9 | Dogmatism | Nhận thức |
| 10 | RiskTolerance | Nhận thức |
| 11 | Fear | Cảm xúc |
| 12 | Vengeance | Cảm xúc |
| 13 | Hope | Cảm xúc |
| 14 | Grief | Cảm xúc |
| 15 | Pride | Cảm xúc |
| 16 | Shame | Cảm xúc |

*Ghi chú:* Danh sách đầy đủ 17 tên chiều có thể được khôi phục từ spec gốc hoặc định nghĩa lại khi triển khai; bảng trên là placeholder thống nhất để code và spec tham chiếu.
Ra quyết định (Action Utility): Mỗi agent tại mỗi tick trong khủng hoảng đánh giá các hành động dựa trên hàm utility:
ActionUtility
=
BaseScore
(
Archetype
,
ZoneContext
)
+
T
17
⊤
w
+
StructuredMicroNoise
(
Seed
,
Tick
,
Agent
)
.
ActionUtility=BaseScore(Archetype,ZoneContext)+T 
17
⊤
​
 w+StructuredMicroNoise(Seed,Tick,Agent).
Trong đó $\mathbf{T}_{17}$ là trait vector 17D, $\mathbf{w}\in\mathbb{R}^{17}$ là vector trọng số ngữ cảnh (ZoneContext), và StructuredMicroNoise là thành phần nhiễu có thể tạo ra sai lệch ngẫu nhiên từ seed, tick, ID agent (giúp tránh tính lặp lại quá cứng nhắc). BaseScore là điểm cơ bản phụ thuộc vào Archetype và bối cảnh vùng. Kết quả là giá trị scala để agent lựa chọn hoặc ưu tiên hành động. Agent được khởi tạo một cách deterministic từ Macro State và seed của Universe, đảm bảo tính tái lập (reproducible) trong quá trình mô phỏng.
3.2. Áp lực (Pressure) và Tàn tích (Residuals)
Trong mỗi Universe, Pressure đại diện cho sức ép xã hội/cấu trúc tích lũy do bất bình đẳng, entropy, các tổn thương lịch sử (trauma) và MaterialStress. Khi Pressure vượt ngưỡng, sinh ra event khuấy động. Ta có thể biểu diễn tổng quát:
Pressure
=
f
(
inequality
,
entropy
,
trauma
,
MaterialStress
)
,
Pressure=f(inequality,entropy,trauma,MaterialStress),
trong đó $f$ có thể là tổ hợp tuyến tính hoặc phi tuyến tùy triết lý triển khai.
Civilization Residual: Khi một cuộc khủng hoảng hoặc xung đột xảy ra, nó để lại “sẹo” trên nền văn minh (ví dụ war_trauma). Những Residual này có hệ số decay theo thời gian và được thêm vào tính toán Pressure của vùng hoặc civilization tương ứng.
Myth Scar: Khi một Entity chính trị lớn chết hoặc tan vỡ, nó tạo ra một vùng ảnh hưởng gọi là Myth Scar, bao gồm snapshot vector ý thức hệ, cường độ cảm xúc, mức độ tổn thương, và quyền lực biểu tượng còn lại. Tàn tích này lan tỏa theo quy tắc xấp xỉ:
influence
∝
exp
⁡
(
−
γ
⋅
distance
)
,
γ
>
0
,
influence∝exp(−γ⋅distance),γ>0,
với distance đo trên đồ thị/topology của Zone. Vùng có Myth Scar cao càng khó ổn định về sau (tăng khả năng bất ổn và khủng hoảng).
3.3. Thời gian và Epoch (Hybrid Epoch)
Động cơ mô phỏng chạy theo chế độ Hybrid Epoch để cân đối giữa tính liên tục và hiệu quả:
Micro Tick: Mỗi tick vi mô xử lý các biến vật chất (entropy decay, tổ chức vật liệu), lan truyền văn hóa (diffusion), và drift trích xuất vật chất (nhẹ, liên tục).
Macro Event Trigger: Các sự kiện lớn (Regime Split, Spawn Faction, Secession) được phát hiện và đưa vào Event Priority Queue. Khi có cú sốc lớn, engine xử lý chúng theo độ ưu tiên.
Batch Epoch: Động cơ chạy offline theo epoch lớn, ví dụ 1000 micro-tick = 1 Epoch. Sau mỗi Epoch, engine gửi snapshot/diff dữ liệu mới lên Laravel một lần (giảm thiểu I/O liên tục).
3.4. Điểm khởi chạy (Entry Point) và Khởi nguyên (Genesis v3)
Entry Point: Hàm duy nhất để tiến hóa Universe là UniverseRuntimeService::advance(universeId, ticks). Khi được gọi, kernel Rust sẽ nạp định nghĩa World và Universe từ DB, chạy ticks tick (gồm cả cascade events), rồi ghi snapshot kết quả.
Genesis v3: Quy trình khởi tạo saga mới gồm các bước: (1) WriterGenesisController.store tạo Saga với tên và preset thế giới, (2) Gọi SagaService.genesisV3(saga, 10) (không dùng job async), (3) genesisV3 xây dựng World từ preset, spawn một Universe mới, tạo SagaWorld (chuỗi World-Universe) với sequence=1, rồi gọi runBatch(saga, 10) để chạy mô phỏng sơ bộ. Kết quả là có Universe sơ khai trong Saga, sẵn sàng cho giai đoạn mô phỏng tiếp theo.

3.5. Attractors, Bifurcation và World Scars (tham chiếu)

Trong các phiên bản trước (V3), **Attractors** là các trạng thái định sẵn (ví dụ "Cyberpunk Dystopia", "Magical Feudalism") mà mô phỏng có thể "rơi" vào khi vector bất ổn; **Bifurcation** xảy ra khi WorldStateVector mất ổn định (entropy cao), hệ tách nhánh và BifurcationManager chọn Attractor gần nhất. **World Scars** là vết thương sâu trong lịch sử thế giới (từ WorldMyth suy tàn hoặc CosmicEvent thảm họa), gây **Inertia** lên state vector — thế giới có Inertia cao cần nhiều lực (Innovation/Revolution) hơn để đổi trạng thái. Chi tiết công thức và luồng: *docs/system/04-physics-engine.md*.

3.6. Thiên Đạo và Thăng Hoa (World-Will & Ascension)
Hệ thống tính toán **Thiên Đạo (World-Will)** như một vector xu hướng nổi sinh từ tâm trí của vạn vật (Actor) và ý thức hệ của các định chế (Institution). 
- **Lạc Việt / Tâm Linh (Spirituality):** Nổi sinh khi Empathy, Solidarity và Dogmatism cao.
- **Cương Kỹ / Logic (Hard-Tech):** Nổi sinh khi Pragmatism, Ambition và Curiosity chiếm ưu thế.
- **Hỗn Mang (Entropy/Chaos):** Nổi sinh từ Fear, Vengeance và sự sụp đổ cấu trúc.
**Thăng Hoa (Ascension):** Các định chế (Institution) có tính Chính thống (Legitimacy) tuyệt đối hoặc các cá nhân (Actor) có tầm ảnh hưởng thần thoại có thể thăng hoa thành **Thực thể Tối cao (Supreme Entities)** (Demi-gods/Overminds), sở hữu quyền năng can thiệp trực tiếp vào quy luật vật lý của Universe.

3.7. Bộ lọc Vĩ đại (Great Filter)
Các cuộc khủng hoảng quy mô lớn không còn là ngẫu nhiên và là hệ quả của các bộ lọc tất yếu:
- **Innovation Paradox:** Đột phá kỹ thuật quá nhanh trong khi niềm tin cộng đồng (Trust) cạn kiệt dẫn đến sụp đổ điểm kỳ dị (Singularity Collapse).
- **Institutional Rigidity:** Khi tính truyền thống (Tradition) bóp nghẹt khả năng thích ứng, dẫn đến sự trì trệ (Stagnation) và sụp đổ hệ thống.
- **Entropy Breach:** Khi Entropy vượt ngưỡng 0.95, mở ra Cánh cửa Hư vô (Void Gate).
4. Các lớp dữ liệu & công thức
Mỗi Zone trong Universe có các biến trạng thái vật chất và xã hội sau:
4.1. Vật chất (Material)
Trạng thái mỗi Zone gồm: base_mass (khối lượng cơ sở cố định), structured_mass (phần đã tổ chức, cơ sở hạ tầng, công trình), free_energy (dự trữ năng lượng), entropy (mức độ rối loạn, mô tả độ dễ vỡ). Hằng số không đổi: structured_mass ≤ base_mass (Invariant). Lưu ý: trong tài liệu, entropy được coi là biến trạng thái chuẩn hoá [0,1] (càng cao nghĩa là càng hỗn loạn/dễ vỡ) chứ không phải entropy nhiệt động (J/K). Toàn cục tuân theo tiên đề Entropy không biến mất: entropy chỉ tích tụ hoặc chuyển vùng, không mất mát tuyệt đối.
Các biến đổi vật lý:
Organization (Tổ chức): Chuyển một phần base_mass thành structured_mass theo tỉ lệ extraction_rate và hiệu quả tech_efficiency. Khi gia tăng structured_mass, entropy của vùng tăng thêm:
entropy
+
=
k
1
⋅
Δ
structured
,
entropy+=k 
1
​
 ⋅Δstructured,
với $k_1>0$ (hằng số hệ số tăng entropy). (Ý nghĩa: xây dựng thêm kết cấu tốn công ổn định, làm hệ dễ vỡ hơn).
Decay: Ở mỗi tick, một phần structured_mass mất đi theo mức entropy hiện tại (mô phỏng hao mòn cơ sở hạ tầng do rối loạn).
Conflict/Shock: Sự kiện xung đột làm sụp đổ đột ngột structured_mass (giảm mạnh) và entropy vùng tăng vọt.
Material Stress: Phản ánh độ căng thẳng vật chất tích lũy, ảnh hưởng đến áp lực ly khai và khả năng spawn Entity. Có thể định lượng bằng công thức tổng quát (tỉ lệ):
MaterialStress
∝
(
entropy level
)
+
(
base_mass depletion ratio
)
+
(
structured fragility
)
,
MaterialStress∝(entropy level)+(base_mass depletion ratio)+(structured fragility),
trong đó base_mass depletion ratio = tỉ lệ phần base_mass đã bị sử dụng hoặc không còn khả dụng (ví dụ $(1 - \frac{\text{structured_mass}}{\text{base_mass}})$). free_energy nằm ngoài công thức này trong phiên bản hiện tại nhưng có thể dùng cho mở rộng mô phỏng năng lượng. MaterialStress càng cao đồng nghĩa vùng đó dễ xảy ra bất ổn hoặc ly khai.
4.2. Tri thức và Kỹ thuật (Knowledge & Tech)
Hard Tech: đại diện cho hạ tầng vật lý (thành phần của structured_mass) và các công nghệ cứng. Hard Tech dễ bị mất mát khi xung đột hoặc Meta-Cycle xảy ra (phá hủy cơ sở hạ tầng).
Soft Tech (Embodied Knowledge): kiến thức tích lũy (văn hoá, khoa học, truyền thống). Soft Tech hao mòn chậm hơn so với hard tech nhưng dễ bị “thần thoại hóa” khi entropy cao (kiến thức bị quên lãng hoặc biến dạng).
Tech Ceiling (giới hạn kỹ thuật): Với mỗi nền văn minh $k$, định nghĩa mức trần lý thuyết về tiến bộ kỹ thuật:
Theoretical_Ceiling
k
=
base_physical_cap
×
cultural_openness
×
material_surplus_factor
×
institutional_stability
.
Theoretical_Ceiling 
k
​
 =base_physical_cap×cultural_openness×material_surplus_factor×institutional_stability.
base_physical_cap là năng lực vật lý/nguyên tố cơ bản, cultural_openness phản ánh sẵn sàng tiếp nhận đổi mới, material_surplus_factor là khả năng dư thừa tài nguyên để phát triển, institutional_stability đo độ ổn định chính trị. Giá trị Current_Frontier_k (đang có) luôn ≤ Theoretical_Ceiling_k, và tăng trưởng công nghệ phụ thuộc vào khoảng cách còn lại: $\Delta \text{Tech} \propto (\text{Ceiling} - \text{Frontier})$. MaterialStress (với entropy cao) làm trì hoãn tăng Frontier; khi đạt Ceiling thì tình trạng Stagnation (trì trệ kỹ thuật) xảy ra.
KnowledgeCoreSignature: Sau mỗi collapse lớn (Meta-Cycle), phần còn lại vĩnh cửu là KnowledgeResidual và KnowledgeCoreSignature – hạt nhân tri thức xuyên chu kỳ. Khi entropy toàn cục tăng, core này bị nhiễu (distortion), dẫn đến việc nền văn minh sau đó khởi đầu với lịch sử “có âm vang” của trước đó.
4.3. Động lực Meta-Cycle
Động cơ mô phỏng theo dõi chỉ số Structural Coherence Index (SCI) tổng quát (giống như sự kết nối bền vững của cấu trúc xã hội/vật chất). Khi SCI giảm xuống dưới một ngưỡng xác định (có thể cộng nhiễu nhỏ ngẫu nhiên), sẽ kích hoạt Meta-Cycle – một cuộc khủng hoảng tổng quát quy mô lớn.
Hiệu ứng Meta-Cycle: Khoảng 80% structured_material sụp đổ (infrastructure collapse), khoảng 50% EmbodiedKnowledge mất mát, base_material (tài nguyên thô) thường không bị ảnh hưởng. Quan trọng là KnowledgeCoreSignature bị bẻ cong, nghĩa là seed khởi đầu của kỷ nguyên kế tiếp bị lệch theo những gì đã xảy ra (luôn có “vết tích âm vang” của lịch sử trước đó). Meta-Cycle mô phỏng sự sụp đổ và tái thiết nền văn minh theo chu kỳ lịch sử (path dependency).
4.4. Vector Văn hoá (Cultural State Vector)
Mỗi Zone có vector văn hoá $C_z(t) \in [0,1]^k$ (khoảng 5–8 chiều) mô tả các yếu tố văn hoá trọng yếu: ví dụ Tradition Rigidity, Innovation Openness, Collective Trust, Violence Tolerance, Institutional Respect, Myth Intensity… Các thành phần của $C_z$ được giữ trong [0,1] (clamp hoặc drift chậm). Giá trị này chỉ điều chỉnh nhạy cảm/với ngưỡng khủng hoảng (ví dụ nền văn hoá khắt khe sẽ kích phát bất ổn mạnh hơn).
Động lực $C_z$:
Drift nội sinh: $C_z(t+1) = C_z(t) + \epsilon \cdot \text{InternalDynamics}$, với $\epsilon$ rất nhỏ (thay đổi chậm qua thời gian).
Sự kiện: Các event quan trọng có thể làm thay đổi $C_z$ một cách tức thời (gọi $\Delta C_{\text{event}}$ ∈ [0,1]). Khi $C_z$ ở gần 0 hoặc 1, có đà quán tính khiến thay đổi khó khăn hơn.
Lan truyền văn hoá: $C_z$ có thể lan truyền giữa vùng lân cận:
C
z
(
t
+
1
)
+
=
β
∑
neighbor
(
C
neighbor
−
C
z
)
,
C 
z
​
 (t+1)+=β∑ 
neighbor
​
 (C 
neighbor
​
 −C 
z
​
 ),
với $\beta$ rất nhỏ hoặc clamp, đảm bảo $C_z \in [0,1]^k$. Các vector văn hoá lan toả giúp các vùng liên thông gần gũi hơn; tuy nhiên, chúng không trực tiếp thay đổi trạng thái vật chất, chỉ ảnh hưởng gián tiếp lên khả năng xảy ra khủng hoảng hoặc chuyển đổi chính trị trong tương lai.
4.5. Thực thể chính trị (Institutional Entity)
Khi một phong trào chính trị (có trong CivilizationResidual) tồn tại đủ lâu, nó được hình thành thành một Entity. Mỗi Entity có các thuộc tính: ideology_vector (ý thức hệ định hướng), institutional_memory (kỷ niệm tổ chức), org_capacity (sức mạnh tổ chức), legitimacy, influence_map (phân bố ảnh hưởng trên các Zone).
Entity không bất tử: khi org_capacity và ảnh hưởng liên tục giảm (do thất bại hoặc áp lực), cuối cùng Entity sẽ chết và giải thể. Sự kiện chết của Entity tạo ra Myth Scar như đã mô tả (trường ký ức và biểu tượng của Entity sẽ lan tỏa trong vùng).
4.6. Ly khai (Secession) & Kiến trúc Vùng cố định
Mỗi vùng có áp lực ly khai $P_z$ tính từ sự chênh lệch văn hoá và căng thẳng vật chất-politic:
P
z
=
a
⋅
D
z
+
b
⋅
S
z
−
c
⋅
InstitutionalTrust
z
,
a
,
b
,
c
≥
0
,
P 
z
​
 =a⋅D 
z
​
 +b⋅S 
z
​
 −c⋅InstitutionalTrust 
z
​
 ,a,b,c≥0,
với $D_z$ = độ lệch văn hoá so với thủ đô, $S_z$ = stress chính trị/kinh tế (đã chuẩn hoá).
Quá trình ly khai gồm các giai đoạn: Stable → Agitating (khi $P_z > T_{\text{agitate}}$) → Destabilized → Split (khi $P_z > T_{\text{split}}$ duy trì trong thời gian $\tau_2$). Khi split xảy ra, chỉ đổi Owner_Regime và điều chỉnh lại biên giới vùng; không tạo vùng mới (đảm bảo topology cố định). Trong engine Rust, chỉ cho phép ZoneCommand::Spawn/Destroy để khởi tạo hoặc cho trường hợp đặc biệt, không cho phép thay đổi topology thường xuyên trong tick bình thường.
4.7. Đa-văn-minh (Multi-Civilization)
Dựa trên cụm vùng cùng văn hoá hoặc liên kết (plus có Myth Scar tương đồng), văn minh emergent xuất hiện. Khi một nền văn minh phát triển quá nhanh (overextension), nó dễ sụp đổ (Meta-Cycle) và để lại Residual Form. Nếu một nền văn minh A xâm lược và nuốt B, lõi văn hoá của B có thể trở thành Latent Attractor trong A (ý là văn minh B vẫn tiềm ẩn trong lịch sử A, không bao giờ kết thúc hoàn toàn). Tương tự, “không kết thúc lịch sử” (No end-of-history) được mô phỏng bằng cơ chế này: khi một văn minh biến mất, lõi tri thức của nó vẫn tồn tại dưới dạng rào cản latent.
5. Đa-vũ trụ & Quy mô (Multiverse and Scaling)
5.1. Multiverse theo mô hình DAG
Hệ thống có thể quản lý nhiều Multiverse (tập hợp Universe). Mỗi multiverse chứa các Universe con có quan hệ cha-con theo định nghĩa DAG (graph có hướng không chu kỳ). Mô hình lưu trữ trên DB:
Bảng multiverses (không gian thí nghiệm).
Bảng universes với khóa parent_id (liên kết đẳng hướng giữa các universe trong multiverse).
Bảng universe_states/snapshots lưu thời điểm (tick) và state_vector cho mỗi universe (TimescaleDB).
Bảng branch_events lưu fork hoặc collapse (điểm nhánh).
Bảng universe_interactions lưu giao thoa (va chạm, chia sẻ tri thức) giữa các universe.

5.3. Hội tụ Đa vũ trụ & Điểm Omega (Multiverse Convergence)
Khi các vũ trụ trong cùng một Đa vũ trụ đạt đến sự tương đồng về Thiên Đạo (Resonance), chúng bắt đầu quá trình **Hội tụ (Convergence)**.
- **Resonance Synergy:** Các vũ trụ cộng hưởng sẽ trao đổi `KnowledgeCoreSignature`, dần dần đồng bộ hóa thực tại.
- **Timeline Synthesis (Merge):** Hai nhánh lịch sử có thể hợp nhất thành một "Vũ trụ Prime", kết hợp các thực thể tối cao và di sản văn hóa từ cả hai nguồn.
- **Vũ trụ Omega:** Trạng thái kết thúc tuyệt đối khi toàn bộ đa vũ trụ thăng hoa thành một ý thức thống nhất (Apotheosis) hoặc tan biến vào Hư vô tuyệt đối (Heat Death).
5.2. Thành phần Kiến trúc Chính
Simulation Engine (Rust Core): Như đã mô tả ở trên (3-phase tick, SlotMap, parallel update).
API Gateway & Account Service: Quản lý xác thực, phân quyền (RBAC), quota người dùng.
Orchestration (Laravel): Như mục 2.2, điều phối lifecycle Universe, quản lý Saga, giao tiếp engine, LLM, DB.
Observer Service: Sử dụng WebSocket và Redis Streams (universe:events:{multiverse_id}) để phát các sự kiện thời gian thực ra dashboard và UI, theo dõi tiến trình simulation.
Thành phần cấp Domain trong Laravel: Đã đề cập ở phần 2.2 (WorldTemplate, Universe, Simulation, EventStream, Narrative, AIResearch).
Bảng và lớp chính: Những thành phần quan trọng trong Laravel Domain thể hiện như sau:
universe_snapshots: bảng (universe_id, tick, state_vector, entropy, stability_index, metrics). Chỉ mục (universe_id, tick).
UniverseSnapshotRepository: Lớp lưu/truy xuất snapshot.
UniverseRuntimeService: Gọi advance(), thực thi tick engine, lưu snapshot.
SagaService: Sinh Universe, chạy batch, fork, khởi nguyên v3.
MetricsExtractor: Từ UniverseSnapshot trích xuất UniverseMetrics (entropy trend, complexity, stability) để phục vụ AI.
UniverseEvaluatorInterface: Đưa ra kết quả đánh giá (ip_score, đề xuất fork/continue/archive, mutation suggestion) dựa trên metrics.
WorldEvolutionKernel: Lớp gốc của engine ở cấp PHP (trong thực tế, tiến trình nhị phân Rust chiếm phần lớn).
UniverseStyle, StyleAdvisorService, DigestArcAction, SerialArcPlanner, DecisionEngine như đã nêu ở trên để hỗ trợ phát triển narrative và quyết định tác vụ cao hơn.
Quy mô (Scaling): Trong tương lai, hệ thống mở rộng theo cấu trúc phân tán: engine Rust có thể chạy cluster, CSDL Timescale/Graph/Vector shards, Redis/Kafka cluster. Orchestration sẽ auto-scale (Kubernetes), trong khi API public giữ ổn định.
6. Chuyển ngữ ngữ cảnh & Kể chuyện (Narrative)
6.1. Ba tầng chuyển ngữ (Contextual Translation)
Để chuyển dữ liệu mô phỏng khô khan thành nội dung văn học/mô tả, hệ thống dùng 3 tầng cầu nối:
Tầng 1 – Flavor Text: Các giá trị số (ví dụ epistemic_instability = 0.9) sẽ được chuyển thành văn bản phong phú từ kho Flavor Text, không xuất thẳng số. Ví dụ, 0.9 có thể trở thành “môi trường hỗn loạn tột độ”.
Tầng 2 – Event Triggers: Các tín hiệu mô phỏng (ví dụ bất ổn xã hội, ly khai, chiến tranh) được kết hợp với bản đồ vector ngữ cảnh (năng lượng, kỹ thuật, văn hoá…) để chọn ra tên sự kiện/mẫu câu phù hợp cho prompt. Ví dụ “Khởi nghĩa Nông dân Đòi Lương thực trong Kỷ nguyên Mạt Pháp”.
Tầng 3 – Residual Injection: Khi tạo prompt cho LLM, phần đuôi prompt sẽ bao gồm lịch sử sâu (“Hãy nhớ, 2000 năm trước có trận Đại Chiến…”) lấy từ CivilizationResidual hoặc Myth Scars của khu vực, tăng độ sâu và tính kết nối của văn bản cuối cùng.
6.2. AI Narrative
Dựa trên Perceived Archive (chứa những gì AI nhìn thấy, bị giới hạn bởi Epistemic Instability) cộng với chuỗi Event và Flavor Text đã tạo, Narrative AI sẽ biên soạn thành Chronicle, Myth hoặc báo cáo. AI không truy cập Canonical Archive và không chỉnh sửa bất kỳ trạng thái mô phỏng nào.
6.3. Cơ sở dữ liệu Narrative & LTM
Hệ thống sử dụng mô hình lưu trữ phân tầng cho tri thức:
- **Short-term Memory:** Context window của LLM (hiện tại ~16k-128k token).
- **Long-term Memory (LTM):** Lưu trữ bền vững trong `ai_memories` (PostgreSQL) với metadata quản lý vòng đời:
    - **Versioning:** `embedding_version` hỗ trợ nâng cấp model embedding (v1 -> v2) mà không mất dữ liệu cũ.
    - **Source Tracking:** `source` (narrative, analysis, user) để phân loại nguồn gốc ký ức.
    - **Forgetting Mechanism:** `expires_at` và `ttl_days` tự động loại bỏ thông tin nhiễu/ngắn hạn.
    - **Importance Score:** `importance` giúp ưu tiên retrieval thông tin quan trọng trong context hạn hẹp.
- **External Knowledge:** GraphDB (tương lai) lưu quan hệ thực thể phức tạp.

PostgreSQL vẫn là master cho dữ liệu người dùng và tính toán nghiệp vụ; TimescaleDB dành riêng cho lưu trữ snapshot.
7. Định nghĩa công thức toán học và thông số
Các công thức chính đã nêu ở trên được tóm tắt lại như sau để tham khảo; khi triển khai cần định nghĩa rõ đơn vị (nếu có) và giá trị tham số:
Agent (Micro): Trait vector $\mathbf{T}_{17}\in[0,1]^{17}$; Action Utility:
ActionUtility
=
BaseScore
+
T
17
⊤
w
+
StructuredMicroNoise
(
Seed
,
Tick
,
Agent
)
,
ActionUtility=BaseScore+T 
17
⊤
​
 w+StructuredMicroNoise(Seed,Tick,Agent),
theo mục 3.1.
Material (Zone): Invariant: $\text{structured_mass} \le \text{base_mass}$. Tổ chức: $\text{entropy} \mathrel{+}= k_1\cdot \Delta\text{structured}$. MaterialStress:
MaterialStress
∝
(
entropy
)
+
(
base_mass depletion ratio
)
+
(
structured fragility
)
MaterialStress∝(entropy)+(base_mass depletion ratio)+(structured fragility)
theo phần 4.1.
Tech Ceiling: (văn minh $k$)
Theoretical_Ceiling
k
=
base_physical_cap
×
cultural_openness
×
material_surplus_factor
×
institutional_stability
.
Theoretical_Ceiling 
k
​
 =base_physical_cap×cultural_openness×material_surplus_factor×institutional_stability.
Biến đổi công nghệ: $\Delta \text{Tech} \propto (\text{Ceiling} - \text{Frontier})$.
Cultural Vector ($C_z$): $C_z(t)\in[0,1]^k$. Drift: $C_z(t+1) = C_z(t) + \epsilon,\text{InternalDynamics}$. Lan truyền: $C_z(t+1) \mathrel{+}= \beta \sum_{\text{neighbor}} (C_{\text{neighbor}} - C_z)$. ΔC do event ∈ [0,1].
Secession Pressure: $P_z = a D_z + b S_z - c,\text{InstitutionalTrust}_z$ ($a,b,c\ge0$). Ngưỡng Agitate và Split quyết định giai đoạn ly khai.
Myth Scar lan tỏa: Influence ∝ $\exp(-\gamma,\text{distance})$ (γ>0).
Meta-Cycle Trigger và Hiệu ứng: Kích hoạt khi SCI < CriticalThreshold. Khi xảy ra: ~80% structured collapse, ~50% embodied knowledge mất, base material giữ nguyên, KnowledgeCoreSignature bị xuyên âm.
Institutional Memory: Entities tích lũy memory với hệ số hao mòn chậm $\lambda \approx 1$ (gần 1).

8. Mô-đun Material System (Active Concepts / Khái niệm hoạt động)

Mục tiêu: Chuyển khái niệm Material (vật liệu / meme / khái niệm hoạt động) thành mô-đun kỹ thuật đầy đủ, triển khai được trong Laravel/NextJS — gồm lớp Material (ontology, vòng đời), cơ chế áp lực lên hệ thống (entropy, order, innovation…), Mutation DAG (trigger + seeder theo Origin).

8.1. Khái niệm chung

**Material:** Đơn vị ý tưởng/kết cấu văn hóa (tương tự meme): lặp lại, tự sao chép, ảnh hưởng lên hệ thống. Ví dụ: tập tục xã hội, công nghệ nông nghiệp, tổ chức xã hội. **Ontology:** Physical (công cụ, hạ tầng), Institutional (quy tắc, định chế), Symbolic (ý niệm, tín ngưỡng), Behavioral (hành vi, thói quen). **Tiến hóa:** DAG mô tả đột biến và phối hợp đa nguồn; Material sinh biến thể theo thời gian và mức innovation (đa mẹ).

8.2. Lớp Material và vòng đời

**Attributes:** name, description, ontology, **trạng thái vòng đời** (Dormant | Active | Obsolete), Inputs, Outputs, Pressure coefficient (tác động lên vector hệ thống). **Vòng đời:** Dormant → Active (đủ Input/trigger) → Obsolete (output suy yếu hoặc bị thay thế); có thể tái kích hoạt. **Methods:** Chuyển trạng thái, cập nhật ảnh hưởng (Pressure Resolver), sinh đột biến (DAG Mutator).

**Material Lifecycle Engine:** Theo dõi điều kiện Dormant→Active và Active→Obsolete; khi Active gọi Pressure Resolver; khi Material mới sinh từ DAG thì khởi tạo trạng thái (thường Dormant).

8.3. Pressure Resolver

Material Active tạo áp lực lên Entropy, Order, Innovation, Growth, Trauma, … Công thức: $\Delta\text{Entropy} = k \cdot \text{Output} \cdot \text{pressure\_entropy}$ (tương tự cho từng vector). Output × Pressure coefficient quyết định ảnh hưởng; mỗi Material có bảng hệ số pressure. Cập nhật biến hệ thống (cộng/trừ theo dấu hệ số). Quan hệ Input/Output: mỗi Material có Input (nhu cầu, ví dụ Water, Low Entropy) và Output (tạo ra, ví dụ Population Growth, Stability); ví dụ Rice Farming → +Order, +Growth, +Entropy; Industrialization → +Growth, −Order, +Innovation. Chi tiết bảng Input/Output theo từng Material xem *docs/system/09-material-system.md*.

8.4. Mutation DAG và Seeder

**DAG:** Nút = Material/biến thể; cạnh cha → con; đa mẹ đa thế hệ. **Trigger:** epoch, Innovation, sự kiện; mỗi cạnh gắn điều kiện. **Phân kỳ theo ngữ cảnh:** World Context quyết định nhánh biến thể (vd. "Nông nghiệp Lúa nước" → nhiều kỹ thuật canh tác theo vùng). **Seeder:** Origin (Vietnamese, European, Futuristic…) có danh sách Material; khởi tạo instances, trạng thái ban đầu, DAG ban đầu. Ví dụ Vietnamese Origin: Nông nghiệp Lúa nước, Thờ cúng Tổ tiên, Lễ hội Đền đài, Hành nghề thủ công truyền thống.

8.5. DB và Laravel

**Bảng:** materials (định nghĩa), material_instances (instance trong thế giới), material_effects/material_pressures (chi tiết tác động), material_mutations (DAG: parent_id, child_id, trigger_condition), material_logs (tùy chọn). **Models:** Material, MaterialInstance, MaterialEffect, MaterialMutation; MaterialSeeder cho Origin.

**Ví dụ ảnh hưởng:** Nông nghiệp Lúa nước → +Order, +Growth, +Entropy; Thờ cúng Tổ tiên → +Order, −Innovation, +Trauma; Công nghiệp hóa sớm → +Growth, −Order, +Innovation; Công nghệ kĩ thuật số → +Innovation, +Entropy, +Order.

9. Lộ trình phát triển (Roadmap)
Phiên bản chính thức **V6** tập hợp toàn bộ kiến trúc và tri thức, tích hợp từ các module cũ (gồm mô-đun Material System – Active Concepts), bổ sung Cascade Engine mở rộng, Civilization Residual, WorldSeed Archetypes, cấu trúc Cosmology thống nhất, pipeline Contextual Translation 3 tầng.
Các tính năng đã hoàn thiện/triển khai:
- **Long-term Memory (LTM):** Cơ chế lưu trữ vector memory với metadata quản lý vòng đời (TTL, versioning).
- **Material System:** Lifecycle Engine, Pressure Resolver, Mutation DAG.
- **Narrative AI Pipeline:** Flavor Text, Residual Injection, Chronicle Generation.
- **Simulation Engine:** Cascade loops, Macro/Micro modes.

Các hạng mục tiếp theo:
- **GraphDB Integration:** Neo4j/ArangoDB cho truy vấn quan hệ phức tạp.
- **Dedicated VectorDB:** Chuyển đổi từ Postgres vector emulation sang Qdrant/Milvus khi quy mô dữ liệu lớn.
- **Distributed Scaling:** Rust cluster và Kubernetes deployment.

Tài liệu này cung cấp đầy đủ định nghĩa hệ thống WorldOS **V6** theo phong cách kỹ thuật, nhằm hỗ trợ đào tạo và bảo trì cho lập trình viên.

---

## Phụ lục A. Triết lý Huyền Nguyên và ánh xạ vào WorldOS

### A.1. Bảng tiên đề T1–T8

| Tiên đề | Ý nghĩa triết học | Áp dụng WorldOS V6 |
|---------|--------------------|---------------------|
| **T1 — Phân biệt** | Mọi xác định đòi hỏi ranh giới A/không-A. | World vs Universe vs Timeline; Zone, Regime, Entity; Event trigger khi vượt ngưỡng. |
| **T2 — Quan hệ** | Phân biệt luôn tạo cặp quan hệ. | Graph Node/Edge, Trade, Diffusion; Cascade; Material/Knowledge flow. |
| **T3 — Cấu trúc** | Tồn tại = ổn định tương đối của mẫu quan hệ. | State vector, CivilizationResidual, Entity; Fixed Zone Topology. |
| **T4 — Nhân quả** | Nhân quả = tính liên tục biến đổi cấu trúc. | CascadeEngine, Pressure→Event; Deterministic + controlled noise. |
| **T5 — Trường khả thể** | Tự do = độ rộng không gian tái cấu hình. | Macro/Micro mode; Fork/Branch tại điểm tới hạn (Branch Injection). |
| **T6 — Telos nổi sinh** | Mục đích nổi lên cục bộ, không áp đặt vũ trụ. | Political Entity, Civilization; AI Evaluator (IP score, fork/archive). |
| **T7 — Ý thức phản tư** | Ý thức khi hệ có mô hình nội tại về chính mình. | Perceived vs Canonical Archive; StyleAdvisor, DigestArc. |
| **T8 — Hữu hạn** | Mọi hệ phân biệt đều hữu hạn (Huyền Nguyên). | Epistemic Instability, Myth Scar, Knowledge Distortion; giới hạn mô tả. |

### A.2. Tóm tắt triết lý Huyền Nguyên (self-contained)

**Huyền Nguyên** ký hiệu cho toàn thể cấu hình không thể bị đóng kín từ bên trong bởi bất kỳ hệ phân biệt hữu hạn nào — không phải thực thể, không phải phi cấu trúc; là **giới hạn cấu trúc** của mọi hệ.

- **Phân biệt:** Hành động tạo ranh giới A / không-A; điều kiện tối thiểu của mọi xác định. Phủ nhận phân biệt vẫn là một phân biệt.
- **Quan hệ:** Phát sinh tất yếu từ phân biệt; không có thực thể cô lập.
- **Cấu trúc:** Mẫu quan hệ ổn định tương đối qua biến động; tồn tại thực tế = ổn định tạm thời.
- **Nhân quả:** Liên tục hình thức của biến đổi cấu trúc; không biến đổi vô căn trong hệ mô tả được.
- **Trường khả thể / Tự do:** Độ rộng không gian tái cấu hình từ cấu hình hiện tại.
- **Telos:** Nổi lên cục bộ ở cấu trúc đủ phức hợp (tự duy trì, mô hình tương lai, ưu tiên trạng thái); không cần telos vũ trụ.
- **Ý thức:** Nổi lên khi hệ chứa mô hình nội tại về chính mình và dùng nó để điều chỉnh hành vi.
- **Hữu hạn (T8):** Mọi hệ phân biệt đều hữu hạn; Huyền Nguyên = bảo chứng cho giới hạn nội tại.

*Huyền là tầng sâu không thể đóng kín. Nguyên là điều kiện của mọi khởi đầu.*

---

10. Hệ thống Tự trị (Autonomic Systems)
WorldOS V6 vận hành theo nguyên tắc tự động hóa tối đa, mô phỏng một thực tại sống động không cần can thiệp liên tục.

10.1. Linh Cơ (Decision Engine)
Dịch vụ `AutonomicDecisionEngine` đóng vai trò "Linh Cơ" của mỗi Vũ trụ, tự động đưa ra các quyết định chiến lược:
- **Tự động rẽ nhánh (Auto-Fork):** Khi phát hiện một kịch bản tiềm năng đầy hứa hẹn hoặc một khủng hoảng cần tách nhánh nghiên cứu.
- **Tự động đóng băng (Halt):** Đóng băng các nhánh lịch sử ít tiến triển để tiết kiệm tài nguyên hệ thống (Branch Concurrency Limit).

10.2. Thiên Đạo Tự Vận (World Autonomic Engine)
Đây là tầng tự trị cao nhất, vận hành ở cấp độ Thế giới (World).
- **Self-Regulating Axioms:** Nếu Đa vũ trụ rơi vào trạng thái nguy cấp (Entropy trung bình quá cao), Thiên Đạo sẽ tự động thực thi **Axiom Shift** (ví dụ: giảm entropy_rate) để duy trì sự tồn tại của hệ thống.
- **Sự cân bằng vĩnh cửu:** Đảm bảo thực tại không bao giờ rơi vào cái chết nhiệt tuyệt đối trừ khi đó là mục tiêu của kịch bản, tự động nới lỏng các giới hạn kỹ thuật (Tech Ceiling) khi văn minh bị đình trệ.

---
**Hết tài liệu đặc tả WorldOS V6.**

## Tham chiếu thêm (docs/system)

- **01-architecture-overview.md:** Kiến trúc V3 (Event-Driven Macro-Simulation, Physics/Materials/Resonance), ba trụ cột.
- **03-simulation-loop.md:** Luồng chi tiết Laravel (saga:advance-v3, RuntimeService, Kernel, Event dispatch, Resonance).
- **04-physics-engine.md:** Cosmology Domain, BasePhysicsEngine, Attractors, Bifurcation, World Scars, công thức vi phân đơn giản hóa.
- **09-material-system.md:** Material như Active Concept, ontology, vòng đời, Pressure System, bảng Input/Output, Mutation DAG, Seeder theo Origin.