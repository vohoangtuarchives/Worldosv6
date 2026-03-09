# Kế hoạch đầy đủ: Dashboard theo dõi Simulation

> Bám sát [WorldOS_Architecture.md](docs/WorldOS_Architecture.md): pipeline, 7 tầng, kernel, tick pipeline, world state, event schema, autonomic, scheduler, timeline selection, narrative/attractor.

---

## 0. Ánh xạ Tài liệu Kiến trúc → Dashboard (bắt buộc tham chiếu)

Mọi phần UI và API phải có nguồn gốc rõ trong tài liệu. Bảng dưới map **mục trong doc** → **API field / UI component**.

| § Tài liệu | Nội dung doc | Thể hiện trên Dashboard / API |
|------------|--------------|-------------------------------|
| **§1 Tổng quan** | Pipeline: Simulation → Autonomic → Scheduler → Timeline Selection → Narrative | Panel hoặc indicator "Pipeline" (đang bước nào: tick → autonomic → schedule → narrative). |
| **§1** | 7 tầng: Physical, Population, Civilization, Culture, Knowledge, Cognitive, Narrative | World State panel hoặc expand theo tầng; snapshot/state_vector chứa đủ planet, population, civilization, culture, knowledge (cognitive), narrative/attractors. |
| **§3 WorldOS Kernel** | Simulation Scheduler, State Store, Event Bus, Engine Registry, Tick Pipeline, Persistence Layer | Panel "Kernel": tick_budget (Scheduler), snapshot_interval (Persistence), optional engine run order (Tick Pipeline). |
| **§3** | Tick Pipeline: 13 engines (Planet→Climate→Ecology→Civ→Politics→War→Trade→Knowledge→Culture→Ideology→Memory→Mythology→Evolution) | Tooltip hoặc panel "Engine order"; optional API trả về last_tick_engines_run hoặc metrics per engine. |
| **§3** | EngineResult: events, stateChanges, metrics | Snapshot trả về metrics; activity log = events. |
| **§4 Event Architecture** | Topics: climate, disaster, economy, war, culture, knowledge, civilization; Event flow (tick→physics→stream→engines→causality→state) | Activity log filter theo topic/type; event schema (id, type, year, location, participants, consequences). |
| **§5 World State Model** | Root: universe_id, current_year, tick, planet, civilizations, population, economy, knowledge, culture, active_attractors, wars, alliances | API simulation-status + snapshot phải có đủ các key này (hoặc trích từ state_vector). Bảng universe có thể expand "World state" theo từng nhóm. |
| **§5** | Storage: Hot (Redis), Events (Kafka), Graph (Neo4j), Analytics (ClickHouse), Snapshots (S3) | Tooltip hoặc badge "Nguồn: Snapshot" / "Hot state" nếu backend phân biệt. |
| **§5** | Snapshot structure: year, snapshot_interval, planet, civilizations, population, economy, culture | latest_snapshot trong API và UI hiển thị đúng structure này. |
| **§12 Narrative / Attractor** | Attractor Engine: Empire Rise/Collapse, Renaissance, Scientific Revolution, Industrialization, Cultural Golden Age; Hybrid model | Cột hoặc chip "Active attractors" trong bảng universe; trường active_attractors trong world state/snapshot. |
| **§13 Autonomic Evolution** | Decision: continue, fork, archive, merge, mutate, promote; fork_entropy_min, archive_entropy_threshold; fork_count = floor(entropy×5) | Panel Autonomic: quyết định đề xuất/đã chọn, 2 ngưỡng config, công thức fork_count; hiển thị "Fork count (nếu fork)" theo entropy. |
| **§14 Multiverse Scheduler** | priority = Σ(weights × novelty|complexity|civilization|entropy); aging: priority += idle_time × aging_factor; tick_budget | API trả về priority_weights, tick_budget; bảng có cột Priority; optional idle_time/aging trong response. |
| **§14 Timeline Selection** | score = 0.3×tech + 0.2×culture_diversity + 0.2×conflict + 0.3×novelty; "Interesting events" | Optional cột Timeline score; panel "Interesting events" (first agriculture, first empire, AI, …). |
| **§16 World Event Schema** | 8 nhóm: Civilization, War, Religion, Technology, Cultural, Economic, Population, Ideology; 50+ types; Kafka topics | Activity log filter theo category/type; hiển thị type và topic (world.events.*). |
| **§18 Bốn nguyên tắc** | Deterministic, Event-driven, Scalable, Replayable | Panel nhỏ "Kernel principles" hoặc tooltip (info, không chỉnh sửa). |

