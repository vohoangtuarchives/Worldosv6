# WorldOS Simulation DSL v2 — Spec & Lộ trình

> Phân tích và thiết kế nâng cấp từ DSL Phase 1 hiện tại, hướng tới **AI tự viết rule** và **simulation tiến hóa**.  
> Tham chiếu: [WorldOS_DSL_Spec.md](WorldOS_DSL_Spec.md) (Phase 1), [WorldOS_Architecture.md](WorldOS_Architecture.md).

---

## 1. Đánh giá DSL Engine hiện tại (v1)

### Pipeline hiện tại

```
DSL text → parse.rs → AST (Rule) → eval.rs → RuleOutput (event / adjustments)
```

- **Điểm mạnh:** DSL gọn, AI dễ generate; state JSON (serde_json) tốt cho integration; VM model (load_rules, evaluate) đúng hướng.
- **Hạn chế so với mục tiêu WorldOS tiến hóa rule bằng AI:**

| Thiếu | Mô tả |
|-------|--------|
| **Expression Engine** | Chỉ hỗ trợ `path op value`, chưa có biểu thức (entropy + pressure > 1.2, wealth / population < 10). |
| **Logical Conditions** | Chỉ AND (all()); chưa OR, NOT, nhóm (when (A OR B) AND C). |
| **State mutation** | Chỉ adjust_stability / adjust_entropy; chưa set path, add path, spawn entity. |
| **Rule control** | Chưa priority, cooldown, once_per_tick → dễ spam event. |
| **Rule Graph** | Rule đứng riêng lẻ; chưa dependencies / trigger chain cho AI evolution. |
| **Bytecode VM** | Đang interpret AST; chưa compile sang bytecode cho scale (100k rules). |

---

## 2. Cấu trúc DSL v2 (Core)

### 2.1 Rule đầy đủ

```
rule revolution_trigger
  priority 80
  cooldown 20y
  scope civilization

  when
    legitimacy < 0.3
    entropy > 0.6
    elite_loyalty < 0.4

  chance
    sigmoid(entropy * 1.5)

  then
    emit_event REVOLUTION
    add social_unrest 0.4
    spawn_actor revolutionary_leader
```

Các block chuẩn: **rule**, **priority**, **cooldown**, **scope**, **when**, **chance**, **then**.

---

## 3. Expression System (AST)

Điều kiện và chance cần **biểu thức**, không chỉ path so với literal.

**DSL ví dụ:**

```
when
  entropy + economic_pressure > 1.2
chance
  clamp((entropy - legitimacy) * 0.4)
```

**AST đề xuất:**

```rust
pub enum Expr {
    ConstFloat(f64),
    ConstInt(i64),
    ConstStr(String),
    Path(String),

    Add(Box<Expr>, Box<Expr>),
    Sub(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
    Div(Box<Expr>, Box<Expr>),

    FunctionCall {
        name: String,
        args: Vec<Expr>,
    },
}
```

Hàm hỗ trợ: `sigmoid(x)`, `logistic(x)`, `clamp(x)` hoặc `clamp(x, lo, hi)`, `random()` (cho chance).

---

## 4. Logical Conditions (AST)

**DSL:**

```
when
  (legitimacy < 0.3 OR corruption > 0.7)
  AND military_loyalty < 0.5
```

**AST đề xuất:**

```rust
pub enum ConditionExpr {
    Comparison {
        left: Expr,
        op: Op,
        right: Expr,
    },
    And(Box<ConditionExpr>, Box<ConditionExpr>),
    Or(Box<ConditionExpr>, Box<ConditionExpr>),
    Not(Box<ConditionExpr>),
}
```

Rule khi đó có `when: ConditionExpr` (một cây) thay vì `conditions: Vec<Condition>` (chỉ AND).

---

## 5. Action System (State mutation)

**DSL:**

```
then
  add unrest 0.2
  set government.type "military_junta"
  spawn_actor revolutionary_leader
  emit_event REVOLUTION
```

**AST đề xuất:**

```rust
pub enum Action {
    EmitEvent(String),

    Add { path: String, value: Expr },
    Set { path: String, value: Expr },

    SpawnActor { kind: String },
    SpawnInstitution { kind: String },
}
```

- **add** path: cộng giá trị vào số tại path (có thể clamp).
- **set** path: gán giá trị (số hoặc string) tại path.
- **spawn_actor / spawn_institution**: request tạo thực thể; Orchestrator/Laravel hoặc Rust kernel thực hiện.

---

## 6. Rule metadata: priority, cooldown

**DSL:**

```
rule revolution_trigger
  priority 80
  cooldown 20y
```

**AST:**

```rust
pub struct Rule {
    pub name: String,
    pub priority: u32,           // cao = ưu tiên trước
    pub cooldown_ticks: Option<u64>,  // "20y" → quy đổi theo tick
    pub scope: Option<String>,   // civilization | zone | global
    pub when: ConditionExpr,
    pub chance: Expr,            // thay vì f64
    pub actions: Vec<Action>,
}
```

