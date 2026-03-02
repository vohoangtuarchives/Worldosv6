# WorldOS V5 — Kiến trúc thống nhất & Lộ trình

**Phiên bản:** 1.0 | **Ngày:** 2025-02-26  
**Bản phát hành chính thức:** `docs/WORLDOS_V5_ARCHITECTURE.md`

Một tài liệu duy nhất đảm bảo tính đầy đủ kiến trúc WorldOS (triết lý, cosmology, simulation, data layers, multiverse, narrative, DB, lộ trình). Có thể thay thế toàn bộ tài liệu cũ khi triển khai.

---

## 1. Triết lý & Nguyên tắc

### 1.1. Tuyên bố sứ mệnh V5

WorldOS là **Động cơ Mô phỏng Tiến hóa Văn minh** (Civilizational Dynamics Engine), không phải công cụ nhắc viết truyện. Mục tiêu: nuôi một vũ trụ có lịch sử tích lũy và "sẹo" ký ức; AI đóng vai "sử gia mù" chắp bút từ sự kiện nảy sinh từ mô phỏng.

### 1.2. Ba luật sắt (kế thừa v3)

- **Luật 1 — Universe là đơn vị kinh tế:** IP sinh ra từ Universe; Saga là batch experiment.
- **Luật 2 — Authority tuyệt đối:** World = container luật bất biến; Universe = state machine tiến hóa; Narrative/AI không sửa state trực tiếp.
- **Luật 3 — Snapshot-first:** Rollback/fork/clone dựa trên snapshot; state là nguồn chân lý.

### 1.3. Mô hình Não Trái / Não Phải

- **Não Trái (Simulation):** Toán học thuần — vector, xác suất, động lực học; không sinh token; chỉ sinh "tín hiệu sự kiện".
- **Não Phải (Narrative/AI):** Nhận tín hiệu + bối cảnh → văn chương; bị giới hạn bởi *Màn sương Nhận thức (Epistemic Instability)* — chỉ thấy Perceived Archive, không thấy Canonical Archive.

### 1.4. Nền tảng triết học — Huyền Nguyên v2 và áp dụng vào engine

Hệ thống vận hành ở tầng **điều kiện xuất hiện** (pre-ontological). Ánh xạ khái niệm triết học → kỹ thuật:

| Tiên đề / Khái niệm | Ý nghĩa triết học | Áp dụng WorldOS V5 |
|---------------------|--------------------|----------------------|
| **T1 — Phân biệt** | Mọi xác định đòi hỏi ranh giới A/không-A. | World vs Universe vs Timeline; Zone, Regime, Entity; Event trigger khi vượt ngưỡng. |
| **T2 — Quan hệ** | Phân biệt luôn tạo cặp quan hệ. | Graph Node/Edge, Trade, Diffusion; Cascade; Material/Knowledge flow. |
| **T3 — Cấu trúc** | Tồn tại = ổn định tương đối của mẫu quan hệ. | State vector, CivilizationResidual, Entity; Fixed Zone Topology. |
| **T4 — Nhân quả** | Nhân quả = tính liên tục biến đổi cấu trúc. | CascadeEngine, Pressure→Event; Deterministic + controlled noise. |
| **T5 — Trường khả thể** | Tự do = độ rộng không gian tái cấu hình. | Macro/Micro mode; Fork/Branch tại điểm tới hạn. |
| **T6 — Telos nổi sinh** | Mục đích nổi lên cục bộ, không áp đặt vũ trụ. | Political Entity, Civilization; AI Evaluator (IP score, fork/archive). |
| **T7 — Ý thức phản tư** | Ý thức khi hệ có mô hình nội tại về chính mình. | Perceived vs Canonical Archive; StyleAdvisor, DigestArc. |
| **T8 — Hữu hạn** | Mọi hệ phân biệt đều hữu hạn (Huyền Nguyên). | Epistemic Instability, Myth Scar, Knowledge Distortion; Loại A/B/C. |

### 1.5. Triết lý bổ sung

- **Entropy & vật chất:** Entropy không biến mất; thịnh vượng cục bộ = xuất entropy ra biên. Engine: Material Stress, decay, Meta-Cycle.
- **No end-of-history:** Đa văn minh cạnh tranh; lõi bị nuốt thành Latent Attractor, có thể tái kích hoạt. Engine: Irreducible Civilizational Core, Myth Scar, Path Dependency.
- **Siêu cấu hình:** Huyền Nguyên = giới hạn của mọi mô tả, không phải hỗn mang. Engine: Màn sương nhận thức, KnowledgeCoreSignature distortion.