---

## 1. Tổng quan và mục tiêu

- **Mục đích:** Giao diện tập trung vào **theo dõi và điều khiển** simulation: trạng thái universes, tiến độ tick, scheduler, pulse/advance, autonomic (bám [WorldOS_Architecture.md](docs/WorldOS_Architecture.md)).
- **Vị trí:** Tab mới **"Simulation"** (hoặc "Monitor") trên [dashboard/page.tsx](frontend/src/app/(main)/dashboard/page.tsx); sau có thể tách route `/dashboard/simulation` nếu nội dung mở rộng.
- **Người dùng:** Operator/developer theo dõi multiverse, chạy pulse, advance từng universe, bật/tắt autonomic.

---

## 2. Backend

### 2.1 Endpoint mới: GET `worlds/{id}/simulation-status`

**Mục đích:** Một gọi lấy toàn bộ trạng thái simulation của world (universes + snapshot mới nhất + scheduler + autonomic).

**Response schema (JSON)** — bám §5 World State, §12 Attractor, §13 Autonomic, §14 Scheduler & Timeline Selection:

```json
{
  "world": {
    "id": 1,
    "name": "World Name",
    "is_autonomic": true,
    "global_tick": 1200,
    "snapshot_interval": 10
  },
  "pipeline": {
    "phase": "scheduler",
    "steps": ["simulation", "autonomic", "scheduler", "timeline_selection", "narrative"]
  },
  "scheduler": {
    "tick_budget": 10,
    "priority_weights": { "novelty": 0.25, "complexity": 0.30, "civilization": 0.25, "entropy": 0.20 },
    "aging_factor": 0.01
  },
  "autonomic": {
    "fork_entropy_min": 0.5,
    "archive_entropy_threshold": 0.99,
    "last_decision_by_universe": { "42": "continue", "43": "fork" }
  },
  "universes": [
    {
      "id": 42,
      "name": "Universe 42",
      "status": "active",
      "current_tick": 500,
      "current_year": 1347,
      "entropy": 0.65,
      "priority": 0.72,
      "order_index": 1,
      "idle_ticks": 0,
      "timeline_score": 0.58,
      "autonomic_decision": "continue",
      "fork_count_if_fork": 3,
      "latest_snapshot": {
        "tick": 500,
        "year": 1347,
        "snapshot_interval": 10,
        "entropy": 0.65,
        "stability_index": 0.45,
        "planet": {},
        "civilizations": [],
        "population": {},
        "economy": {},
        "knowledge": {},
        "culture": {},
        "active_attractors": ["renaissance", "scientific_revolution"],
        "wars": [],
        "alliances": [],
        "metrics": {}
      }
    }
  ],
  "counts": {
    "active": 5,
    "halted": 2,
    "restarting": 0
  },
  "tick_pipeline_engines": [
    { "priority": 1, "name": "Planet Engine" },
    { "priority": 2, "name": "Climate Engine" },
    "..."
  ]
}
```

- **World State (§5):** `latest_snapshot` gồm planet, civilizations, population, economy, knowledge, culture, active_attractors, wars, alliances; có thể rút gọn (số lượng, key tổng hợp) nếu payload lớn.
- **Attractor (§12):** `active_attractors` trong snapshot.
- **Autonomic (§13):** `autonomic` với fork_entropy_min, archive_entropy_threshold; mỗi universe có `autonomic_decision`, `fork_count_if_fork` = floor(entropy×5).
- **Scheduler (§14):** `priority`, `order_index`, `priority_weights`, `tick_budget`; optional `idle_ticks`, `aging_factor`.
- **Timeline Selection (§14):** `timeline_score` (0.3×tech + 0.2×culture_diversity + 0.2×conflict + 0.3×novelty) nếu backend tính được.
- **Kernel (§3):** `tick_pipeline_engines` (13 engines theo thứ tự doc); `pipeline` cho pipeline tổng thể.

**Cấu hình Autonomic (doc §13) — nguồn từ config:**  
`config('worldos.autonomic.fork_entropy_min')`, `config('worldos.autonomic.archive_entropy_threshold')` đưa vào response `autonomic` để UI hiển thị ngưỡng.