Runtime: mỗi rule khi fire ghi `last_fired_tick`; rule chỉ được xét lại khi `tick - last_fired_tick >= cooldown_ticks`. Sắp xếp rule theo priority trước khi evaluate.

---

## 7. Rule Graph (AI evolution)

Rule không chỉ là list mà có **đồ thị phụ thuộc / kích hoạt**:

```
low_legitimacy → elite_split → revolution → civil_war
```

**AST / model:**

```rust
pub struct RuleGraph {
    pub rules: Vec<Rule>,
    /// (trigger_rule_id, effect_rule_id): effect có thể được “gợi ý” sau khi trigger fire
    pub dependencies: Vec<(RuleId, RuleId)>,
}
```

AI có thể: khám phá rule mới, nối vào graph, điều chỉnh xác suất / tham số.

---

## 8. Các lớp DSL bổ sung (v2)

| Lớp | Mục đích | Ví dụ |
|-----|----------|--------|
| **Simulation Rule DSL** | Luật thế giới (đã có + bổ sung expr, logic, mutation). | rule revolution_trigger ... |
| **Actor Behavior DSL** | Hành vi theo từng loại actor. | behavior ambitious_general when ambition > 0.7 then attempt_coup |
| **Narrative DSL** | Sinh sự kiện lịch sử / story. | narrative fall_of_empire when ... then story "The empire begins to fracture." |
| **Memetic DSL** | Ý tưởng tiến hóa (fitness, spread, mutation). | meme democracy fitness legitimacy + education - repression |

Tất cả compile về **Rule Graph → Rule VM → World Mutation → Event Stream**.

---

## 9. Probability functions

**DSL:**

```
chance  sigmoid(x)
chance  logistic(x)
chance  clamp((entropy - legitimacy) * 0.4)
chance  random()
```

VM cần implement: `sigmoid`, `logistic`, `clamp`, `random()` (dùng RNG đã có). AI dễ generate tham số và công thức.

---

## 10. Bytecode VM (scale)

Để chạy ~100k rule, nên **compile** rule sang bytecode thay vì interpret AST mỗi tick.

**Ví dụ bytecode:**

```
LOAD legitimacy
PUSH 0.3
LT
LOAD entropy
PUSH 0.6
GT
AND
JUMP_IF_FALSE end
EMIT REVOLUTION
ADD unrest 0.4
end:
```

Pipeline: **DSL → Parser → AST → Rule Graph → Bytecode → Simulation VM**.

---

## 11. Condition index (scale)

Tránh evaluate toàn bộ rule mỗi tick: **index rule theo path** (ví dụ entropy, legitimacy, wealth). Chỉ evaluate rule có điều kiện phụ thuộc vào các path vừa thay đổi (hoặc theo nhóm path). Có thể triển khai sau khi đã có Expr + ConditionExpr (biết rule đọc path nào).

---

## 12. Kiến trúc tổng thể DSL v2

```
WorldOS DSL
├── Simulation Rule DSL  (when/then, expr, mutation, priority, cooldown)
├── Actor Behavior DSL   (behavior ... when ... then)
├── Narrative DSL        (narrative ... story)
└── Memetic DSL          (meme ... fitness / spread / mutation)
        │
        ▼
   Parser → AST (Expr, ConditionExpr, Action, Rule)
        │
        ▼
   Rule Graph (dependencies, priority)
        │
        ▼
   Bytecode (optional) → Rule VM
        │
        ▼
   World Mutation + Event Stream
```

---

## 13. Lộ trình triển khai đề xuất

| Phase | Nội dung | Ghi chú |
|-------|----------|--------|
| **v2.1** | **Expr** (Const, Path, Add/Sub/Mul/Div, FunctionCall cơ bản) | when/chance dùng Expr thay vì path + literal. |
| **v2.2** | **ConditionExpr** (Comparison, And, Or, Not) | Parser when ( ... OR ... ) AND ...; eval recursive. |
| **v2.3** | **Action mở rộng** (Add path, Set path, SpawnActor) | RuleOutput + Laravel/kernel xử lý spawn. |
| **v2.4** | **priority, cooldown** | Rule struct + runtime cooldown + sort by priority. |
| **v2.5** | **Rule Graph** (dependencies) | Cấu trúc RuleGraph; chưa bắt buộc runtime dùng graph. |
| **v2.6** | **Bytecode compile + VM** | Khi số rule lớn; có thể dùng crate kiểu bytecode. |
| **v2.7** | **Actor / Narrative / Memetic DSL** | Parser riêng hoặc chung; compile về cùng Rule/Event. |

---

## 14. Tóm tắt

- **v1 hiện tại:** 8/10 DSL design, 9/10 parser, 8/10 VM; simulation readiness ~6/10, AI evolution readiness ~4/10.
- **v2 mục tiêu:** Expression, logical conditions, state mutation, priority/cooldown, rule graph, bytecode VM, đa lớp DSL → **Civilization Simulation DSL** và **AI tự generate rule**.
- **Tài liệu này** là spec tham chiếu cho DSL v2; triển khai từng phase theo bảng §13.