---

## 2. Mô hình World / Universe / Timeline (Cosmology)

### 2.1. World (Thế giới khung)

Tầng cao nhất. Chỉ chứa luật vật lý mỏ neo: Archetypes (WorldSeed), hằng số ma pháp/khoa học, biên độ vector (Ontology, Epistemic, Civilization, Energy). World không có thời gian chạy; là "bộ gene" cho mọi Universe con.

**World và vật chất:** World định nghĩa **ontology vật chất**: mọi thực thể đều là cấu trúc tổ chức vật liệu (Axiom M1); entropy không biến mất (M2); entropy tích lũy → chuyển pha (M3). Các hằng số/biên độ (energy_density, tech ceiling) quy định luật vật chất cho Universe con.

### 2.2. Universe (Vũ trụ cụ thể)

Một World có thể có nhiều Universe anh em. Mỗi Universe là state machine tiến hóa (tick, state vector, snapshot), tuân luật World cha. Có thể fork (parent_universe_id), va chạm/giao thoa (multiverse).

**Universe và Material/Knowledge:** Mỗi Universe có trạng thái vật chất và tri thức theo Zone: Material (base_mass, structured_mass, free_energy, entropy), Knowledge (EmbodiedKnowledge, Residual, KnowledgeCoreSignature). World chỉ đặt giới hạn và quy tắc; Universe lưu giá trị theo thời gian.

### 2.3. Timeline

Sự sống thực sự của lịch sử. Timeline xuất hiện khi Universe chạy mô phỏng hoặc **fork** do sự kiện bước ngoặt. Lịch sử tích lũy (snapshots, events, residuals) gắn Universe; mỗi nhánh là một timeline.

### 2.4. Lưu trữ (tóm tắt)

multiverses → universes (parent_id) → universe_states/snapshots (TimescaleDB); branch_events (fork/collapse); universe_interactions (va chạm/giao thoa).

---

## 3. Động cơ mô phỏng (Simulation Engine)

### 3.1. Event-driven và CascadeEngine

Áp lực (Pressure) tích lũy qua Drift. Chỉ khi vượt `COLLAPSE_THRESHOLD` mới trigger sự kiện; một event có thể cascade 3–4 event khác đến khi cân bằng. Không chạy full tick mỗi năm.

### 3.2. Branch Injection và Criticality

Tại điểm **tới hạn** (Criticality Detector), hệ thống cho phép tạo nhánh mới bằng **tiêm External Shock** — không đổi Macro Law hay bản chất tác nhân. Fork = mở thêm trường khả thể (T5); AI/Player khảo sát độ rẽ nhánh mà không phá tính nguyên vẹn Timeline.

### 3.3. Hai chế độ phân giải

- **Macro (~90%):** Chỉ biến tổng hợp — Faction Dominance, Polarization Index, Fatigue. Không spawn Agent.
- **Micro (Crisis Window):** Khi Instability Gradient vượt ngưỡng, zoom-in Semi-Agent (17D Trait, Archetype, Ring Buffer); Sparse Graph + Faction Influence Field; hết window → Macro Delta + Event → discard Agent.

### 3.4. Giải phẫu Agent (Micro Mode)

- **17D Trait Vector (vector 17 chiều):** Mỗi Agent trong Micro Mode mang một vector đặc trưng **17 chiều** (17D), trị số từng chiều trong [0, 1]. Tài liệu Simulation Engine cũ ghi 12D với 4 nhóm; bản V5 chuẩn hóa **17 chiều** — **danh sách đầy đủ 17 tên chiều cần được khôi phục từ spec gốc hoặc định nghĩa lại** trong spec kỹ thuật khi triển khai. Phần đã có từ tài liệu cũ (4 nhóm, ví dụ):
  - **Quyền lực (Power):** Dominance, Ambition, …
  - **Xã hội (Social):** Loyalty, Empathy, …
  - **Nhận thức (Cognition):** Pragmatism, …
  - **Phản ứng cảm xúc (Emotional):** Fear, Vengeance, …
  Các chiều còn lại (để đủ 17) thuộc các nhóm trên hoặc nhóm bổ sung — cần bảng ánh xạ index → tên chiều trong code/spec.
