# WorldOS V6 — Kế Hoạch Hoàn Thiện

> **Ngày lập kế hoạch:** 2026-04-21
> **Dựa trên:** `review/2026-04-21-system-flow-review.md`
> **Tổng vấn đề cần xử lý:** 2 Critical · 3 High · 4 Medium · 4 Low

---

## Tóm Tắt Ưu Tiên

```
SPRINT 1 (Critical — unblock ngay)
  C1: Centrifugo channel mismatch
  C2: NarrativeEngine::pulse() blocking tick loop

SPRINT 2 (High — stabilize production)
  H1: VAF cinematic page error recovery
  H2: /health strict mode
  H3: ParticleRenderer responsive canvas

SPRINT 3 (Medium — quality & reliability)
  M1: VAFErrorBoundary reset loop fix
  M2: Schema parity CI check
  M3: VAF unit tests
  M4: news_anchor flow verification

SPRINT 4 (Low — polish)
  L1: NarrationOverlay performance
  L2: CameraRenderer shake reset
  L3: PlayerControls seek flicker
  L4: Agent print() → structlog
```

---

## SPRINT 1 — Critical (Ước tính: 1–2 ngày)

### Task C1: Fix Centrifugo Channel Mismatch

**Vấn đề:** Narrative Loom publish event đến `narrative:{world_id}:{task_id}`, nhưng các trang legacy (narrative-studio) subscribe vào `universe.1.narrative` hardcoded → real-time events không bao giờ đến UI.

**File cần sửa:**

#### [MODIFY] Frontend — Các component đang dùng channel cũ

Tìm tất cả nơi subscribe Centrifugo channel cũ:
```bash
grep -r "universe.1.narrative\|universe\..*\.narrative" frontend/src --include="*.ts" --include="*.tsx"
```

Mỗi nơi tìm thấy → thay bằng channel dynamic từ response:
```typescript
// TRƯỚC (sai):
const sub = centrifuge.newSubscription('universe.1.narrative');

// SAU (đúng):
// channel được trả về từ POST /weave-chronicles:
// { task_id, world_id, channel: "narrative:{world_id}:{task_id}" }
const channel = `narrative:${worldId}:${taskId}`;
const sub = centrifuge.newSubscription(channel);
```

**Xác minh:**
- `useNarrativeRuntime.ts` đã dùng đúng `narrative:${worldId}:${activeTaskId}` ✅
- Kiểm tra `narrative-studio/page.tsx` và các file legacy khác

---

### Task C2: Async NarrativeEngine::pulse()

**Vấn đề:** `SimulationTickPipeline::run()` gọi `NarrativeEngine::pulse()` synchronously ở cuối mỗi tick. Nếu Loom được bật, mỗi tick thêm 30s+.

**File cần sửa:**

#### [MODIFY] `backend/app/Modules/Simulation/Core/Runtime/SimulationTickPipeline.php`

```php
// TRƯỚC (line 82-85) — blocking:
if ($universeModel && $snapshotModel) {
    $universeEntity = app(UniverseRepositoryInterface::class)->findById($universe->id);
    $this->narrativeEngine->pulse($universeEntity, $snapshotModel);
}

// SAU — dispatch Job async:
if ($universeModel && $snapshotModel) {
    dispatch(new \App\Modules\Narrative\Jobs\PulseNarrativeJob(
        $universe->id,
        $snapshotModel->id
    ))->onQueue('narrative');
}
```

#### [NEW] `backend/app/Modules/Narrative/Jobs/PulseNarrativeJob.php`

```php
<?php
namespace App\Modules\Narrative\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Modules\Narrative\Services\NarrativeEngine;
use App\Modules\Simulation\Contracts\UniverseRepositoryInterface;
use App\Models\UniverseSnapshot;

class PulseNarrativeJob implements ShouldQueue
{
    use Dispatchable, Queueable, SerializesModels;

    public int $tries = 1;
    public int $timeout = 1800; // 30 min

    public function __construct(
        private readonly int $universeId,
        private readonly int $snapshotId,
    ) {}

    public function handle(
        NarrativeEngine $narrativeEngine,
        UniverseRepositoryInterface $universeRepository
    ): void {
        $universeEntity = $universeRepository->findById($this->universeId);
        $snapshot = UniverseSnapshot::find($this->snapshotId);

        if ($universeEntity && $snapshot) {
            $narrativeEngine->pulse($universeEntity, $snapshot);
        }
    }
}
```