**Logic gợi ý (trong closure hoặc `WorldSimulationStatusController`):**

- Load `World::findOrFail($id)`.
- Universes: `Universe::where('world_id', $id)->whereIn('status', ['active','running','halted','restarting'])->get()` (hoặc không lọc status nếu cần tất cả).
- Với mỗi universe: lấy snapshot mới nhất `$u->snapshots()->orderByDesc('tick')->first()` (hoặc eager load `snapshots` subquery limit 1).
- Scheduler: gọi `MultiverseSchedulerEngine::schedule($world, 0)` để lấy collection có thứ tự; cần extend engine hoặc tạo service method trả về `[['universe' => $u, 'priority' => $p], ...]` để map `priority` và `order_index` vào từng universe trong response.
- Trả về `world` (id, name, is_autonomic, global_tick, snapshot_interval), `scheduler` (tick_budget từ config, priority_weights), `universes` (array như trên), `counts` (đếm theo status).

**Lỗi:**

- 404 nếu world không tồn tại.
- 422 không cần thiết nếu chỉ GET.

**File:** Thêm route trong [backend/routes/api.php](backend/routes/api.php) (prefix `worldos`):  
`Route::get('worlds/{id}/simulation-status', ...)`.

---

### 2.2 API Pulse hiện có

- `POST worlds/{id}/pulse`: body `{ "ticks_per_universe": 5 }`. Response: `{ "ok": true, "results": { "universe_id": {...}, ... } }`.
- Frontend cần gửi đúng key: trong [api.ts](frontend/src/lib/api.ts) đang dùng `ticks_per_universe` — backend dùng `request()->input('ticks_per_universe', 5)`. **Lưu ý:** Laravel thường normalize body JSON thành snake_case; nếu gửi `ticksPerUniverse` cần map hoặc backend nhận `ticksPerUniverse`. Kiểm tra và thống nhất là `ticks_per_universe`.

---

### 2.3 Activity log / Simulation events (bám §4 Event Architecture, §16 World Event Schema)

- **Mục tiêu:** Hiển thị event theo doc: type, year, location, participants, consequences; 8 nhóm §16 (Civilization, War, Religion, Technology, Cultural, Economic, Population, Ideology); Kafka topics world.events.*.

- **Cách 1:** Dùng sẵn `GET universes/{id}/chronicles` — gọi cho từng universe của world (hoặc vài universe gần đây) rồi merge sort theo `created_at`/`to_tick` trên frontend.
- **Cách 2:** Endpoint `GET worlds/{id}/simulation-activity?limit=50&topic=...` trả event theo schema §16 (id, type, year, location, participants, consequences); filter type theo 50+ types. UI: filter theo 8 nhóm. Endpoint mới (nếu làm Cách 2) `GET worlds/{id}/simulation-activity?limit=50` trả về danh sách chronicles (hoặc bảng “simulation_events”) của mọi universe thuộc world, filter `type IN ('primordial_rebirth','fork','archive','convergence_event', ...)`, order by `created_at desc`, limit 50.  
- Phase 1 có thể chỉ dùng Cách 1 (gọi chronicles một universe “đại diện” hoặc vài universe) để giảm scope.

---

## 3. Frontend

### 3.1 API client

Trong [frontend/src/lib/api.ts](frontend/src/lib/api.ts):

- Thêm method:
  - `worldSimulationStatus(worldId: number): Promise<WorldSimulationStatusResponse>`
  - Gọi `GET /worldos/worlds/${worldId}/simulation-status`.

**TypeScript types (tạo file `frontend/src/types/simulation.ts`)** — khớp với §5 World State, §12 Attractor, §13 Autonomic, §14 Scheduler/Timeline, §16 Event:

