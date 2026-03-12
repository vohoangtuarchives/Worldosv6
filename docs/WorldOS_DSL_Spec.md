# WorldOS — DSL & Rule Engine Spec

> **Rule Engine / DSL** là thành phần **core** (cùng cấp với Simulation Kernel). Kernel quản lý state + physics; DSL quản lý **luật** thế giới (điều kiện → sự kiện / hành động).

Tham chiếu: [WorldOS_Architecture.md](WorldOS_Architecture.md), [ARCHITECTURE_COMPARISON_AND_REFACTOR.md](ARCHITECTURE_COMPARISON_AND_REFACTOR.md).

---

## 1. Mục đích

- **Tách World Rules khỏi engine code:** Luật (revolution, chaos threshold, emergence) mô tả bằng DSL; engine chỉ parse và execute.
- **Data-driven:** Thay đổi rule không cần sửa code, chỉ sửa file DSL hoặc config.
- **Chuẩn bị cho AI / Self-improving:** AI sinh rule dạng DSL; Rule VM (Rust) evaluate và trả events/actions.

---

## 2. Cú pháp tối thiểu (Phase 1)

### 2.1 Rule

Một rule gồm: **tên**, **điều kiện (when)**, **xác suất tùy chọn (chance)**, **hành động (then)**.

```
rule <name>
  scope <entity>   # optional: global | zone | civilization
  when
    <condition_and> ...
  chance <expr>    # optional, default 1.0
  then
    <action> ...
```

**Ví dụ:**

```
rule revolution_trigger
  when
    civilization.politics.legitimacy < 0.3
    civilization.demographic.happiness_proxy < 0.2
  chance 0.2 + elite_overproduction * 0.3
  then
    emit_event REVOLUTION

rule chaos_threshold
  when
    entropy > 0.85
    stability_index < 0.25
  then
    emit_event CHAOS_SPIKE
    adjust_stability -0.1
```

### 2.2 Điều kiện (condition)

- **So sánh:** `<path> <op> <literal>` với `op` = `<`, `<=`, `>`, `>=`, `==`, `!=`.
- **Path:** Đường dẫn vào state (xem State Contract bên dưới). Ví dụ: `entropy`, `stability_index`, `civilization.war.stage`, `zones[0].state.entropy`.
- **Literal:** Số (float/int) hoặc chuỗi (cho enum/event name).
- **Kết nối:** Nhiều điều kiện trong `when` = AND.

Phase 1 không bắt buộc OR hoặc nested AND; có thể thêm sau.

### 2.2a Cú pháp v2 (when / chance / then mở rộng)

Đã triển khai trong engine; dùng chung State Contract và pipeline.

- **When:**
  - Nhiều dòng điều kiện = AND.
  - Dòng chỉ gồm từ khóa `or`: điều kiện tiếp theo được nối OR với điều kiện trước (ví dụ: `A` rồi `or` rồi `B` → `A OR B`).
  - Dòng chỉ gồm từ khóa `not`: dòng tiếp theo là một điều kiện, được bọc NOT (ví dụ: `not` rồi `entropy > 0.9` → `NOT(entropy > 0.9)`).
  - Mỗi điều kiện có thể là **biểu thức hai bên**: `expr op expr` (ví dụ: `entropy + stability_index > 1.0`), với `op` = `<`, `<=`, `>`, `>=`, `==`, `!=`. `expr` hỗ trợ path, số, chuỗi, `+ - * /`, dấu ngoặc, và `func(...)` (ví dụ: `sigmoid(entropy)`).
- **Chance:** Là **biểu thức** (expr), không chỉ số. Ví dụ: `0.15`, `sigmoid(entropy)`, `clamp(x, 0, 1)`, `random()`. Mặc định 1.0 nếu không ghi.
- **Metadata rule:** `priority <u32>`, `cooldown <ticks|N y>`, `scope <entity>` (tùy chọn).
- **Then (actions):** Ngoài `emit_event`, `adjust_stability`, `adjust_entropy` còn có:
  - `add <path> <expr>` — cộng giá trị (số) vào path.
  - `set <path> <expr>` — gán giá trị (số hoặc chuỗi) tại path.
  - `spawn_actor <kind>` — yêu cầu tạo actor; Laravel/engine xử lý (event SPAWN_ACTOR).

Pipeline và output giữ nguyên: Rule VM trả danh sách events/actions; Laravel apply (event, adjust_stability/entropy, add_path, set_path, spawn_actor).

- **Rule Graph (tùy chọn):** Trong file DSL có thể thêm block `dependencies` với các dòng `from_rule -> to_rule` (ví dụ: `revolution_trigger -> civil_war`) để mô tả quan hệ kích hoạt / gợi ý giữa các rule. Runtime VM vẫn chỉ nhận danh sách rule; dependencies dùng cho metadata / AI (xem [WorldOS_DSL_Spec_v2.md](WorldOS_DSL_Spec_v2.md) §7).

### 2.3 Hành động (action)

| Action | Ý nghĩa |
|--------|----------|
| `emit_event <EVENT_NAME>` | Đẩy event vào queue; Laravel/consumer emit `SimulationEventOccurred`. |
| `adjust_stability <delta>` | Cộng delta vào stability_index (có thể clamp 0..1). |
| `adjust_entropy <delta>` | Cộng delta vào entropy (clamp). |
| `spawn_dark_attractor` | (Phase 2) Tạo dark attractor theo tham số. |

Phase 1 chỉ cần `emit_event` và tùy chọn 1–2 adjust; thêm action khi cần.

### 2.4 Entity / component (tham chiếu state)

Rule **chỉ đọc** state qua các path. Không cần khai báo entity/component riêng trong DSL Phase 1; path trỏ trực tiếp vào State Contract (xem §3).

---

