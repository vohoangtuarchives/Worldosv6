---
name: ""
overview: ""
todos: []
isProject: false
---

# Phương án chỉnh đổi cơ chế tự fork Universe (rev. 2)

## Tổng quan

Sửa bug và chuẩn hóa kiến trúc: (1) ForkUniverseAction trả về `?Universe` và dùng BranchRepository cho idempotent fork; (2) SagaService::ensureSaga(Universe) thay cho logic saga trong listener; (3) Config ngưỡng fork/archive; (4) Navigator không ghi đè fork → archive; (5) Ràng buộc fork (idempotent + tối đa một lần fork mỗi universe hoặc max_generation) để tránh vòng lặp vô hạn.

---

## 1. BranchRepository + ForkUniverseAction idempotent

**Mục tiêu:** Action không kiểm tra DB trực tiếp; replay event cùng tick không tạo hai universe.

**Tạo Contract và Implementation:**

- **Contract** `App\Contracts\Repositories\BranchEventRepositoryInterface` (hoặc `BranchRepositoryInterface`):
  - `existsFork(int $universeId, int $fromTick): bool` — đã tồn tại bản ghi fork cho cặp (universe_id, from_tick).
  - `hasForkAsParent(int $universeId): bool` — universe này đã từng là parent của ít nhất một fork (một universe chỉ được fork từ tối đa một lần, tránh nhánh vô hạn).
- **Implementation** (ví dụ `App\Repositories\BranchEventRepository`):
  - `existsFork`: `BranchEvent::where('universe_id', $universeId)->where('from_tick', $fromTick)->where('event_type', 'fork')->exists()`.
  - `hasForkAsParent`: `BranchEvent::where('universe_id', $universeId)->where('event_type', 'fork')->exists()`.
- **Đăng ký binding** trong `AppServiceProvider` hoặc `RepositoriesServiceProvider`: `BranchEventRepositoryInterface` → `BranchEventRepository`.

**ForkUniverseAction** [backend/app/Actions/Simulation/ForkUniverseAction.php](backend/app/Actions/Simulation/ForkUniverseAction.php):

- Inject `BranchEventRepositoryInterface` (hoặc tên đã chọn).
- Signature: `execute(Universe $universe, int $fromTick, array $decisionData): ?Universe`.
- Logic:
  1. Nếu `$this->branchRepository->existsFork($universe->id, $fromTick)` → `return null` (idempotent cho replay).
  2. (Tùy chọn nhưng nên có) Nếu `$this->branchRepository->hasForkAsParent($universe->id)` → `return null` (mỗi universe chỉ được fork từ tối đa một lần).
  3. Tạo BranchEvent (fork), gọi `$childUniverse = $this->sagaService->spawnUniverse(...)`, cập nhật state_vector entropy, `return $childUniverse`.

Không còn gọi `BranchEvent::where(...)->exists()` trực tiếp trong Action.

---

## 2. Listener dùng SagaService::ensureSaga; Action trả về Universe

**SagaService** [backend/app/Services/Saga/SagaService.php](backend/app/Services/Saga/SagaService.php):

- Thêm method:
  - `ensureSaga(Universe $universe): ?Saga`
  - Nếu `$universe->saga` đã có → return nó.
  - Nếu không có `$universe->world` → return null.
  - `$saga = $universe->world->sagas()->firstOrCreate(['name' => 'Default Saga of ' . $universe->world->name], ['status' => 'active'])`.
  - Gán `$universe->saga_id = $saga->id`, `$universe->save()`.
  - Return `$saga`.

**EvaluateSimulationResult::handleFork** [backend/app/Listeners/Simulation/EvaluateSimulationResult.php](backend/app/Listeners/Simulation/EvaluateSimulationResult.php):

- Gọi `$saga = $this->sagaService->ensureSaga($universe);`
- Nếu `!$saga` → return (không fork).
- Dùng `$saga` cho `activeCount` (where saga_id = $saga->id) và logic halt parent.
- `$childUniverse = $this->forkUniverseAction->execute($universe, $tick, $decision);`
- Nếu `$childUniverse && $activeCount >= 1` → `$this->universeRepository->update($universe->id, ['status' => 'halted'])`.

Listener chỉ orchestration, không chứa business rule tạo saga.

---

