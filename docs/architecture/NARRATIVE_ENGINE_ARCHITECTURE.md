# WorldOS Narrative Engine Architecture

Kiến trúc narrative scale được: **Event Aggregator → Strategy Pattern → 1 LLM call per batch**, tách SRP và chuẩn bị cho 3 tầng narrative + historian personalities + mythology.

---

## 1. Vấn đề cũ

- **1 Chronicle = 1 LLM call** → 1000 events/tick = 1000 requests (chi phí + latency không chịu nổi).
- **EventNarrativeService** làm 3 việc: đọc chronicle, build prompt, gọi LLM → SRP violation.
- **switch($action)** → khi có 100+ event types file thành 2000 dòng, khó bảo trì.

---

## 2. Pipeline mới

```
Raw Events (Chronicles with raw_payload, no content)
    ↓
Event Aggregator (group by universe_id + tick)
    ↓
Narrative Generator (1 LLM call per group)
    ↓
Chronicle Writer (write same content to all chronicles in group, or to one summary chronicle)
```

Ví dụ: Tick 120 có 23 deaths, 1 war, 4 anomalies → **1 prompt** kiểu "Nhiều sự kiện: 23 tử thần, 1 chiến tranh, 4 dị thường. Viết MỘT đoạn tóm tắt cho thời điểm này." → **1 LLM call** thay vì 28.

---

## 3. Thành phần

### 3.1 EventAggregator

- **Input:** Collection of Chronicle (raw_payload có, content null).
- **Output:** Các nhóm theo `(universe_id, tick)` (có thể mở rộng tick window). Mỗi nhóm có danh sách chronicles và các **batches** theo action (mỗi batch có `_count`, `_samples`).

```php
$groups = $aggregator->aggregateByUniverseAndTick($chronicles, $tickWindowSize = 1);
// Mỗi group: universe_id, tick, chronicles[], batches[] { action, payload { _count, _samples } }
```

### 3.2 NarrativeStrategy (thay switch-case)

- **Interface:** `supports(string $action): bool`, `buildPrompt(array $payload): string`.
- **Strategies:** DeathNarrativeStrategy, RebirthNarrativeStrategy, ParadoxNarrativeStrategy, AnomalyNarrativeStrategy, **LegacyNarrativeStrategy** (fallback, đăng ký cuối).
- **Registry:** `resolve($action)` trả về strategy đầu tiên supports action.

Payload có thể có `_count`, `_samples` khi đã aggregate (nhiều event cùng loại → một prompt tóm tắt).

### 3.3 Tách SRP (3 class)

| Class | Trách nhiệm |
|-------|-------------|
| **NarrativePromptBuilder** | Build prompt: base context (historian persona) + strategy body. Không gọi LLM, không ghi DB. |
| **NarrativeGenerator** | `generate(string $prompt): ?string` — gọi LLM (NarrativeAiService::generateSnippet hoặc LlmNarrativeClientInterface). |
| **ChronicleWriter** | `write(Chronicle, content)`, `writeToMany(chronicles[], content)`. Chỉ ghi content vào Chronicle. |

### 3.4 NarrativeEngine (orchestrator)

- **generateForChronicle(Chronicle)** — đường cũ: 1 chronicle → 1 prompt → 1 LLM call → 1 write. Có dùng NarrativeCache nếu bật.
- **generateBatched(Collection $chronicles, $tickWindowSize)** — aggregate → 1 prompt per group → 1 LLM call per group → writeToMany cùng content cho cả nhóm.

### 3.5 NarrativeCache

- Key: hash(action + normalized payload) hoặc `agg:universe_id:tick:prompt_hash`.
- TTL: 30 ngày (config có thể đổi).
- Mục đích: 100 peasant deaths cùng loại → reuse 1 narrative, không gọi 100 lần LLM.

---

## 4. Sử dụng

- **Single (giữ tương thích):** `EventNarrativeService::generateNarrativeForChronicle($chronicle)` → gọi `NarrativeEngine::generateForChronicle`.
- **Batched (scale):**  
  `php artisan worldos:weave-narratives --batched --limit=500`  
  hoặc gọi trực tiếp `NarrativeEngine::generateBatched($chronicles, 1)`.

---

## 5. Ba tầng narrative (mở rộng tương lai)

| Level | Mô tả | Engine gợi ý |
|-------|--------|---------------|
| **Level 1 — Event** | "Agent X died mysteriously." | Đã có: NarrativeEngine + strategies. |
| **Level 2 — Era** | "The Age of Collapse (year 200–250)". | **EraNarrativeEngine:** aggregate chronicles/events theo tick range → 1 LLM call per era. |
| **Level 3 — Civilization** | "Rise and Fall of the Empire of Sol". | **CivilizationNarrativeEngine:** aggregate theo institution/civilization lifecycle → 1 narrative lớn. |

LLM rất mạnh ở level 2 và 3; nên bổ sung khi cần narrative tầm vĩ mô.

---

## 6. Historian personalities (mở rộng)

Thay vì một persona cố định (Sử Gia Mù), có thể chọn **historian type** khi build prompt:

| Historian | Style |
|-----------|--------|
| Cynical historian | Châm biếm |
| Heroic historian | Sử thi |
| Mad prophet | Điên loạn, tiên tri |
| Court historian | Tuyên truyền, thiên vị |

Cách làm: thêm `historian_type` vào AgentConfig hoặc vào payload; **NarrativePromptBuilder::buildBaseContext()** đọc type và nối thêm block giọng văn tương ứng. Narrative trở thành **biased history** giống lịch sử thật.

---

## 7. Mythology Engine (ý tưởng)

Từ simulation events (anomaly, paradox, rebirth, collapse) → AI tạo:

- religions  
- prophecies  
- legends  

Ví dụ: "Anomaly appears" → "The sky cracked open and the people believed the gods had awakened."

Có thể tích hợp qua **MythologyNarrativeStrategy** hoặc service riêng gọi NarrativeEngine với payload đặc biệt `action: myth_from_events`, kèm danh sách events đã aggregate.

---

## 8. File tham chiếu

- Pipeline: `App\Services\Narrative\NarrativeEngine`, `EventAggregator`, `NarrativePromptBuilder`, `NarrativeGenerator`, `ChronicleWriter`.
- Strategy: `App\Services\Narrative\Contracts\NarrativeStrategyInterface`, `Strategies\*`, `NarrativeStrategyRegistry`.
- Cache: `App\Services\Narrative\NarrativeCache`.
- Command: `php artisan worldos:weave-narratives --batched`.