```ts
// §5 World State root + snapshot
export interface WorldStateSnapshot {
  tick: number;
  year?: number;
  snapshot_interval?: number;
  entropy: number;
  stability_index: number;
  planet?: Record<string, unknown>;
  civilizations?: unknown[];
  population?: Record<string, unknown>;
  economy?: Record<string, unknown>;
  knowledge?: Record<string, unknown>;
  culture?: Record<string, unknown>;
  active_attractors?: string[];
  wars?: unknown[];
  alliances?: unknown[];
  metrics?: Record<string, unknown>;
}

// §13 Autonomic
export type AutonomicDecision = "continue" | "fork" | "archive" | "merge" | "mutate" | "promote";

// §16 Event schema (activity log item)
export interface WorldEventItem {
  id: string;
  type: string;
  year?: number;
  location?: string;
  participants?: string[];
  consequences?: string[];
  topic?: "civilization" | "war" | "religion" | "tech" | "population" | "ideology" | "culture" | "economic";
}

export interface WorldSimulationStatusResponse {
  world: {
    id: number;
    name: string;
    is_autonomic: boolean;
    global_tick: number;
    snapshot_interval?: number;
  };
  pipeline?: { phase: string; steps: string[] };
  scheduler?: {
    tick_budget: number;
    priority_weights: Record<string, number>;
    aging_factor?: number;
  };
  autonomic?: {
    fork_entropy_min: number;
    archive_entropy_threshold: number;
    last_decision_by_universe?: Record<number, AutonomicDecision>;
  };
  universes: Array<{
    id: number;
    name: string;
    status: string;
    current_tick: number;
    current_year?: number;
    entropy?: number;
    priority?: number;
    order_index?: number;
    idle_ticks?: number;
    timeline_score?: number;
    autonomic_decision?: AutonomicDecision;
    fork_count_if_fork?: number;
    latest_snapshot?: WorldStateSnapshot;
  }>;
  counts?: { active: number; halted: number; restarting: number };
  tick_pipeline_engines?: Array<{ priority: number; name: string }>;
}
```

---

### 3.2 Tích hợp SimulationContext

- Context hiện tại: `universes` từ `api.universes({})` (không filter world), `setUniverseId`, `refresh()` (refresh universe đang chọn).
- Tab Simulation cần **filter theo world:** khi chọn world, gọi `api.worldSimulationStatus(worldId)` (hoặc `api.universes({ world_id: worldId })` nếu chưa có simulation-status). Không bắt buộc đưa “simulation status” vào Context — có thể state local trong tab (worldId, status, loading, error).
- Sau **advance** hoặc **pulse:** gọi `refresh()` nếu `universeId` đang là universe được advance; đồng thời refetch simulation-status (hoặc universes) để cập nhật bảng.

---

### 3.3 Cấu trúc component

- **SimulationMonitor** (container): state `worldId`, `status: WorldSimulationStatusResponse | null`, `loading`, `error`, `pulseLoading`, `advanceLoadingByUniverse: Record<number, boolean>`.
  - Gọi `api.worlds()` để lấy danh sách world cho dropdown.
  - Khi `worldId` đổi: gọi `api.worldSimulationStatus(worldId)`.
  - Render: WorldSelector, UniverseTable, PulseAndAutonomicPanel, (optional) SimulationActivityLog.

- **WorldSelector:** dropdown/select danh sách worlds. Props: `worlds: { id, name }[]`, `value: number | null`, `onChange(id)`, `disabled`.

- **UniverseTable:** bảng (desktop) / card list (mobile). Cột: Order (order_index), Name, Status, Tick, Entropy, Stability (từ latest_snapshot), Priority (nếu có). Hành động: nút “Advance” mở modal hoặc inline input số ticks + gọi `api.advance(id, ticks)`; khi đang advance set `advanceLoadingByUniverse[id]=true`, disable nút, sau xong refetch status và clear loading.
  - Empty state: “Chưa có universe. Tạo universe (seed/demo) từ world trước.”

- **PulseAndAutonomicPanel:** 
  - Hiển thị `world.is_autonomic` (badge/text).
  - Nút “Pulse World”: nhập số ticks (mặc định 5 hoặc 10), gọi `api.pulseWorld(worldId, ticks)`, trong lúc gọi disable nút và set `pulseLoading=true`. Success: refetch simulation-status; hiển thị toast “Đã advance N universes”.
  - Nút “Bật/Tắt Autonomic”: gọi `api.toggleAutonomic(worldId)`, refetch status.

- **SimulationActivityLog (optional):** danh sách ngắn (10–20 item) chronicles liên quan simulation. Có thể gọi `api.chronicle(universeId)` cho 1–2 universe “đại diện” hoặc API `worlds/:id/simulation-activity` nếu có. Hiển thị: tick, type, content/rút gọn, universe name.