- **Archetype:** Warlord, Zealot, Opportunist, …
- **Short-term Memory:** Ring Buffer cap 5 (ức chế/kích thích tạm thời).

**Công thức quyết định hành động:**
$$ \text{ActionUtility} = \text{BaseScore}(\text{Archetype}, \text{ZoneContext}) + \mathbf{T}_{17}^\top \mathbf{w} + \text{StructuredMicroNoise}(\text{Seed}, \text{Tick}, \text{Agent}) $$
với $\mathbf{T}_{17} \in [0,1]^{17}$ là vector 17 chiều trait, $\mathbf{w}$ là Context Weight Vector.

Agent khởi tạo deterministically từ Macro State + Universe Seed.

### 3.5. Pressure & Residuals

CivilizationResidual lưu "sẹo" (war_trauma, …); decay theo thời gian; còn tồn tại thì cộng vào Áp lực Xã hội. Pressure = f(inequality, entropy, trauma, material stress).

### 3.6. Hybrid Epoch (Temporal Execution)

- **Micro Tick:** Entropy Decay, Cultural Diffusion, Drift Material Extraction (nhẹ, liên tục).
- **Macro Event Trigger:** Cú sốc lớn (Regime Split, Spawn Faction, Secession) → Event Priority Queue.
- **Batch Epochs:** Offline mode; ví dụ 1000 MicroTick = 1 Epoch; kết thúc Epoch mới gửi Data Snapshot/Diff lên Laravel. Tránh đốt I/O.

### 3.7. Entry point và Genesis v3

- **Entry point duy nhất:** `UniverseRuntimeService::advance(universeId, ticks)`. Kernel: Load World + Universe → tick/cascade → next state → snapshot.
- **Genesis v3:** (1) WriterGenesisController.store → tạo Saga (name, preset). (2) Gọi `SagaService.genesisV3(saga, 10)` (không dispatch RunSagaSimulationJob). (3) genesisV3: tạo World từ preset → spawnUniverse(World) → SagaWorld(saga, world, universe, sequence=1) → runBatch(saga, 10).

### 3.8. Vai trò AI (ngoài Narrative)

- **Theory Discovery (Analytical AI):** Đọc feature vectors 100+ Universes; Clustering, tìm quy luật sụp đổ trong Trait distribution.
- **Narrative Rendering (Compiler AI):** Event Timeline → Chronicle, Myth, báo cáo.
- **Evolutionary Search (Search AI):** Mutate macro params trong batch; tối đa "Interestingness" (tần suất Phase Transition). AI không vào Inner Simulation Loop.

### 3.9. Rust Core (tóm tắt)

- **SlotMap:** `ZoneId`, `Universe { zones: SlotMap<ZoneId, Zone>, knowledge_core, global_entropy }`; không `Arc<Mutex>`; Rayon data parallelism.
- **Ba phase mỗi tick:** (1) **Local Zone Update (parallel):** zones.par_iter_mut() → ZoneDelta (+ Commands). (2) **Global Reduction (single thread):** Global Entropy, KnowledgeCore từ Deltas. (3) **Cross-Zone Diffusion (single thread):** Trade/Entropy giữa Zone kề.
- **ZoneCommand:** Trong parallel loop cấm sửa mảng; chỉ emit `ZoneCommand::Spawn` / `ZoneCommand::Destroy` vào Queue; Phase 2 Sync thực thi.

Laravel: Snapshot, Schedule Job, API Dashboard, gửi trigger_event qua gRPC. Mã vật lý nằm hết trong Kernel Rust.

---

## 4. Các lớp dữ liệu & quy trình

### 4.1. Material (theo Zone)

Mỗi Zone: `base_mass`, `structured_mass`, `free_energy`, `entropy`. **Invariant:** $\text{structured\_mass} \le \text{base\_mass}$.

**Biến đổi vật lý:**
- **Tổ chức (Organization):** base → structured; cần `extraction_rate`, `stability`, `tech_efficiency`. Hiệu ứng: $\text{entropy} \mathrel{+}= k_1 \cdot \Delta\text{structured}$.
- **Decay:** Mỗi tick, `structured_mass` giảm theo `entropy`.
- **Conflict/Shock:** Giảm mạnh `structured_mass`, tăng vọt `entropy` tại vùng.

