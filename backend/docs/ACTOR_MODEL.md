# Actor Model — Multiverse Simulation

Kiến trúc actor cho trace genealogy, civilization history, evolution analysis và culture emergence.

---

## 1. Actor Identity (chuẩn multiverse)

| Field | Type | Mô tả |
|-------|------|--------|
| `id` | bigint | PK |
| `universe_id` | FK | Vũ trụ chứa actor |
| `generation` | int | Thế hệ (1, 2, …) |
| `lineage_id` | string (64) | ID dòng dõi / gia tộc — trace genealogy, culture evolution |
| `parent_actor_id` | FK nullable | Actor cha (sinh ra actor này) |
| `birth_tick` | unsigned bigint | Tick sinh ra trong simulation |
| `death_tick` | unsigned bigint nullable | Tick chết (null = còn sống hoặc chưa ghi nhận) |

**Lý do**: Trace genealogy, civilization history, evolution analysis. Thiếu lineage thì culture evolution rất khó truy vết.

---

## 2. Vitality (mở rộng beyond alive/dead)

Hiện tại: `is_alive` (boolean) vẫn giữ cho tương thích.

**Mô hình mở rộng** (optional JSON `vitality`):

- `health` — sức khỏe (0–1 hoặc 0–100)
- `age` — tuổi (số tick hoặc năm)
- `fatigue` — mệt mỏi
- `morale` — tinh thần

Vitality tổng hợp: `vitality = f(health, age, starvation)` (engine có thể tính từ health, age, famine event).

Các engine **famine**, **war**, **disease** cần vitality chi tiết hơn alive/dead để mô phỏng từng giai đoạn.

---

## 3. Cognition

**Cách hiện tại (đúng hướng)**: Từ 4 trait cognitive block — Pra (Pragmatism), Cur (Curiosity), Dog (Dogmatism), Rsk (Risk):

- `cognition = weighted(pragmatism, curiosity, dogmatism, risk)`

**Đề xuất tách**:

- **cognitive_capacity** — năng lực nhận thức (tổng hợp 4 trait)
- **decision_style** — phong cách quyết định (vd. high cognition + low curiosity → conservative strategist)

Có thể lưu derived trong `metrics` (vd. `metrics.cognitive_capacity`, `metrics.decision_style`) hoặc tính on-the-fly từ traits.

---

## 4. 17-D Psychological Model

`traits`: mảng 17 float, 0–1 (hoặc 0–100 tùy quy ước).

| Ký hiệu | Ý nghĩa |
|--------|--------|
| Dom | Dominance |
| Amb | Ambition |
| Coe | Coercion (Power) |
| Loy | Loyalty |
| Emp | Empathy |
| Sol | Solidarity |
| Con | Conformity (Social) |
| Pra | Pragmatism |
| Cur | Curiosity |
| Dog | Dogmatism |
| Rsk | Risk tolerance (Cognitive) |
| Fer | Fear |
| Ven | Vengeance |
| Hop | Hope |
| Grf | Grief |
| Pri | Pride |
| Shm | Shame (Emotional) |

Đây là personality vector; simulation lưu `traits: float[17]`.

---

## 5. trait_scan_status (UX radar)

Backend state cho 17-D scan:

- **unknown** — chưa có dữ liệu (radar fallback: overlay "Chưa có dữ liệu scan 17-D")
- **estimated** — ước lượng từ engine / proxy
- **confirmed** — đã scan đầy đủ

Giúp UI hiển thị mức độ tin cậy của radar.

---

## 5b. Capability layer

Capabilities là vector khả năng (0–1) tính từ traits, age, và context, dùng cho ActorDecisionEngine và ArtifactCreationEngine.

| Key | Nguồn (configurable) | Ví dụ công thức |
|-----|------------------------|------------------|
| intellect | traits | Pra + Cur − Dog (indices 7, 8, 9) |
| charisma | traits | Dom + Amb + Emp (0, 1, 4) |
| wealth | traits hoặc metrics | Amb + Coe + Rsk |
| followers | traits hoặc metrics | Emp + Sol + Con |
| authority | traits hoặc metrics | Dom + Coe + Pri |
| creativity | traits | Cur + Rsk + Hop |