- **AdvanceModal (hoặc inline):** universeId, defaultTicks (1 hoặc 10), onConfirm(ticks), onClose, loading. Gọi `api.advance(universeId, ticks)` rồi refetch và đóng.

---

### 3.3.1 Các panel bám theo tài liệu (WorldOS_Architecture)

- **Pipeline indicator (§1):** Hiển thị pipeline tổng thể: Simulation → Autonomic → Scheduler → Timeline Selection → Narrative. Dùng `pipeline.phase` / `pipeline.steps` từ API; có thể chỉ là stepper hoặc breadcrumb trạng thái (ví dụ: "Đang ở: Scheduler").

- **World State theo 7 tầng (§1, §5):** Khi expand một universe hoặc xem chi tiết snapshot, nhóm dữ liệu theo 7 tầng:
  - Physical: planet (địa lý, khí hậu)
  - Population: population
  - Civilization: civilizations, wars, alliances
  - Culture: culture
  - Knowledge: knowledge
  - Cognitive: (có thể nằm trong metrics hoặc narrative)
  - Narrative: active_attractors, causality (nếu có)
  Dữ liệu lấy từ `latest_snapshot` (planet, civilizations, population, economy, knowledge, culture, active_attractors, wars, alliances).

- **Kernel panel (§3):** Một card/panel "WorldOS Kernel" hiển thị: Simulation Scheduler (tick_budget), Persistence (snapshot_interval), Tick Pipeline (danh sách 13 engines từ `tick_pipeline_engines`). Có thể thêm tooltip "State Store, Event Bus" (chỉ mô tả, không có số liệu realtime nếu backend chưa expose).

- **Tick Pipeline engines (§3):** Danh sách 13 engines theo thứ tự doc (Planet, Climate, Ecology, Civilization, Politics, War, Trade, Knowledge, Culture, Ideology, Memory, Mythology, Evolution). Hiển thị dạng list hoặc compact badges; dữ liệu từ `tick_pipeline_engines` hoặc constant trong frontend.

- **Autonomic panel đầy đủ (§13):** Ngoài toggle và pulse, hiển thị: (1) Ngưỡng config: fork_entropy_min, archive_entropy_threshold (từ `autonomic`); (2) Với mỗi universe: autonomic_decision (continue/fork/archive/merge/mutate/promote), fork_count_if_fork (floor(entropy×5)); (3) Có thể badge màu theo decision (ví dụ fork = vàng, archive = đỏ).

- **Activity log và Event schema (§4, §16):** Activity log hiển thị event theo schema doc: id, type, year, location, participants, consequences. Filter theo 8 nhóm: Civilization, War, Religion, Technology, Cultural, Economic, Population, Ideology; và theo Kafka topic (world.events.civilization, world.events.war, …) nếu API trả về topic. Types: civilization_born, war_declared, religion_founded, technology_invented, art_movement_born, trade_route_established, migration_wave, ideology_born, v.v. (50+ types trong doc).

- **Bốn nguyên tắc Kernel (§18):** Panel nhỏ hoặc tooltip "4 nguyên tắc": Deterministic (replay được, seed theo universe_id + tick), Event-driven (engines qua Event Bus), Scalable (worker pool), Replayable (snapshot mỗi N sim-years). Chỉ đọc, không chỉnh.

- **Attractor (§12):** Trong bảng universe hoặc detail: hiển thị `active_attractors` (Empire Rise, Empire Collapse, Renaissance, Scientific Revolution, Industrialization, Cultural Golden Age). Dạng chip hoặc list ngắn.

- **Timeline Selection (§14):** Nếu API trả về `timeline_score`: cột "Timeline score" trong bảng; optional panel "Interesting events" (first agriculture, first empire, AI creation, …) khi backend có dữ liệu.

---

### 3.4 Polling và làm mới

- Khi tab **Simulation** đang active và đã chọn world: có thể bật polling `worldSimulationStatus(worldId)` mỗi 10–15 giây để tự cập nhật tick/entropy (tránh polling quá dày).
- Khi tab khác active: dừng polling (clear interval).
- Sau mỗi advance/pulse: refetch ngay (không cần đợi interval).

---

### 3.5 Trạng thái giao diện (UI states)

