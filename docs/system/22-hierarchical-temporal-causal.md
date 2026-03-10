# 22 — Hierarchical Agent Simulation, Temporal Compression, Causal Graph & Counterfactual

Tài liệu mô tả bốn lớp kiến trúc giúp WorldOS scale (hàng triệu–trăm triệu actor), chạy lịch sử rất dài và trả lời “vì sao” / “nếu không thì sao”. **Cuối doc có mục tác động trực tiếp tới Chronicle và cách hiển thị Actor.**

---

## 1. Hierarchical Agent Simulation (HAS)

### Vấn đề nếu chỉ dùng actor thuần

- 1M actors × ~20 tương tác/actor → **O(n²)** → hàng nghìn tỷ interactions → CPU/storage không chịu nổi.

### Ý tưởng HAS

- **Không** lúc nào cũng mô phỏng mọi cá thể chi tiết.
- Actor tổ chức **nhiều tầng**; chỉ tầng cần thiết mới được “zoom in”.

Cấu trúc điển hình:

```
Universe
  └── Region
        └── City
              └── Group (guild, household, military unit)
                    └── Actor (key actors, 17-D)
```

Ví dụ: Earth → Europe → Paris → Merchant Guild → Actor A, B.

### Level-of-Detail (LOD)

| Mode | Mô phỏng | Actor |
|------|----------|--------|
| **Macro** | zone.population, economy, culture | Không cần actor chi tiết |
| **Micro** | Khi event quan trọng (war, revolution, migration) | Spawn key actors (vd. 300) |

Tick pipeline: **macro simulation** → detect important events → **spawn micro simulation** → merge result.

### Ba loại “actor”

1. **Statistical population** — không tồn tại actor thật (vd. population: 5000 farmers).
2. **Group agents** — guild, military unit, tribe (aggregate).
3. **Key actors** — king, scientist, hero (17-D personality, có trong DB).

### Áp dụng WorldOS

- **Zone** đã có: population proxy, culture, economy (field/civ_fields).
- Thêm khái niệm: **micro_agents** (danh sách key actors khi đã “zoom in”) vs **population** (số/thống kê).
- Chỉ spawn micro_agents khi cần (war, revolution, crisis window).
- Actor lifecycle trong HAS: **spawn** → **active** → **retire** → chuyển thành group statistics (knowledge diffuses to culture, actor removed hoặc archive).
- **Great Person (SupremeEntity)** là micro actor thuộc tier “great”: spawn bởi GreatPersonEngine; đã ghi Chronicle (type `supreme_emergence`). Điều kiện chi tiết “cá thể nào là micro actor” xem [MICRO_AGENT_CRITERIA.md](../../backend/docs/MICRO_AGENT_CRITERIA.md).

---

## 2. Temporal Compression Engine (TCE)

### Vấn đề

- 1 tick = 1 year, 100k ticks → billions of events, millions of actors, chronicle khổng lồ → database phình.

### TCE làm gì

Chuyển **raw events** thành **historical summary**.

- **Trước**: Year 120–124, mỗi năm một migration event.
- **Sau**: “120–124: Great Northern Migration, population moved 12,000”.

### Ba cấp nén

| Level | Nội dung |
|-------|----------|
| **L1 — Event aggregation** | Gộp event giống nhau (vd. 500 famine → Great Famine Period). |
| **L2 — Actor collapse** | Actor không quan trọng → statistics (vd. 200 farmers → population count). |
| **L3 — Historical snapshot** | Snapshot state (year 500: population, cultures, empires); archive event cũ. |

### Tick skipping

Khi universe ổn định (no wars, no disasters), engine có thể **simulate 100 years in one step** (tick 1000 → 1100), chỉ cập nhật macro.

### Pipeline TCE đơn giản

Mỗi N tick hoặc khi archive: **detect stable history** → **aggregate events** → **compress actors** → **create snapshot** → **delete/archive raw logs**.

### Importance score

Chỉ giữ event đủ quan trọng:

- importance = f(impact_on_population, impact_on_culture, impact_on_politics).
- Event nhỏ → discard; event lớn → preserve.