**MaterialStress** (đóng góp Secession Pressure và Entity Spawn Probability):
$$ \text{MaterialStress} \propto (\text{entropy level}) + (\text{base\_mass depletion ratio}) + (\text{structured fragility}) $$

### 4.2. Knowledge & Tech

- **Hard Tech:** phần structured_mass (hạ tầng); mất nhanh khi bạo loạn/Meta-Cycle.
- **Soft Tech (Embodied Knowledge):** decay chậm hơn, dễ Mythification khi entropy cao.

**Tech Ceiling (mỗi nền văn minh $k$):**
$$ \text{Theoretical\_Ceiling}_k = \text{base\_physical\_cap} \times \text{cultural\_openness} \times \text{material\_surplus\_factor} \times \text{institutional\_stability} $$
$$ \text{Current\_Frontier}_k \le \text{Theoretical\_Ceiling}_k, \qquad \Delta\text{Tech} \propto (\text{Ceiling} - \text{Frontier}) $$
Material Stress trì hoãn Frontier; đạt trần → Stagnation.

Knowledge: EmbodiedKnowledge → KnowledgeResidual (sau collapse) → **KnowledgeCoreSignature** (trường lõi xuyên chu kỳ, bị distortion theo Global Entropy).

### 4.3. Meta-Cycle Engine

Khi **Structural Coherence Index (SCI)** $< \text{CriticalThreshold}$ (có stochastic nhỏ) → trigger Meta-Cycle. Hiệu ứng: $\approx 80\%$ StructuredMaterial sụp đổ; $\approx 50\%$ EmbodiedKnowledge quét; BaseMaterial không mất; KnowledgeCoreSignature bẻ cong seed kỷ nguyên sau (lịch sử lặp lại "có âm vang").

### 4.4. Cultural State Vector ($C_z$)

Vector văn hóa Zone $z$: $C_z(t) \in \mathbb{R}^k$ ($k$ = 5–8 chiều). Các chiều ví dụ: Tradition Rigidity, Innovation Openness, Collective Trust, Violence Tolerance, Institutional Respect, Myth Intensity.

**Động lực:**
- **Drift nội sinh chậm:** $C_z(t+1) = C_z(t) + \epsilon \cdot \text{InternalDynamics}$.
- **Ảnh hưởng sự kiện:** $\Delta C_{\text{event}}$ kẹp trong [0,1].
- **Lan truyền không gian:** $C_z(t+1) \mathrel{+}= \beta \sum_{\text{neighbor}} (C_{\text{neighbor}} - C_z)$.

Culture scale hóa crisis sensitivity và instability threshold; không trực tiếp đổi state $X(t)$.

### 4.5. Institutional (Political Entity)

Phong trào tồn tại đủ lâu → Entity (ideology_vector, institutional_memory, org_capacity, legitimacy, influence_map). Entity không bất tử; capacity/influence suy kéo dài → chết.

### 4.6. Residuals & Myth Scar

CivilizationResidual: sẹo (vd. war_trauma) + decay; còn thì cộng Pressure. Myth Scar: Entity lớn chết → trường (ideology_vector_snapshot, emotional_intensity, trauma_level, symbolic_power). **Lan tỏa:** propagation kernel $\propto \exp(-\gamma \cdot \text{distance})$; vùng scar cao khó ổn định.

### 4.7. Secession & Fixed Zone Topology

**Áp lực ly khai (Secession Pressure):**
$$ P_z = a \cdot D_z + b \cdot S_z - c \cdot \text{InstitutionalTrust}_z $$
với $D_z$ = Cultural Divergence so với thủ đô, $S_z$ = Stress chính trị/kinh tế vật chất.

Giai đoạn: Stable → Agitating ($P_z > T_{\text{agitate}}$) → Destabilized → Split ($P_z > T_{\text{split}}$ đủ thời gian $\tau_2$). Split chỉ đổi Owner_Regime và biên giới; **không tạo Zone mới** (topology cố định O(E)).

### 4.8. Multi-Civilization

Văn minh emergent (cluster Zone đồng văn hóa + liên thông + scar_cluster). Overextension → sụp đổ → Residual Form. A nuốt B → lõi B thành Latent Attractor (no end-of-history).