**Xác minh:**
```bash
# Chạy trong container backend
docker compose exec backend php artisan queue:work --queue=narrative --once
# Kiểm tra không có timeout trong tick batch
```

---

## SPRINT 2 — High Priority (Ước tính: 2–3 ngày)

### Task H1: VAF Cinematic Page — Error Recovery

**Vấn đề:** Khi `GET /api/worldos/chronicles/{id}` trả lỗi (4xx/5xx), trang hiện ra màn đen không có message.

**File cần sửa:**

#### [MODIFY] `frontend/src/app/narrative-cinema/[chronicleId]/page.tsx`

Thêm explicit error state:
```tsx
// Thêm isError state từ hook
const { chronicle, isLoading, isError, error, refetch } = useChronicleDetail(chronicleId);

// Thêm error render path
if (isError) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white gap-6">
      <p className="text-slate-400 text-sm">
        {error?.message ?? 'Không thể tải chronicle. Vui lòng thử lại.'}
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-sm transition"
        >
          Thử Lại
        </button>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded text-sm transition"
        >
          Quay Lại
        </button>
      </div>
    </div>
  );
}
```

Thêm `key` prop vào VAFErrorBoundary để force remount khi chronicle thay đổi:
```tsx
<VAFErrorBoundary key={chronicleId} onExit={() => router.back()}>
  <CinematicPlayer
    animationScript={animation ?? DEFAULT_FALLBACK}
    ...
  />
</VAFErrorBoundary>
```

---

### Task H2: `/health` Strict Mode

**Vấn đề:** Không có LLM key vẫn báo `healthy` mặc định.

**File cần sửa:**

#### [MODIFY] `narrative-loom/routers/system.py` — Đã implement sẵn

File hiện tại đã có cơ chế strict mode — chỉ cần set env:
```bash
# Thêm vào .env production
LOOM_HEALTH_STRICT=true
```

Verify logic hiện tại (line 125, 170-174):
```python
strict = os.getenv("LOOM_HEALTH_STRICT", "false").lower() == "true"
required_vals = (
    ("ok", "configured") if strict else ("ok", "configured", "not_configured")
)
all_ok = all(v in required_vals for v in checks.values())
```

**Action:** Không cần sửa code — chỉ update deployment config/docker-compose.

---

### Task H3: ParticleRenderer — Responsive Canvas

**Vấn đề:** Canvas dimensions cố định 960×540, không adapt theo container.

**File cần sửa:**

#### [MODIFY] `frontend/src/lib/vaf/ParticleRenderer.tsx` (hoặc vị trí tương đương)

```tsx
const canvasRef = useRef<HTMLCanvasElement>(null);
const containerRef = useRef<HTMLDivElement>(null);

// Thêm ResizeObserver
useEffect(() => {
  const canvas = canvasRef.current;
  const container = containerRef.current;
  if (!canvas || !container) return;

  const observer = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    const { width, height } = entry.contentRect;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    // Rescale context
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
  });

  observer.observe(container);
  return () => observer.disconnect();
}, []);

// Trong JSX:
return (
  <div ref={containerRef} className="absolute inset-0">
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      // Không set width/height attributes cố định
    />
  </div>
);
```

---

## SPRINT 3 — Medium Priority (Ước tính: 3–5 ngày)

### Task M1: VAFErrorBoundary — Fix Reset Loop

**Vấn đề:** "Try Again" remount component → cùng parse error lặp lại infinitely.

**File cần sửa:**

#### [MODIFY] `frontend/src/lib/vaf/VAFErrorBoundary.tsx` (hoặc tương đương)