### Áp dụng WorldOS

- Đã có: Chronicle, Archive, Entropy, universe_snapshots.
- Thêm: **TemporalCompressionEngine** (hoặc bước trong pipeline), trigger: tick_interval, archive_event, universe_stable.
- Chronicle có thể có **compression_level** (raw vs summary) và **era** (ancient, medieval, industrial).

---

## 3. Causal Graph Engine (CGE)

### Vấn đề nếu chỉ có Chronicle

Chronicle ghi *điều gì xảy ra*, không ghi *vì sao*. CGE lưu **mạng nguyên nhân – kết quả**.

### Cấu trúc

- **Nodes** = events (id, event_type, tick, zone, impact_score).
- **Edges** = causal relations (cause_event_id, effect_event_id, weight).

Ví dụ: **drought → crop failure → famine → migration → rebellion → empire collapse**.

### Causal inference

Khi engine tạo event, ghi **trigger_event_id** (cause). Graph xây dựng dần mỗi tick.

### Truy vấn

- “Why did empire collapse?” → traverse graph: collapse ← rebellion ← famine ← drought.
- “What caused this religion to spread?” → trade route → cultural exchange → new religious movement.

### Graph pruning

Chỉ giữ relation quan trọng (vd. edge.weight ≥ threshold); tránh graph explosion.

### Integration

- **TCE**: Khi nén event (Great Migration), merge nhiều node migration thành một node.
- **Actor**: Actor có thể là node (vd. LeaderSpeech → Rebellion) → historical figures.

### Áp dụng WorldOS

- **Chronicle** = narrative timeline (giữ như hiện tại).
- **CausalGraph** = reasoning layer (bảng causal_edges hoặc graph DB).
- Pipeline: EventEngine → CausalGraphEngine → ChronicleEngine → TemporalCompression.

---

## 4. Counterfactual Engine (CE)

### Ý tưởng

Trả lời: *“What would happen if X did not occur?”* — alternative history.

### Pipeline

1. Chọn event E (vd. famine).
2. Fork universe tại tick trước E.
3. Sửa state (remove event / delay / change parameters).
4. Tiếp tục simulation.
5. So sánh: original outcome vs counterfactual outcome.

### Event modification

- remove_event, delay_event, change parameters (vd. drought severity 0.4 thay vì 0.9).

### Integration với Multiverse

- Counterfactual = universe branch (U0 → U1 remove drought, U2 remove famine, …).
- Lưu snapshot + delta, không clone toàn bộ state.

### Giới hạn

- Tránh multiverse explosion: chỉ chạy counterfactual cho **major events** (war, empire collapse, religious reform); importance threshold.

### Áp dụng WorldOS

- **CounterfactualEngine**: API runCounterfactual(universe_id, event_id, modification).
- Có thể dùng universe fork + replay (đã có worldos:replay, fork).

---

## 5. Kiến trúc tổng thể (Self-Explaining Universe Simulator)

```
Simulation Kernel (macro)
   ↓
Event Engine
   ↓
Causal Graph Engine  ← “why”
   ↓
Chronicle Engine     ← “what”
   ↓
Temporal Compression ← “summary”
   ↓
Archive

Counterfactual Engine ← “what if” (fork + replay)
Hierarchical Agent    ← macro population + micro key actors when needed
```

---

## 6. Tác động tới Chronicle và hiển thị Actor

Implement HAS, TCE, CGE, CE **có ảnh hưởng rõ rệt** tới biên niên sử và cách hiển thị actor.

### 6.1 Chronicle

| Thành phần | Ảnh hưởng |
|------------|-----------|
| **Nội dung** | Chronicle không chỉ còn “raw log từng tick”. Có thêm **compressed narrative** (era, summary): vd. “The Steppe Migration (310–340)” thay vì 30 dòng event. |
| **Cấu trúc dữ liệu** | Có thể thêm: `compression_level` (raw | aggregated | summary), `era`, `from_tick`/`to_tick` cho đoạn nén. Event có thể có `cause_event_id` (CGE). |
| **Hiển thị UI** | Timeline có thể có hai chế độ: **chi tiết** (raw events theo tick) và **tổng hợp** (era, Great Migration, Great Famine). Có thể hiển thị **quan hệ nhân quả** (event A → event B) khi có CGE. |
| **Counterfactual** | Chronicle có thể có nhánh “alternative history” (universe fork): hiển thị narrative của universe gốc vs universe counterfactual. |