---

## 5. Đa vũ trụ & scale

### 5.1. DAG Multiverse

(1) multiverses (container) (2) universes (định nghĩa, tick, parent_id) (3) universe_states/snapshots (TimescaleDB) (4) branch_events (fork/collapse) (5) universe_interactions (va chạm, rò rỉ, giao thoa).

### 5.2. Stack hệ thống

Client → API Gateway (auth, rate limit) → Orchestration (PHP/Laravel): vòng đời Universe, job xuống engine, DB. Simulation Engine (Rust): gRPC (sync) hoặc Message Queue (async). Account Service: identity, RBAC, quota. Observer: WebSocket, Redis Streams `universe:events:{multiverse_id}`, fan-out dashboard.

### 5.3. Laravel DDD (Bounded Context)

- `Domain\WorldTemplate\`: Macro Law, Evolution Genome.
- `Domain\Universe\`: Instance ID, Seed, Snapshot, Branch Manager.
- `Domain\Simulation\`: TickEngine, Crisis Detector, MicroSession, AgentFactory, InfluenceEngine.
- `Domain\EventStream\`: DomainEvent → phân tích.
- `Domain\Narrative\`: Read-Model + LLM → Chronicle.
- `Domain\AIResearch\`: Batch feature extraction, Novelty Search, Fitness scoring.

### 5.4. Thành phần chính (bảng)

| Thành phần | Vai trò |
|------------|--------|
| universe_snapshots | universe_id, tick, state_vector, entropy, stability_index, metrics. Index (universe_id, tick). |
| UniverseSnapshotRepository | save(Universe, metrics), getAtTick(universeId, tick), getLatest(universeId). |
| UniverseRuntimeService | advance(universeId, ticks); tick() → evolutionEngine.applyTick → snapshotRepository.save. |
| SagaService | spawnUniverse(World, ?parentUniverseId), runBatch(Saga, ticksPerUniverse), evaluate(Universe), fork(Universe, fromTick), genesisV3(Saga, ticks). |
| MetricsExtractor | UniverseSnapshot → UniverseMetrics (entropy_trend, complexity_index, stability_score). Không đưa raw state_vector vào LLM. |
| UniverseEvaluatorInterface | evaluate(UniverseMetrics) → EvaluationResult (ip_score, recommendation: fork\|continue\|archive, mutation_suggestion). |
| WorldEvolutionKernel | tickUniverse(World, Universe); validateMutation(World, MutationSuggestion); applyPressure(Universe, selectionPressure, intensity). |
| UniverseStyle | world_id, style_vector, name, version. |
| StyleAdvisorService | Trajectory → ProposeStyleChangeAction. Chạy mỗi 50 ticks. |
| DigestArcAction | Arc completed → StoryBible (long-term memory). |
| SerialArcPlanner | Emergent planning từ Tension spikes (> 0.75). |
| DecisionEngine | EvaluationResult → fork / archive / continue (optional applyPressure). |

### 5.5. Legacy (deprecated)

- **SagaRunner.runSync / simulateWorld:** Không dùng cho flow mới. @deprecated.
- **RunSagaSimulationJob:** Genesis không còn dispatch. @deprecated.
- **cosmic_snapshots (world_id, year):** Logic mới chỉ ghi universe_snapshots. Bảng giữ lại; deprecated.

### 5.6. Scale

Giai đoạn 1: Rust single process, PostgreSQL đơn, Redis đơn, PHP single container. Giai đoạn 2: Rust cluster, Sharded PostgreSQL + TimescaleDB, Redis Cluster / Kafka, Orchestration auto-scale (K8s). API giữ nguyên.

---

## 6. Narrative, Contextual Translation & Database

### 6.1. Ba tầng chuyển ngữ

- **Tầng 1 — Flavor Text:** Giá trị (vd. epistemic_instability = 0.9) → bốc từ Kho Flavor Text (theo trait/ngữ cảnh), không xuất số.
- **Tầng 2 — Event Triggers Library:** Tín hiệu (Social Instability) + Vector Map (energy_density, tech, …) → tên sự kiện/phrase cho prompt (vd. "Khởi nghĩa Nông dân Đòi Lương thực trong Kỷ nguyên Mạt Pháp").
- **Tầng 3 — Residual Injection:** Prompt kèm đuôi lịch sử ("Hãy nhớ, 2000 năm trước có trận Đại Chiến…"). CivilizationResidual / Myth Scar → chiều sâu narrative.

### 6.2. AI Narrative

Perceived Archive (Epistemic Instability) + Event + Flavor + Residual → Chronicle/Myth/Báo cáo. Không đọc Canonical Archive; không sửa state.

### 6.3. Database hiện tại và lộ trình V5

- **Hiện tại:** PostgreSQL (user, config, billing, vận hành).
- **Lộ trình:** (1) **Graph DB** (Neo4j/ArangoDB) cho network/history, quan hệ nhân vật–sự kiện, Graph RAG. (2) **Vector DB** (Qdrant/Milvus) cho WorldStateVector, tìm giai đoạn tương tự (motif lặp lại, luân hồi). PostgreSQL giữ master (account, billing).

---

## 7. Lộ trình V5

### 7.1. Kế thừa từ v4

CascadeEngine, CivilizationResidual, WorldSeed 8 Archetypes + 4 vector, Cosmology, Contextual Translation 3 tầng, PostgreSQL, hướng Graph/Vector DB.

### 7.2. V5 bổ sung (doc & kiến trúc)

Thống nhất toàn bộ spec trong một kiến trúc; triết lý + ánh xạ Tiên đề; Material trong Cosmology; Branch Injection, Agent công thức, Hybrid Epoch, Meta-Cycle, Tech Ceiling; Entry point + Genesis v3; DDD + bảng thành phần + legacy; Rust 3-phase + ZoneCommand; lộ trình DB.

### 7.3. Mốc triển khai

- **M1 — Doc & refactor:** Hoàn thành WORLDOS_V5_ARCHITECTURE.md (hoặc doc này); tham chiếu v4 → v5.
- **M2 — Simulation ổn định:** Cascade + Macro/Micro + Residuals; snapshot/fork đúng spec.
- **M3 — Narrative pipeline:** Contextual Translation 3 tầng nối AI; Perceived Archive + Flavor + Residual injection.
- **M4 — Scale & DB:** Graph DB, Vector DB, TimescaleDB; mở rộng Rust/Orchestration theo design for scale.

---

## Phụ lục A. Bảng tiên đề Huyền Nguyên (tóm tắt engine)

| Tiên đề | Mô tả | Domain |
|---------|-------|--------|
| T1 | Mọi xác định đòi hỏi phân biệt. | Mọi diễn ngôn |
| T2 | Phân biệt thiết lập cặp quan hệ. | Cấu trúc tối thiểu |
| T3 | Tồn tại = ổn định cấu trúc quan hệ. | Ontology |
| T4 | Nhân quả = liên tục đổi cấu trúc. | Chuỗi hệ quả |
| T5 | Tự do = độ rộng trường khả thể. | Agent, Fork |
| T6 | Telos nổi lên cục bộ. | Entity, Evaluator |
| T7 | Ý thức = cấu trúc phản tư. | Perceived Archive |
| T8 | Mọi hệ phân biệt hữu hạn (Huyền Nguyên). | Epistemic limit |

---

## Phụ lục B. Tóm tắt triết lý Huyền Nguyên (self-contained)

**Huyền Nguyên** ký hiệu cho toàn thể cấu hình không thể bị đóng kín từ bên trong bởi bất kỳ hệ phân biệt hữu hạn nào — không phải thực thể, không phải phi cấu trúc; là **giới hạn cấu trúc** của mọi hệ.

- **Phân biệt:** Hành động tạo ranh giới A / không-A; điều kiện tối thiểu của mọi xác định. Phủ nhận phân biệt vẫn là một phân biệt.
- **Quan hệ:** Phát sinh tất yếu từ phân biệt; không có thực thể cô lập.
- **Cấu trúc:** Mẫu quan hệ ổn định tương đối qua biến động; tồn tại thực tế = ổn định tạm thời.
- **Nhân quả:** Liên tục hình thức của biến đổi cấu trúc; không biến đổi vô căn trong hệ mô tả được.
- **Trường khả thể / Tự do:** Độ rộng không gian tái cấu hình từ cấu hình hiện tại.
- **Telos:** Nổi lên cục bộ ở cấu trúc đủ phức hợp (tự duy trì, mô hình tương lai, ưu tiên trạng thái); không cần telos vũ trụ.
- **Ý thức:** Nổi lên khi hệ chứa mô hình nội tại về chính mình và dùng nó để điều chỉnh hành vi. Qualia = đặc điểm kiến trúc truy cập (A* đọc biểu diễn nén của A), không cần dualism.
- **Hữu hạn (T8):** Mọi hệ phân biệt đều hữu hạn; Huyền Nguyên = bảo chứng cho giới hạn nội tại. Phân loại: A (chưa biết), B (tự mâu thuẫn), C (vượt trần mô tả — ký hiệu Huyền Nguyên giữ chỗ).

*Huyền là tầng sâu không thể đóng kín. Nguyên là điều kiện của mọi khởi đầu.*

---

## Phụ lục C. Công thức toán học (tham chiếu)

Tập hợp công thức dùng trong spec; khi triển khai cần tham chiếu đúng đơn vị và ký hiệu.

### C.1. Agent (Micro Mode)

- **17D Trait:** $\mathbf{T}_{17} \in [0,1]^{17}$.
- **Action Utility:**
$$ \text{ActionUtility} = \text{BaseScore}(\text{Archetype}, \text{ZoneContext}) + \mathbf{T}_{17}^\top \mathbf{w} + \text{StructuredMicroNoise}(\text{Seed}, \text{Tick}, \text{Agent}) $$

### C.2. Material (Zone)

- **Invariant:** $\text{structured\_mass} \le \text{base\_mass}$.
- **Organization:** $\text{entropy} \mathrel{+}= k_1 \cdot \Delta\text{structured}$.
- **MaterialStress:**
$$ \text{MaterialStress} \propto (\text{entropy}) + (\text{base\_mass depletion ratio}) + (\text{structured fragility}) $$

### C.3. Tech Ceiling (văn minh $k$)

$$ \text{Theoretical\_Ceiling}_k = \text{base\_physical\_cap} \times \text{cultural\_openness} \times \text{material\_surplus\_factor} \times \text{institutional\_stability} $$
$$ \text{Current\_Frontier}_k \le \text{Theoretical\_Ceiling}_k, \qquad \Delta\text{Tech} \propto (\text{Ceiling} - \text{Frontier}) $$

### C.4. Cultural State Vector ($C_z$)

- $C_z(t) \in \mathbb{R}^k$, $k$ = 5–8.
- **Drift:** $C_z(t+1) = C_z(t) + \epsilon \cdot \text{InternalDynamics}$.
- **Lan truyền:** $C_z(t+1) \mathrel{+}= \beta \sum_{\text{neighbor}} (C_{\text{neighbor}} - C_z)$.
- $\Delta C$ từ sự kiện kẹp trong [0,1]; inertia khi $C_z \to 0$ hoặc $1$.

### C.5. Secession Pressure

$$ P_z = a \cdot D_z + b \cdot S_z - c \cdot \text{InstitutionalTrust}_z $$
$D_z$ = Cultural Divergence so với thủ đô; $S_z$ = Stress. Ngưỡng: $T_{\text{agitate}}$, $T_{\text{split}}$; thời gian $\tau_2$ trước khi Split.

### C.6. Myth Scar (lan tỏa)

Propagation kernel theo khoảng cách:
$$ \text{influence} \propto \exp(-\gamma \cdot \text{distance}) $$

### C.7. Meta-Cycle

- **Trigger:** $\text{SCI} < \text{CriticalThreshold}$ (có stochastic nhỏ).
- **Hiệu ứng:** $\approx 80\%$ StructuredMaterial sụp đổ; $\approx 50\%$ EmbodiedKnowledge quét; BaseMaterial giữ nguyên; KnowledgeCoreSignature bẻ cong seed kỷ nguyên sau.

### C.8. Institutional Memory (Entity)

Tích lũy với hệ số rã chậm $\lambda \to 1$ (gần 1).

---

*Tài liệu này đủ để triển khai và bảo trì WorldOS V5 khi chỉ giữ một bản kiến trúc. Các file v3, v4, Multiverse, Simulation Engine, Historical Accumulation, Material/Knowledge, Philosophy có thể được lưu trữ ngoài repo hoặc xóa sau khi đã chuyển nội dung cần thiết vào đây.*
