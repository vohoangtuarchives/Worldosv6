# Observer API Contract

Tai lieu nay khoa contract dang duoc frontend Observer Console su dung sau dot chuan hoa response va bo `router.refresh()` tho.

## 1. Nguyen tac contract

- Nhom `worldos` la contract chinh cho observer UI.
- Du lieu doc cho cac resource chinh di qua React Query key rieng theo resource:
  - `detail`
  - `metrics`
  - `chronicles`
  - `actors`
  - `snapshots`
  - `forks`
  - `timeline`
  - `realityPulse`
  - `autonomyAudit`
- Cac endpoint `worldos` uu tien tra response theo envelope `data`.
- Cac endpoint `apex` va `ai-settings/diagnostics` hien tra JSON truc tiep, frontend da normalize rieng.
- Frontend khong duoc doan field ngoai cac shape ben duoi.

## 2. WorldOS observer routes

Prefix: `/api/worldos`

### Universe

- `GET /universes`
  - Muc dich: danh sach universe cho sidebar/index.
  - Shape toi thieu moi item:
    - `id`
    - `name`
    - `status`
    - `current_tick`
    - `stability`
    - `entropy`
    - `era`
    - `branch_count`
    - `anomaly_count`
    - `focus`

- `GET /universes/{id}`
  - Muc dich: detail cho overview/control shell.
  - Shape toi thieu:
    - toan bo field cua summary
    - `axioms`

- `GET /universes/{id}/metrics`
  - Muc dich: metric gon de refetch sau mutation.
  - Shape:
    - `universe_id`
    - `status`
    - `current_tick`
    - `stability`
    - `entropy`
    - `snapshot_count`
    - `branch_count`
    - `actor_count`
    - `chronicle_count`
    - `anomaly_count`

- `POST /universes/{id}/toggle-status`
  - Muc dich: pause/resume branch.
  - Frontend can `new_status`.

- `POST /universes/{id}/snapshots`
  - Muc dich: tao snapshot.
  - Frontend can:
    - `data.snapshot.tick`
    - `data.snapshot.id`

- `GET /universes/{id}/snapshots`
  - Shape moi item:
    - `id`
    - `label`
    - `tick`
    - `created_at`
    - `note`
    - `entropy`
    - `stability_index`
    - `metrics`

- `POST /universes/{id}/fork`
  - Payload:
    - `tick`
    - `name?`
  - Frontend can:
    - `data.child_universe_id`

- `GET /universes/{id}/forks`
  - Shape moi item:
    - `id`
    - `label | name`
    - `divergence_tick`
    - `status`
    - `current_tick`

- `GET /universes/{id}/forks/compare?branch_id={branchId}`
  - Shape:
    - `universe_id`
    - `branch_id`
    - `source`
    - `branch`
    - `tick_span`
    - `deltas`
    - `metric_deltas`

### Narrative / timeline

- `GET /universes/{id}/chronicles`
  - Moi item:
    - `id`
    - `tick`
    - `title`
    - `summary`
    - `type`
    - `from_tick`
    - `to_tick`
    - `importance`

- `GET /universes/{id}/myth-scars`
  - Moi item:
    - `id`
    - `title`
    - `severity`
    - `origin_tick`
    - `consequence`
    - `severity_score`

- `GET /universes/{id}/history-timeline`
  - Moi item:
    - `id`
    - `tick`
    - `year`
    - `category`
    - `zone`
    - `summary`
    - `actors`
    - `institutions`
    - `facts`

### Actors

- `GET /universes/{id}/actors`
  - Moi item:
    - `id`
    - `name`
    - `role`
    - `influence`
    - `alignment`
    - `last_decision`

- `GET /actors/{id}`
  - Shape:
    - summary fields
    - `biography`
    - `traits`
    - `metrics`
    - `stats`
    - `capabilities`
    - `vitality`
    - `life_stage`
    - `is_alive`
    - `birth_tick`
    - `death_tick`
    - `supreme_entity`
    - `recent_events`

- `GET /actors/{id}/events`
  - Moi item:
    - `id`
    - `tick`
    - `type`
    - `summary`

- `GET /actors/{id}/decisions`
  - Moi item:
    - `id`
    - `tick`
    - `action_type`
    - `summary`
    - `confidence`
    - `utility_score`
    - `impact`

### Simulation control

- `POST /simulation/advance`
  - Payload:
    - `universe_id`
    - `ticks`
  - Sau khi thanh cong, frontend invalidate:
    - `detail`
    - `metrics`
    - `realityPulse`
    - `autonomyAudit`
    - `chronicles`
    - `mythScars`
    - `actors`
    - `snapshots`
    - `forks`
    - `timeline`

## 3. Apex observer routes

Prefix: `/api/apex`

- `GET /wavefunction/{universeId}`
  - Shape:
    - `universe_id`
    - `tick`
    - `wavefunction.entropy`
    - `wavefunction.stability_index`
    - `wavefunction.information_density`
    - `wavefunction.active_attractor`
    - `wavefunction.collapse_probability`
    - `autopoiesis.enabled`
    - `autopoiesis.entropy_threshold`
    - `autopoiesis.mutation_history_size`
    - `autopoiesis.last_mutation_vector`

- `GET /informational-mass/{universeId}`
  - Shape:
    - `universe_id`
    - `tick`
    - `informational_mass`
    - `information_density`
    - `field_contributions`
    - `singularity_risk`

- `GET /mutation-chronicle/{universeId}`
  - Shape:
    - `universe_id`
    - `total_mutations`
    - `chronicle[]`
      - `dsl_hash`
      - `version_count`
      - `has_current`

Frontend hop nhat 3 route nay thanh 2 resource:

- `realityPulse`
- `autonomyAudit`

## 4. AI diagnostics routes

Prefix: `/api/ai-settings`

- `GET /drivers`
  - Shape: `string[]`

- `POST /diagnostics`
  - Payload:
    - `driver`
    - `prompt`
  - Success shape:
    - `status = success`
    - `driver`
    - `prompt`
    - `latency_ms`
    - `response`
    - `checked_at`
  - Error shape:
    - `status = error`
    - `driver`
    - `prompt`
    - `latency_ms`
    - `error`
    - `checked_at`

## 5. Quy uoc thay doi contract

- Neu them field moi: chi add, khong doi ten field cu dang duoc UI doc.
- Neu doi shape: cap nhat dong bo 3 cho:
  - backend resource/controller
  - `frontend/src/modules/observer/api.ts`
  - tai lieu nay
- Neu them resource moi tren observer: phai co query key rieng, khong gom tam vao `detail`.