Tóm lại: **Chronicle vẫn là timeline chính**, nhưng thêm lớp “summary/era” và có thể gắn “cause” cho từng event; UI cần hỗ trợ xem theo tick, theo era, và (tuỳ chọn) theo nhân quả.

### 6.2 Actor

| Thành phần | Ảnh hưởng |
|------------|-----------|
| **Ai được hiển thị** | Phần lớn thời gian (macro mode) **không có** hàng triệu actor trong DB. Chỉ có **key actors** (17-D). Statistical population chỉ là số (vd. zone population: 50,000). UI **không** liệt kê “1 triệu actor”, mà: theo zone/group, “Key actors: 12”, “Population (statistical): 50,000”. |
| **Cấu trúc hiển thị** | Có thể hiển thị **hierarchy**: Universe → Region → City → Group → **Actor**. Danh sách actor hiện tại có thể đổi thành “Key actors của universe/zone này” + nút “Zoom in” để (khi có micro simulation) load thêm actor trong group. |
| **Lifecycle** | Actor “retire” (chết hoặc không còn ảnh hưởng) có thể **collapse thành statistics** (TCE). Trong UI: actor vẫn có thể hiển thị dạng “historical figure” (đã qua đời, đã nén) với ít trường hơn; hoặc chỉ còn trong chronicle/summary. |
| **Spawn / Zoom** | Khi event (war, revolution) kích hoạt micro simulation, engine **spawn** key actors. UI: xuất hiện thêm actor trong zone/group tương ứng; có thể gắn nhãn “Spawned at T123 (Revolution)”. |

Tóm lại: **Actor list không còn “mọi cá thể”** mà là **key actors** (và tuỳ chọn group/statistical population). Chronicle và actor display đều phải hiểu “macro vs micro” và “compressed vs raw”.

### 6.3 Gợi ý triển khai từng bước

1. **Chronicle**: Giữ schema hiện tại; thêm (khi có TCE) bảng hoặc trường `chronicle_summaries` (era, from_tick, to_tick, narrative). UI: tab “Theo tick” vs “Theo era”.
2. **Actor**: Giữ actor hiện tại là **key actors**. Thêm (khi có HAS) khái niệm `zone.population` (số) và `zone.micro_agents` (ids key actors khi đã zoom). UI: “Population: 50,000 | Key actors: 12” và danh sách 12 actor.
3. **CGE**: Thêm bảng `causal_edges` (cause_event_id, effect_event_id, weight). Chronicle/event detail có thể hiển thị “Cause: …”, “Effects: …”.
4. **CE**: Dùng fork universe + replay; API counterfactual gọi fork + modify + advance. Chronicle của universe fork hiển thị như “Alternative timeline”.

---

## 7. Kết luận

- **HAS** = macro population + micro key actor khi cần → scale triệu–trăm triệu, vẫn chạy được.
- **TCE** = nén event và actor theo thời gian → lịch sử dài, storage hợp lý.
- **CGE** = lưu quan hệ nhân quả → simulation tự giải thích lịch sử (“vì sao”).
- **CE** = fork + sửa event + chạy lại → trả lời “nếu không thì sao”.

**Có ảnh hưởng trực tiếp tới Chronicle và Actor:**

- Chronicle: thêm dạng “tổng hợp / era”, có thể gắn cause/effect; UI cần xem theo tick / era / nhân quả.
- Actor: chỉ hiển thị **key actors** (và optional hierarchy/group); population chủ yếu là số; spawn khi micro mode; retire/collapse thành statistics hoặc historical figure.

Nếu implement đủ bốn lớp, WorldOS tiến sát kiến trúc **Self-Explaining Universe Simulator**: vừa sinh lịch sử, vừa giải thích lịch sử, vừa thử lịch sử thay thế.