## 3. Config ngưỡng fork/archive

**Config** [backend/config/worldos.php](backend/config/worldos.php):

- Thêm block (ví dụ sau `intelligence` hoặc block riêng):
  - `'autonomic' => ['fork_entropy_min' => (float) env('WORLDOS_FORK_ENTROPY_MIN', 0.5), 'archive_entropy_threshold' => (float) env('WORLDOS_ARCHIVE_ENTROPY_THRESHOLD', 0.99)]`

**StrategicDecisionEngine** [backend/app/Modules/Simulation/Services/StrategicDecisionEngine.php](backend/app/Modules/Simulation/Services/StrategicDecisionEngine.php):

- Đọc `$forkMin = config('worldos.autonomic.fork_entropy_min', 0.5);`
- Đọc `$archiveThreshold = config('worldos.autonomic.archive_entropy_threshold', 0.99);`
- Base recommendation: `entropy >= $archiveThreshold` → archive; `entropy >= $forkMin` → fork; ngược lại → continue.

Không hardcode 0.6 / 0.99 trong engine.

---

## 4. Navigator không ghi đè fork thành archive

**DecisionEngine** [backend/app/Services/Simulation/DecisionEngine.php](backend/app/Services/Simulation/DecisionEngine.php):

- Trong `decide()`, sửa điều kiện ghi đè archive:
  - Hiện tại: `elseif ($navScore['total'] <= self::ARCHIVE_THRESHOLD) { $recommendation = 'archive'; }`
  - Thành: `elseif ($navScore['total'] <= self::ARCHIVE_THRESHOLD && $recommendation !== 'fork') { $recommendation = 'archive'; }`
- Rule: ARCHIVE > FORK > CONTINUE về độ ưu tiên, nhưng navigator chỉ ép archive khi catastrophe; nếu evaluator đã trả fork thì không ghi đè sang archive.

---

## 5. Ràng buộc fork: idempotent + một lần mỗi universe (và tùy chọn max_generation)

- **Idempotent theo tick:** Đã nêu ở mục 1 — `existsFork($universeId, $fromTick)` đảm bảo cùng tick replay không tạo hai universe.
- **Một lần fork mỗi universe (với tư cách parent):** `hasForkAsParent($universeId)` — nếu universe này đã từng là parent của một fork thì không fork nữa → tránh chuỗi A→B→C→D vô hạn nếu mỗi universe chỉ được “sinh” một nhánh con.
- **Tùy chọn max_generation (tương lai):** Có thể thêm config `max_fork_generation` và trường `generation` (hoặc dùng `level` trên Universe) để không fork khi universe ở thế hệ quá sâu; cần tính generation từ parent chain. Có thể làm ở phase sau.

---

## Thứ tự thực hiện đề xuất

1. Tạo `BranchEventRepositoryInterface` + `BranchEventRepository` với `existsFork` và `hasForkAsParent`; đăng ký binding.
2. Sửa `ForkUniverseAction`: inject repository, `execute(...): ?Universe`, dùng repository cho kiểm tra, return `$childUniverse`.
3. Thêm `SagaService::ensureSaga(Universe): ?Saga`; sửa `handleFork` gọi `ensureSaga`, không tạo saga trong listener.
4. Thêm config `worldos.autonomic`; sửa `StrategicDecisionEngine` đọc config.
5. Sửa `DecisionEngine`: thêm `&& $recommendation !== 'fork'` vào điều kiện ghi đè archive.

---

## Ghi chú mở rộng (không làm trong phase này)

- **Multi-branch fork:** `fork_count = f(entropy)` (ví dụ `floor(entropy * 5)`) — cần thay đổi ForkUniverseAction/SagaService để tạo nhiều child trong một lần; có thể làm phase sau.
- **Autonomic Evolution Engine (AEE):** Tách lớp “autonomic evolution” (fork / archive / mutate / merge / promote) chạy sau evaluation; có thể dùng cùng config và repository trên.
- **AI decision:** Thay rule-based bằng model (local GGUF / inference server) nhận metrics → fork/archive/continue; tích hợp sau.
- **Multiverse Scheduler / Timeline Selection / Narrative Extraction:** Các engine bổ sung theo kiến trúc WorldOS; không nằm trong scope sửa fork hiện tại.

