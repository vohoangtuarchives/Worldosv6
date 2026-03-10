# Artifact Layer — Phase 3

Artifacts là đối tượng văn hóa do actor (hoặc institution) tạo ra: book, poem, painting, law, religion, theory, architecture, music. Chronicle ghi lại `artifact_created` với `actor_id` và `importance`.

---

## Schema: artifacts

| Cột | Mô tả |
|-----|--------|
| id | PK |
| universe_id | FK |
| creator_actor_id | FK nullable → actors |
| institution_id | FK nullable → institutional_entities (khi institution tạo artifact) |
| artifact_type | book, poem, painting, law, religion, theory, architecture, music |
| title | nullable |
| theme | nullable |
| culture | nullable |
| tick_created | tick tạo |
| impact_score | float 0–1 |
| metadata | JSON |

---

## ArtifactCreationEngine

- **Input**: actor (đã có capabilities), universe, tick, action (write / create_religion / build), SimulationRandom.
- **Điều kiện**: `capabilities.creativity` ≥ threshold, cognition (Pra,Cur,Dog,Rsk trung bình) ≥ threshold, random < create_probability.
- **Logic**: tạo bản ghi `artifacts`; map action → artifact_type (write→book, create_religion→religion, build→architecture). Ghi Chronicle type `artifact_created`, actor_id, importance = influence × impact_score; ghi ActorEvent `artifact_created`.
- **Config**: `worldos.artifact` — creativity_threshold, cognition_threshold, create_probability, action_to_type.

---

## Chronicle

Khi tạo artifact, Chronicle có: type `artifact_created`, actor_id = creator_actor_id, importance. HistoryEngine có thể query top by importance hoặc by actor_id.