Thêm `key` prop để reset state hoàn toàn, đồng thời clamp animation script trước khi truyền vào:
```tsx
// Parent component:
const [retryCount, setRetryCount] = useState(0);

<VAFErrorBoundary
  key={`${chronicleId}-${retryCount}`}
  onExit={() => router.back()}
  onRetry={() => setRetryCount(c => c + 1)}
>
  <CinematicPlayer
    key={`${chronicleId}-${retryCount}`}
    animationScript={animation ?? DEFAULT_FALLBACK}
  />
</VAFErrorBoundary>
```

---

### Task M2: Schema Parity CI Check

**Vấn đề:** Pydantic (`schemas.py`) và TypeScript (`lib/vaf/types.ts`) không có automated check.

**File cần tạo:**

#### [NEW] `narrative-loom/scripts/check_schema_parity.py`

Script đơn giản verify field names khớp:
```python
"""
Kiểm tra field names của VAFScene Pydantic schema
khớp với TypeScript VAFScene interface.
"""
import json
import sys
from schemas import VAFScene, VAFEffect, AnimationScript

# Export schema as JSON
schema = AnimationScript.model_json_schema()
print(json.dumps(schema, indent=2))
# CI: parse TypeScript lib/vaf/types.ts và compare field names
```

#### [NEW] `.github/workflows/schema-parity.yml`

```yaml
name: Schema Parity Check
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: pip install pydantic
      - run: python narrative-loom/scripts/check_schema_parity.py
```

---

### Task M3: VAF Unit Tests

**Vấn đề:** Không có unit tests cho VAF frontend.

**File cần tạo:**

#### [NEW] `frontend/src/lib/vaf/__tests__/parser.test.ts`

```typescript
import { parseAnimationScript } from '../parser';

describe('parseAnimationScript', () => {
  it('returns null for null input', () => {
    expect(parseAnimationScript(null)).toBeNull();
  });
  it('returns null for empty object', () => {
    expect(parseAnimationScript({})).toBeNull();
  });
  it('returns null for empty scenes array', () => {
    expect(parseAnimationScript({ scenes: [] })).toBeNull();
  });
  it('returns null for single scene (< 2)', () => {
    expect(parseAnimationScript({ scenes: [mockScene()] })).toBeNull();
  });
  it('returns valid result for 2+ scenes', () => {
    const result = parseAnimationScript({ scenes: [mockScene(), mockScene()] });
    expect(result).not.toBeNull();
    expect(result?.scenes).toHaveLength(2);
  });
  it('clamps total_duration_ms when negative', () => {
    const result = parseAnimationScript({
      scenes: [mockScene(), mockScene()],
      total_duration_ms: -100
    });
    expect(result?.total_duration_ms).toBeGreaterThanOrEqual(0);
  });
});
```

#### [NEW] `frontend/src/lib/vaf/__tests__/timeline.test.ts`

```typescript
import { timelineReducer } from '../timeline';

describe('timelineReducer', () => {
  it('advances elapsed on TICK', () => {
    const initial = { elapsedMs: 0, isPlaying: true, totalMs: 10000 };
    const next = timelineReducer(initial, { type: 'TICK', deltaMs: 5000 });
    expect(next.elapsedMs).toBe(5000);
  });
  it('resets to 0 on PLAY after end', () => {
    const ended = { elapsedMs: 10000, isPlaying: false, totalMs: 10000 };
    const next = timelineReducer(ended, { type: 'PLAY' });
    expect(next.elapsedMs).toBe(0);
    expect(next.isPlaying).toBe(true);
  });
});
```

#### [NEW] `frontend/src/lib/vaf/__tests__/scheduler.test.ts`

```typescript
import { EffectScheduler } from '../effectScheduler';

describe('EffectScheduler', () => {
  it('returns effects with trigger_at_ms=0 at start', () => {
    const scheduler = new EffectScheduler([mockEffect({ trigger_at_ms: 0 })]);
    const active = scheduler.getActiveEffects(0, 0);
    expect(active).toHaveLength(1);
  });
  it('returns effects triggered within time window', () => {
    const scheduler = new EffectScheduler([mockEffect({ trigger_at_ms: 3000 })]);
    expect(scheduler.getActiveEffects(0, 2000)).toHaveLength(0);
    expect(scheduler.getActiveEffects(0, 5000)).toHaveLength(1);
  });
});
```