**Engine**: `App\Services\Simulation\CapabilityEngine` — `compute(Actor, currentTick)` trả về mảng capabilities; `computeAndStore()` ghi vào `actor.capabilities`. Config: `worldos.capability` (formula per key: trait index => weight). **hero_stage**: latent | awakening | rising | peak | legacy | myth — dùng cho hero lifecycle (Phase 7).

---

## 6. Chronicle → actor_events (life timeline)

**Bảng `actor_events`**:

| Cột | Mô tả |
|-----|--------|
| actor_id | FK → actors |
| tick | Tick xảy ra sự kiện |
| event_type | Loại (migration, birth, death, invention, leadership, …) |
| context | JSON (mô tả, tham số) |

Chronicle trở thành **life timeline**: danh sách sự kiện theo tick cho từng actor. API: `GET /worldos/actors/{actorId}/events`.

Ví dụ: *Year 210 — Actor joined migration* (event_type + context).

---

## 7. Metrics — semantic

- **energy** — action capacity (khả năng hành động trong tick)
- **contribution** — civilization impact score (đóng góp cho nền văn minh)
  - contribution += invention, leadership, …

Có thể mở rộng thêm trong `metrics` (JSON).

---

## 8. Lifecycle (life_stage)

Một actor có thể đi qua:

- **birth** → **childhood** → **adult** → **elder** → **death**

Trường `life_stage` (string, nullable) lưu giai đoạn hiện tại. Engine (survival, famine, disease) cập nhật theo tick/event.

---

## 9. Actor ↔ Culture (hướng mở rộng)

Để culture emerge từ actor, có thể thêm:

- **known_memes** — meme/ý tưởng đã biết
- **beliefs** — niềm tin
- **skills** — kỹ năng
- **relationships** — quan hệ với actor khác (graph)

Culture emerge từ shared beliefs, diffusion memes, v.v. Có thể để sau khi nền tảng lineage + actor_events ổn định.

---

## 10. Kiến trúc actor đề xuất (tóm tắt)

```
actor
 ├─ id
 ├─ universe_id
 ├─ generation
 ├─ lineage_id
 ├─ parent_actor_id
 ├─ birth_tick
 ├─ death_tick
 ├─ life_stage          (birth | childhood | adult | elder | death)
 ├─ traits[17]          (0–1)
 ├─ trait_scan_status   (unknown | estimated | confirmed)
 ├─ vitality            (optional JSON: health, age, fatigue, morale)
 ├─ metrics             (influence, energy, contribution, …)
 ├─ biography           (text chronicle legacy)
 └─ is_alive            (boolean, kept for compatibility)

actor_events (life timeline)
 ├─ actor_id
 ├─ tick
 ├─ event_type
 └─ context (JSON)
```

---

## 11. O(n²) và agent abstraction / HAS

Nếu mỗi actor có **belief**, **skill**, **trait**, **relationship**, simulation có thể bị **O(n²) interaction explosion**. Nhiều hệ dùng **agent abstraction**: nhóm actor thành **actor_group** (macro agent) để giảm độ phức tạp. Có thể bổ sung `actor_groups` và map actor → group khi scale lớn.

**Hierarchical Agent Simulation (HAS)**: Tổ chức Universe → Region → City → Group → Actor; macro mode chỉ chạy population/culture, micro mode spawn key actors khi cần. Xem [22-hierarchical-temporal-causal.md](../../docs/system/22-hierarchical-temporal-causal.md) (§1, §6.2).

---

## 12. Great Person và Chronicle

**Great Person** (SupremeEntity) được lưu vào **Chronicle** (type `supreme_emergence`) khi spawn qua SpawnSupremeEntityAction. Great Person là một dạng **micro actor** (tier “great”). Điều kiện chi tiết “cá thể nào là micro actor” xem [MICRO_AGENT_CRITERIA.md](MICRO_AGENT_CRITERIA.md).

---

## 13. Đánh giá hiện tại

- **Điểm mạnh**: trait system 17-D, cognition abstraction (Pra/Cur/Dog/Rsk), chronicle/biography, metrics (influence, energy, contribution), lineage + birth/death tick, actor_events.
- **Đã bổ sung**: lineage_id, parent_actor_id, birth_tick, death_tick, life_stage, trait_scan_status, vitality (JSON), actor_events table.
- **Có thể mở rộng sau**: beliefs, skills, relationships, known_memes; actor_group để tránh O(n²).
