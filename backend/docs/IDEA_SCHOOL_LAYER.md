# Idea / School Layer — Phase 4

Ideas bắt nguồn từ artifact (hoặc actor); khi đủ followers thì hình thành School. Culture có thể derive từ dominant ideas.

---

## Schema

**ideas**: id, universe_id, origin_actor_id, artifact_id, theme, influence_score, followers, birth_tick.

**schools**: id, universe_id, founder_actor_id, idea_id, name, members, influence, status (emerging, growing, dominant, declining, collapsed).

---

## IdeaDiffusionEngine

- **Kích hoạt**: mỗi pulse (khi `worldos.idea_diffusion.run_on_pulse` bật).
- **Logic**: (1) Artifact có creator nhưng chưa có idea → tạo Idea (origin_actor_id, artifact_id, theme, influence_score từ impact_score). (2) Cập nhật ideas: tăng influence_score và followers nhẹ mỗi tick. (3) Khi idea.followers ≥ threshold → tạo School (founder = origin_actor, idea_id, name, members, status = emerging); ghi Chronicle `school_founded`.
- **Config**: `worldos.idea_diffusion` — followers_threshold_for_school, influence_growth_per_tick.

---

## Link tới Institution

Phase 5: khi school đạt điều kiện có thể tạo InstitutionalEntity (founder_actor_id, idea_id, institution_type, status). Idea/School là bước trung gian Actor → Institution.