---

### Task M4: Verify news_anchor Output Flow

**Vấn đề:** `news_headline` và `news_slogan` có thể không được persist đúng cách.

**Kiểm tra thủ công cần làm:**

1. **Trace data path:**
   ```
   news_anchor.py output { news_headline, news_slogan }
        → NarrativeState.news_headline/news_slogan
        → chronicle_task.py: pipeline_result["news_headline"]
        → publish_pipeline_done() → Centrifugo
        → POST webhook → Laravel /narrative-loom/webhook
        → [Laravel] Persist to narratives table?
        → GET /api/resonance-feed → ResonanceFeed.tsx
   ```

2. **Kiểm tra Laravel webhook handler:**
   ```bash
   grep -r "narrative-loom/webhook\|LoomWebhookController" backend/
   ```

3. **Xác minh `news_headline` được lưu** vào `narratives` table hoặc `resonance_pollen`.

4. **Fix nếu cần:** Webhook handler phải extract `news_headline` và persist.

---

## SPRINT 4 — Low Priority (Ước tính: 1–2 ngày)

### Task L1: NarrationOverlay — Sentence-level Animation

**File:** `frontend/src/lib/vaf/NarrationOverlay.tsx`

```tsx
// TRƯỚC: animate từng character (500+ spans)
// SAU: animate từng sentence
const sentences = useMemo(
  () => text.match(/[^.!?]+[.!?]+/g) ?? [text],
  [text]
);

// Thêm font stack cụ thể trong tailwind.config.ts:
// fontFamily: { serif: ['"Playfair Display"', 'Georgia', 'serif'] }
```

---

### Task L2: CameraRenderer — Shake Reset

**File:** `frontend/src/lib/vaf/CameraRenderer.tsx`

```tsx
// Thêm isPlaying vào dependency array:
useEffect(() => {
  if (type !== 'shake') return;
  startRef.current = performance.now(); // Reset khi effect chạy lại
  // ... rest of shake logic
}, [type, isPlaying]); // isPlaying thêm vào
```

---

### Task L3: PlayerControls — Seek Flicker Fix

**File:** `frontend/src/lib/vaf/SceneCompositor.tsx`

```tsx
// TRƯỚC:
<AnimatePresence mode="wait">

// SAU:
<AnimatePresence mode="sync">
```

---

### Task L4: Replace print() với structlog

Chạy trong container narrative-loom:
```bash
docker compose exec narrative_loom \
  grep -rn "^[[:space:]]*print(" agents/ --include="*.py"
```

Với mỗi `print(...)` tìm được → thay bằng:
```python
# TRƯỚC:
print(f"[historian] Generated outline: {outline[:100]}")

# SAU:
log = get_logger(__name__)
log.info("historian.outline_generated", length=len(outline))
```

---

## Checklist Tổng Hợp

### Sprint 1 — Critical

- [x] **C1.1** Tìm tất cả channel cũ trong frontend — không tìm thấy legacy `universe.*.narrative`
- [x] **C1.2** Verify `useNarrativeRuntime.ts` đã dùng đúng `narrative:{worldId}:{taskId}` ✅
- [x] **C1.3** `ChronicleTab.tsx` cũng đã dùng channel đúng ✅
- [x] **C2.1** Tạo `PulseNarrativeJob.php` (queue: narrative, timeout: 1800s, tries: 1)
- [x] **C2.2** Sửa `SimulationTickPipeline.php` → dispatch Job async thay vì call sync
- [ ] **C2.3** Test: batch 100 tick không bị chậm do Loom

### Sprint 2 — High

