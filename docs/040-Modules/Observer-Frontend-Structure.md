# Observer Frontend Structure

Tai lieu nay mo ta cau truc frontend hien tai cua Observer Console sau khi hoan tat data layer, Auditor Expansion, va UX polish.

## 1. Thu muc chinh

### App routes

Base route:

- `frontend/src/app/universes`

Observer routes hien tai:

- `frontend/src/app/universes/page.tsx`
- `frontend/src/app/universes/[universeId]/page.tsx`
- `frontend/src/app/universes/[universeId]/chronicles/page.tsx`
- `frontend/src/app/universes/[universeId]/timeline/page.tsx`
- `frontend/src/app/universes/[universeId]/actors/page.tsx`
- `frontend/src/app/universes/[universeId]/actors/[actorId]/page.tsx`
- `frontend/src/app/universes/[universeId]/axioms/page.tsx`
- `frontend/src/app/universes/[universeId]/snapshots/page.tsx`
- `frontend/src/app/universes/[universeId]/forks/page.tsx`
- `frontend/src/app/universes/[universeId]/myth-scars/page.tsx`
- `frontend/src/app/universes/[universeId]/control/page.tsx`

### Module code

Observer module:

- `frontend/src/modules/observer/api.ts`
- `frontend/src/modules/observer/contracts.ts`
- `frontend/src/modules/observer/types.ts`
- `frontend/src/modules/observer/useObserverUniverseRealtime.ts`
- `frontend/src/modules/observer/components/*`

Shared transport:

- `frontend/src/shared/api/observer-http.ts`

## 2. Phan lop trach nhiem

### `contracts.ts`

Noi dat shape normalize theo contract backend cho:

- `UniverseMetrics`
- `BranchComparison`
- `RealityPulse`
- `AutonomyAudit`
- `MutationDetail`

Chi dat type den tu API. Khong dat UI-only state tai day.

### `types.ts`

Noi dat type domain ma UI observer dung truc tiep:

- universe summary/detail
- chronicle
- actor
- snapshot
- branch
- timeline

### `api.ts`

Noi duy nhat duoc:

- goi fetch server/client
- normalize response
- khai bao query keys
- khai bao query hooks
- khai bao mutation hooks
- khai bao invalidation

Controller UI khong map tay field API nua.

## 3. Query key strategy

Query key duoc tach theo resource:

- `observer.universes.list`
- `observer.universes.{id}.detail`
- `observer.universes.{id}.metrics`
- `observer.universes.{id}.reality-pulse`
- `observer.universes.{id}.autonomy-audit`
- `observer.universes.{id}.autonomy-audit.{dslHash}`
- `observer.universes.{id}.chronicles`
- `observer.universes.{id}.actors`
- `observer.universes.{id}.snapshots`
- `observer.universes.{id}.forks`
- `observer.universes.{id}.timeline`
- `observer.actors.{id}.detail`
- `observer.actors.{id}.events`
- `observer.actors.{id}.decisions`

Nguyen tac:

- Khong nhot resource phu vao `detail`.
- Mutation nao anh huong resource nao thi invalidate resource do.
- Han che `router.refresh()` cho observer flow.
- Realtime chi duoc dung de invalidate dung resource key, khong duoc tao them mot state store song song neu khong can.

## 4. Mutation flow hien tai

### Advance simulation

Hook: `useAdvanceUniverseMutation`

Invalidate:

- list
- detail
- metrics
- realityPulse
- autonomyAudit
- chronicles
- mythScars
- actors
- snapshots
- forks
- timeline

### Toggle status

Hook: `useToggleUniverseStatusMutation`

Invalidate:

- detail
- metrics
- realityPulse

### Create snapshot

Hook: `useCreateUniverseSnapshotMutation`

Invalidate:

- detail
- metrics
- realityPulse
- snapshots

### Fork branch

Hook: `useForkUniverseMutation`

Invalidate:

- detail
- metrics
- realityPulse
- forks

## 5. Control surface

File chinh:

- `frontend/src/modules/observer/components/UniverseControlClient.tsx`

Thanh phan chinh:

- `RealityCore.tsx`
- `MutationStream.tsx`
- `ObserverControlSurface.tsx`
- `useObserverUniverseRealtime.ts`

Control page preload:

- universe detail
- reality pulse
- autonomy audit

Muc tieu la vao tab control la thay duoc:

- branch dang o tick nao
- entropy da sat nguong autopoiesis chua
- co DSL nao da mutate chua
- diff duoc mutation detail neu can
- co the advance/fork/toggle/snapshot ma panel lien quan tu cap nhat

## 6. Divergence timeline

File chinh:

- `frontend/src/modules/observer/components/UniverseTimelineClient.tsx`

Timeline hien tai tach 3 lane:

- causal ticks
- observer interventions
- autopoiesis mutations

Cross-link chinh:

- timeline -> chronicles
- chronicles -> timeline
- mutation lane -> control diff

## 7. AI diagnostics

Page:

- `frontend/src/app/dashboard/ai-config/page.tsx`

Tabs hien tai:

- config
- diagnostics
- audit logs

Diagnostics dung route backend:

- `GET /api/ai-settings/drivers`
- `POST /api/ai-settings/diagnostics`
- `GET /api/ai-logs`

Thanh phan phu:

- `frontend/src/app/dashboard/ai-config/AiDiagnosticsTelemetry.tsx`

## 8. UX quy uoc

- Empty state phai noi ro user nen lam gi tiep theo.
- Error state phai co retry neu du lieu co the fetch lai.
- Loading state phai co skeleton, khong de spinner don doc neu co the trinh bay card/list.
- Sidebar observer phai dung duoc tren mobile/tablet, khong chi desktop.
- Copy trong observer nen nhat quan theo goc nhin: observer / branch / control / timeline / mutation.

## 9. Quy uoc mo rong

- Neu them tab moi: uu tien tao server preload + client query hook, khong fetch lung tung trong component con.
- Neu them resource moi: dat type o `contracts.ts`, normalize o `api.ts`, sau do UI moi doc.
- Neu them mutation moi: viet invalidation ro rang truoc khi lam UI.
- Neu them realtime event moi: map event vao invalidate resource key truoc, chi tao live state rieng neu thuc su can hieu ung UI lien tuc.