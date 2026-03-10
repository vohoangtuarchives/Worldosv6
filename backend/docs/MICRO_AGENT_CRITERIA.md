# Điều kiện micro_agent / micro actor trong WorldOS

Tài liệu mô tả điều kiện để một cá thể được coi là **micro_agent** hoặc **micro actor** trong mô phỏng, đồng bộ giữa engine và UI.

---

## 1. Định nghĩa

**Micro actor** (micro_agent) = cá thể được mô phỏng chi tiết (có thể có 17-D traits, lifecycle, event) và/hoặc được **ghi vào chronicle/sử** (lưu lâu dài).

---

## 2. Ba nhóm cá thể (thống nhất với HAS)

| Nhóm | Mô tả | Là micro actor? |
|------|--------|------------------|
| **Statistical population** | Không có bản ghi cá thể; chỉ số: population, culture proxy. | Không |
| **Group agents** | Guild, military unit, tribe — aggregate, không có 17-D từng người. | Không (có thể có bảng group riêng sau) |
| **Key actors / Great actors** | Có bản ghi (Actor hoặc SupremeEntity), có thể có traits/impact, được ghi chronicle khi cần. | **Có** |

---

## 3. Điều kiện để một cá thể là micro actor trong WorldOS

### 3.1. Tồn tại bản ghi “cá thể”

Thuộc **một trong hai**:

- **Bảng `actors`**: có `id`, `universe_id`, `traits` (17-D), `biography`, … (bất kỳ actor nào trong DB hiện tại đều coi là key actor).
- **Bảng `supreme_entities`**: có `id`, `universe_id`, `entity_type` (great_person_*, ascended hero), `ascended_at_tick`, … (Great Person / thực thể tối cao).

### 3.2. Spawn trong ngữ cảnh “micro” hoặc “great”

Ít nhất một trong các nguồn sau:

- **Micro mode / zoom-in**: Khi engine bật micro simulation (war, revolution, migration, crisis window) và spawn actor → actor đó là micro actor.
- **Great Person**: Spawn bởi **GreatPersonEngine** → tạo SupremeEntity → **luôn** coi là micro actor (great tier); đã ghi Chronicle `supreme_emergence`.
- **Ascended hero**: Spawn bởi AscensionEngine (hero → SupremeEntity) → cùng cách xử lý như Great Person, đã ghi Chronicle.

### 3.3. Ghi lịch sử (sử)

Micro actor “được lưu vào sử” khi ít nhất một trong các điều sau:

- Có bản ghi **Chronicle** (type: `supreme_emergence`, `legacy_event`, narrative, …) tham chiếu entity/actor (qua payload hoặc convention).
- Có bản ghi **actor_events** (life timeline) cho actor_id tương ứng.
- (Tương lai) Có bản ghi trong causal graph hoặc compressed history với reference tới entity.

---

## 4. Bảng tóm tắt nguồn

| Nguồn | Bảng / Loại | Điều kiện spawn | Ghi Chronicle? |
|-------|-------------|-----------------|-----------------|
| Actor (thường) | actors | Spawn bởi seeder / ProcessActorSurvival / micro mode | Có khi có actor_events hoặc narrative |
| **Great Person** | supreme_entities | GreatPersonEngine: entropy, institutions, cooldown | **Có**, type `supreme_emergence` |
| Ascended hero | supreme_entities | AscensionEngine | Có, qua SpawnSupremeEntityAction |

---

## 5. Great Person = micro actor + đã lưu sử

- **Great Person** (SupremeEntity sinh ra bởi GreatPersonEngine) là **một dạng micro actor** (great tier).
- Mỗi lần spawn, **SpawnSupremeEntityAction** tạo Chronicle (type `supreme_emergence`, from_tick/to_tick, raw_payload.description). Vĩ nhân đã được **lưu vào biên niên sử**.

---

## 6. Gợi ý triển khai (khi có HAS đầy đủ)

- Trường `actor_category` trên Actor (enum: statistical | group | key | great) hoặc `is_micro_agent`.
- Zone/state có `micro_agents: number[]` (danh sách actor_id khi zone đang ở chế độ micro).

Doc chỉ nêu hướng; chưa bắt buộc code.
