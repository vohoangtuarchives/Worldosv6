# Institution Layer (Phase 5) — Mở rộng

Institution tồn tại lâu hơn actor; pipeline Actor → Idea → School → Institution. Schema mở rộng và decay.

---

## Schema mở rộng: institutional_entities

Thêm cột: founder_actor_id, idea_id, institution_type (religion, philosophy_school, academy, empire, …), status (emerging, growing, dominant, declining, collapsed), members, zone_id.

## institution_leaders

Bảng: institution_id, actor_id, start_tick, end_tick — succession (actor chết, institution sống).

---

## Pipeline School → Institution

Khi IdeaDiffusionEngine tạo School (idea.followers ≥ threshold), đồng thời tạo InstitutionalEntity (founder_actor_id, idea_id, institution_type = philosophy_school, status = emerging). Chronicle type `institution_founded`.

---

## InstitutionDecayService

Mỗi pulse (khi run_decay_on_pulse bật): giảm legitimacy theo decay_rate; khi legitimacy ≤ 0.2 set status = declining; khi ≤ 0 set status = collapsed, collapsed_at_tick, Chronicle `institution_collapse`. Config: worldos.institution.decay_rate, run_decay_on_pulse.

---

## Chronicle types

institution_founded, institution_collapse (institution_split / institution_peak có thể thêm sau).