- **Chưa chọn world:** Hiển thị “Chọn một world để xem trạng thái simulation.”
- **Đang load:** Spinner/skeleton cho bảng và panel.
- **Lỗi:** Hiển thị message từ `error` (API lỗi hoặc 404).
- **World không có universe:** Bảng rỗng + text “Chưa có universe. Có thể tạo từ Seed/Demo.”
- **Advance/Pulse đang chạy:** Disable nút tương ứng, hiển thị loading (spinner hoặc “Đang chạy…”).

---

### 3.6 Style và a11y

- Đồng bộ với dashboard hiện tại: nền tối, border slate, component từ `@/components/ui` (Card, Button, Select, Table), font sans.
- Responsive: bảng → card stack trên mobile; nút và dropdown vẫn dùng được.
- Loading/error dùng component có sẵn (Loader2, AlertTriangle) như các tab khác.

---

## 4. Luồng người dùng (chi tiết)

1. Vào Dashboard → chọn tab **Simulation**.
2. Chọn **World** từ dropdown → gọi `worldSimulationStatus(worldId)` → hiển thị bảng universes + panel Pulse/Autonomic.
3. Bảng: xem status, tick, entropy, stability; có thể sort theo priority (nếu có).
4. Advance: bấm “Advance” trên một dòng → nhập số ticks (hoặc chọn nhanh 1/5/10) → xác nhận → gọi advance → refetch → cập nhật dòng.
5. Pulse: nhập “Ticks mỗi universe” (mặc định 5) → bấm “Pulse World” → gọi pulse → refetch → toast kết quả.
6. Autonomic: bấm “Bật/Tắt Autonomic” → gọi toggle → refetch → cập nhật badge.
7. (Tùy chọn) Xem Activity log cuộn bên dưới.

---

## 5. File cần tạo/sửa (checklist)

| # | File | Hành động |
|---|------|-----------|
| 1 | `backend/routes/api.php` | Thêm GET `worlds/{id}/simulation-status`. |
| 2 | Backend (controller hoặc closure) | Implement logic simulation-status (world, universes + latest snapshot, scheduler order/priority, counts). |
| 3 | `backend/app/Modules/Simulation/Services/MultiverseSchedulerEngine.php` | (Tùy chọn) Thêm method trả về list kèm priority, ví dụ `scheduleWithScores(World $world): Collection` để controller dùng. |
| 4 | `frontend/src/lib/api.ts` | Thêm `worldSimulationStatus(worldId)`. |
| 5 | `frontend/src/types/simulation.ts` (hoặc types hiện có) | Định nghĩa `WorldSimulationStatusResponse` và type con. |
| 6 | `frontend/src/app/(main)/dashboard/page.tsx` | Thêm tab “Simulation”; khi active render `SimulationMonitor`. |
| 7 | `frontend/src/components/dashboard/SimulationMonitor.tsx` | Component chính (world select, state, bảng, panel, optional activity). |
| 8 | `frontend/src/components/dashboard/WorldSelector.tsx` (hoặc inline) | Dropdown worlds. |
| 9 | `frontend/src/components/dashboard/UniverseSimulationTable.tsx` | Bảng/card list universes + nút Advance. |
| 10 | `frontend/src/components/dashboard/PulseAndAutonomicPanel.tsx` | Pulse + Toggle autonomic. |
| 11 | `frontend/src/components/dashboard/AdvanceUniverseModal.tsx` (hoặc inline trong Table) | Modal nhập ticks + gọi advance. |
| 12 | (Optional) `frontend/src/components/dashboard/SimulationActivityLog.tsx` | Danh sách activity từ chronicles hoặc API mới. |

---

## 6. Edge cases và xử lý

- **World không tồn tại:** API 404 → hiển thị “World không tồn tại”, không gọi lại khi worldId không đổi.
- **World không có universe:** `universes: []` → bảng empty + message hướng dẫn tạo universe (seed/demo).
- **Advance thất bại (4xx/5xx):** Giữ modal mở (hoặc toast), hiển thị message lỗi; không refetch.
- **Pulse thất bại:** Toast lỗi; refetch vẫn nên gọi để có trạng thái mới nhất (một số universe có thể đã advance).
- **Pulse thành công nhưng `results` rỗng:** Toast “Đã gửi pulse” hoặc “Không có universe active để advance.”
- **Scheduler không trả priority:** Cột priority ẩn hoặc hiển thị “—”; sort theo tick hoặc name.

---

## 7. Kiểm thử (gợi ý)