## 3. State Contract

Rule VM nhận **state** dạng JSON (hoặc struct map từ `state_vector` + snapshot). Rule **chỉ được đọc** các trường sau.

**Nguồn state:** Laravel xây state gửi tới Rule VM bằng [RuleVmService::buildStateForVm](backend/app/Services/Simulation/RuleVmService.php)(universe, snapshot): merge `snapshot.state_vector` với các key top-level bên dưới. Các path như `civilization.*`, `zones.*` cần có trong state_vector (hoặc metrics) khi rule tham chiếu.

### 3.1 Global (root)

| Path | Kiểu | Mô tả |
|------|------|--------|
| `tick` | u64 | Tick hiện tại. |
| `entropy` | f64 | Entropy toàn cục (0..1). |
| `global_entropy` | f64 | Alias entropy. |
| `stability_index` | f64 | Chỉ số ổn định (0..1). |
| `sci` | f64 | Structural Coherence Index. |
| `instability_gradient` | f64 | Gradient bất ổn. |
| `knowledge_core` | f64 | Tri thức lõi. |

### 3.2 Global fields (Attractor / civilization fields)

| Path | Kiểu | Mô tả |
|------|------|--------|
| `global_fields.survival` | f64 | Trường survival. |
| `global_fields.power` | f64 | Trường power. |
| `global_fields.wealth` | f64 | Trường wealth. |
| `global_fields.knowledge` | f64 | Trường knowledge. |
| `global_fields.meaning` | f64 | Trường meaning. |

### 3.3 Civilization (Laravel bổ sung vào state_vector)

| Path | Kiểu | Mô tả |
|------|------|--------|
| `civilization.politics.legitimacy_aggregate` | f64 | Legitimacy. |
| `civilization.politics.elite_overproduction` | f64 | Elite overproduction. |
| `civilization.war.war_stage` | string | Mobilization, Campaign, Battles, Attrition, Negotiation. |
| `civilization.war.army.morale` | f64 | Morale. |
| `civilization.economy.trade_flow` | f64 / array | Trade flow. |
| `civilization.demographic.happiness_proxy` | f64 | Happiness proxy (nếu có). |

### 3.4 Zones (mảng)

| Path | Kiểu | Mô tả |
|------|------|--------|
| `zones[i].state.entropy` | f64 | Entropy zone i. |
| `zones[i].state.material_stress` | f64 | Material stress. |
| `zones[i].state.cascade_phase` | string | Normal, Famine, Riots, Collapse. |
| `zones[i].state.civ_fields.*` | f64 | Các field trong zone. |

### 3.5 Events được emit

Rule **chỉ được** emit các event name đã đăng ký. Ví dụ: `REVOLUTION`, `CHAOS_SPIKE`, `CIVIL_WAR`, `FAMINE`, `RIOTS`, `COLLAPSE`, `CRISIS`, `REGIME_SHIFT`, `GREAT_PERSON_BIRTH`, `RELIGION_SPREAD`.

---

## 4. Pipeline thực thi

```
state (JSON / state_vector)
    ↓
Rule VM (Rust): load rules → evaluate conditions → collect actions
    ↓
output: [ { "event": "REVOLUTION", "payload": {} }, { "action": "adjust_stability", "delta": -0.1 } ]
    ↓
Laravel (hoặc Orchestrator): apply actions, emit SimulationEventOccurred
```

- **Điểm gắn:** Sau `advance()` khi đã có snapshot; hoặc trong pipeline post-tick. Gửi state (hoặc subset) vào Rust Rule VM; VM trả về danh sách events/actions.
- **Determinism:** Cùng state + cùng rules + cùng seed (nếu có chance) → cùng output.

---

## 5. File rule (ví dụ)

Đặt trong repo (ví dụ `engine/worldos-rules/rules/` hoặc `backend/config/worldos/rules/`):

```
# rules/civilization.dsl

rule revolution_trigger
  when
    civilization.politics.legitimacy_aggregate < 0.3
    civilization.politics.elite_overproduction > 0.6
  chance 0.15
  then
    emit_event REVOLUTION

rule chaos_high
  when
    entropy > 0.85
    stability_index < 0.3
  then
    emit_event CHAOS_SPIKE
```

---

## 6. Mở rộng sau (Phase 2+)

- **meta_rule:** Rule sinh rule mới (AI / self-improving).
- **metric / fitness:** Định nghĩa metric để AI tối ưu rule.
- **Sandbox limit:** `max_delta`, `resource_cost` cho action (tránh rule bừa).
- **Probabilistic chance:** Biểu thức `chance` phức tạp hơn (ví dụ `0.2 + corruption * 0.3`).

**DSL v2 (AI evolution, scale):** Xem [WorldOS_DSL_Spec_v2.md](WorldOS_DSL_Spec_v2.md) — Expression engine, logical conditions (OR/NOT), state mutation (add/set/spawn), priority/cooldown, rule graph, bytecode VM, actor/narrative/memetic DSL.

---

## 7. Tóm tắt

| Thành phần | Nội dung |
|------------|----------|
| **Cú pháp Phase 1** | rule, when (conditions), chance (optional), then (emit_event, adjust_*). |
| **Cú pháp v2** | when: nhiều dòng AND; dòng `or` = OR với điều kiện trước; dòng `not` + dòng sau = NOT; điều kiện = expr op expr; chance = expr; priority, cooldown, scope; then: add, set, spawn_actor. |
| **State contract** | Chỉ đọc: entropy, stability_index, sci, global_fields, civilization.*, zones[].state.*. |
| **Actions** | emit_event, adjust_stability, adjust_entropy; v2 thêm add path, set path, spawn_actor. |
| **Vị trí thực thi** | Rule VM trong Rust; gọi sau advance/tick; output → Laravel emit/apply. |