- [x] **H1.1** Hook `useChronicleDetail` đã có `isError` sẵn ✅
- [x] **H1.2** Thêm error UI (AlertTriangle + Thử Lại + Quay Lại) vào cinematic page
- [x] **H1.3** Thêm `key={chronicleId}-${retryCount}` vào `VAFErrorBoundary` + `CinematicPlayer`
- [ ] **H2.1** Set `LOOM_HEALTH_STRICT=true` trong docker-compose production
- [ ] **H2.2** Verify `/health` endpoint trả `degraded` khi không có LLM key
- [x] **H3.1** Implement `ResizeObserver` + `containerRef` trong `ParticleRenderer`
- [ ] **H3.2** Test particle positions trên mobile viewport

### Sprint 3 — Medium

- [x] **M1.1** Thêm `retryCount` state + `key` prop vào error boundary (thực hiện cùng H1)
- [x] **M2.1** Ghi nhận: schema check có thể dùng `test_agents.py` hiện có làm reference
- [x] **M3.1** Tạo `parser.test.ts` với 16 test cases (đầy đủ edge cases + clamping)
- [x] **M3.2** Tạo `timeline.test.ts` với 14 test cases (PLAY/PAUSE/SEEK/TICK/RESTART + helpers)
- [x] **M3.3** Tạo `scheduler.test.ts` với 10 test cases (trigger timing + multi-scene)
- [x] **M3.4** Setup Vitest config (`vitest.config.ts`) + thêm `npm run test` vào package.json
- [x] **M4.1** Trace `news_headline`: `news_anchor.py` → `chronicle_task.py` webhook payload ✅
- [x] **M4.2** Tạo `LoomWebhookController.php` — persist hớ into Chronicle + Narrative tables
- [x] **M4.3** Thêm route `POST /narrative-loom/webhook` vào Narrative `api.php`

### Sprint 4 — Low

- [x] **L1.1** `NarrationOverlay`: animate per sentence thay vi per character (stagger 0.12s moi cau)
- [x] **L1.2** `splitIntoSentences()` helper: chia text theo dau cau `.!?`
- [x] **L2.1** `CameraRenderer`: them `isPlaying` prop + reset `shakeOffset` luc cleanup
- [x] **L2.2** `isPlaying` added vao shake `useEffect` dependency array
- [x] **L3.1** `SceneCompositor`: doi `AnimatePresence mode="wait"` -> `mode="sync"` (fix seek flicker)
- [x] **L4.1** Kiem tra agents/ — khong co `print()`, da dung structlog san
- [x] **L4.2** `utils/memory_manager.py`: thay 2 `print()` bang `log.warning()` (get_logger)
- [x] **L4.3** `utils/manifesto_loader.py`: thay `print()` bang `log.error()` (get_logger)
- [x] **L4.4** Test files giu print() — hop le, khong can thay

---

## Ước Tính Thời Gian

| Sprint | Items | Ước tính | Mức độ rủi ro |
|--------|-------|---------|--------------|
| Sprint 1 | C1, C2 | 1–2 ngày | Cao (đụng core tick pipeline) |
| Sprint 2 | H1, H2, H3 | 2–3 ngày | Trung bình |
| Sprint 3 | M1-M4 | 3–5 ngày | Thấp–Trung bình |
| Sprint 4 | L1-L4 | 1–2 ngày | Thấp |
| **Tổng** | **13 tasks** | **7–12 ngày** | |

---

## Điều Kiện Verify (Definition of Done)

| Task | Điều kiện hoàn thành |
|------|---------------------|
| C1 | Frontend nhận `agent_started`, `agent_done` events trong Console DevTools khi weave |
| C2 | Batch 100 tick hoàn thành < 20 giây (không bị chặn bởi Loom call) |
| H1 | Khi API trả 500, trang cinematic hiển thị error message + nút thử lại |
| H2 | `GET /health` trả `degraded` khi không set LLM key (với `LOOM_HEALTH_STRICT=true`) |
| H3 | Particles ở đúng vị trí trên viewport 375px (mobile) và 1440px (desktop) |
| M3 | `npm test` chạy 10 VAF unit tests — tất cả pass |
| M4 | `ResonanceFeed` hiển thị `news_headline` từ weave cuối cùng |

---

*Kế hoạch này dựa trên phân tích `review/2026-04-21-system-flow-review.md`.*
*Cần xác nhận của team trước khi triển khai Sprint 1.*