- **Backend:** Feature test cho GET `worlds/{id}/simulation-status`: world có 0 universe, 1 universe (có/không snapshot), nhiều universe; kiểm tra structure JSON và counts.
- **Frontend:** Component test cho SimulationMonitor (mock api): chọn world → hiển thị bảng; advance → gọi api.advance với đúng tham số. (Tùy dự án có đang viết component test hay không.)

---

## 8. Tùy chọn mở rộng (sau phase 1)

- Route riêng `/dashboard/simulation` với layout đầy đủ (breadcrumb, filter thêm theo saga).
- API `worlds/:id/simulation-activity` và panel Activity log đầy đủ.
- Hiển thị “last pulse at” (cần backend lưu last_pulse_at trên world hoặc bảng log).
- Export danh sách universes (CSV) từ view Simulation.
- Phân quyền: chỉ role “operator” hoặc “admin” mới pulse/toggle autonomic (nếu hệ thống đã có auth + roles).

---

## 9. Tóm tắt

- **Backend:** Thêm GET `worlds/{id}/simulation-status` với response schema cố định (world, scheduler, universes + latest_snapshot, counts); có thể mở rộng MultiverseSchedulerEngine để trả priority/order.
- **Frontend:** Tab Simulation trên dashboard; component SimulationMonitor (world select, bảng universes, advance modal, pulse + autonomic panel); types TypeScript; polling khi tab active; xử lý đủ empty/loading/error và edge cases.
- **Tích hợp:** Dùng SimulationContext.refresh() sau advance nếu cần đồng bộ universe đang xem; state simulation-status có thể local trong tab.
- **Chất lượng:** Empty states, loading, error, thống nhất API key (ticks_per_universe), test backend cho simulation-status.

---

## 10. Phụ lục: Trích tài liệu WorldOS_Architecture (để implement đúng)

**§3 Tick Pipeline — 13 engines (thứ tự bắt buộc):**  
1 Planet, 2 Climate, 3 Ecology, 4 Civilization, 5 Politics, 6 War, 7 Trade, 8 Knowledge, 9 Culture, 10 Ideology, 11 Memory, 12 Mythology, 13 Evolution.

**§5 World State root keys:** universe_id, current_year, tick, planet, civilizations, population, economy, knowledge, culture, active_attractors, wars, alliances.

**§12 Historical Attractors (tên hiển thị):** Empire Rise, Empire Collapse, Renaissance, Scientific Revolution, Industrialization, Cultural Golden Age.

**§13 Autonomic — Decision types:** continue, fork, archive, merge, mutate, promote. Công thức: fork_count = floor(entropy × 5). Config keys: worldos.autonomic.fork_entropy_min, worldos.autonomic.archive_entropy_threshold.

**§14 Scheduler — Priority:** priority = novelty_weight×novelty + complexity_weight×complexity + civilization_weight×civilization_count + entropy_weight×entropy. Aging: priority += idle_time × aging_factor.

**§14 Timeline Selection — Score:** 0.3×tech_progress + 0.2×culture_diversity + 0.2×conflict_intensity + 0.3×novelty. Interesting events: First agriculture, First empire, AI creation, Interstellar travel, Global war.

**§16 Event — 8 nhóm và ví dụ type:**  
1. Civilization: civilization_born, civilization_expand, civilization_split, civilization_collapse, capital_moved  
2. War: war_declared, battle_fought, city_sieged, peace_treaty, empire_fall  
3. Religion: religion_founded, religion_split, religious_reform, religion_spread, holy_war  
4. Technology: technology_invented, technology_diffused, tech_revolution, scientific_breakthrough  
5. Cultural: art_movement_born, cultural_golden_age, literary_revolution, architectural_style_born  
6. Economic: trade_route_established, market_crash, economic_boom, currency_created  
7. Population: migration_wave, population_boom, famine, plague_outbreak  
8. Ideology: ideology_born, philosophy_school, political_revolution, constitution_written  

**§16 Kafka topics:** world.events.civilization, world.events.war, world.events.religion, world.events.tech, world.events.population, world.events.ideology (và culture, economy nếu có).

**§18 Bốn nguyên tắc:** Deterministic (seed = hash(universe_id + tick)), Event-driven (engines qua Event Bus), Scalable (worker pool), Replayable (snapshot mỗi N sim-years).
