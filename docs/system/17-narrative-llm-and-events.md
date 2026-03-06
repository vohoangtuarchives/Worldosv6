# 17 — Narrative LLM & Event Triggers (V6)

Tài liệu mô tả kết nối LLM cho narrative, Event Trigger System và Perceived Archive (context cho AI).

## 17.1 LLM Connector

### Interface & implementation

- **Contract**: `App\Contracts\LlmNarrativeClientInterface`
  - `generate(string $prompt, array $options = []): ?string`
  - `isAvailable(): bool`
- **Implementation mặc định**: `App\Services\Narrative\OpenAINarrativeService`
  - Dùng OpenAI API (hoặc endpoint tương thích). Cấu hình qua `config('worldos.narrative')` hoặc `config('services.openai')`.
  - `worldos.narrative`: `openai_api_key`, `model`, `base_url`, `timeout`.

### Cấu hình (.env)

```env
# Narrative LLM — dùng cho chronicle generation
OPENAI_API_KEY=sk-...
NARRATIVE_LLM_MODEL=gpt-4o
OPENAI_BASE_URL=https://api.openai.com
NARRATIVE_LLM_TIMEOUT=30
```

Nếu không set `OPENAI_API_KEY`, narrative fallback sang mock/stub (không gọi API).

### Tích hợp NarrativeAiService

- `NarrativeAiService` inject tùy chọn `LlmNarrativeClientInterface`. Nếu client được bind và `isAvailable() === true`, `callLlm()` ưu tiên gọi `$this->llmClient->generate($prompt)` thay vì logic cũ (AgentConfig + HTTP trực tiếp).

### Genre trong prompt (MVP)

- **Nguồn**: `Universe::world->current_genre` (hoặc `base_genre`); config `worldos_genres.genres.{key}` cho tên và mô tả thể loại.
- **Luồng**: Trong `generateChronicle()`, sau khi build perceived, thêm `perceived['narrative_genre']` (key, name, description). Trong `buildPrompt()` thêm block: *"Thể loại (Genre): {name}. {description}. Viết biên niên theo phong cách và không khí của thể loại này."*
- **Mục tiêu**: Ít nhất 3 genre (vd. wuxia, historical, cyberpunk) cho ra giọng khác nhau khi so mẫu (tiêu chí Review 1 MVP).

## 17.2 Event Trigger System

- **Service**: `App\Services\Narrative\EventTriggerMapper`
- **Chức năng**:
  - `detectTriggeredEvents(array $stateVector): array` — trả về danh sách `event_type` (vd. `crisis`, `golden_age`, `fork`) khi các rule trong bảng `event_triggers` thỏa mãn.
  - Rule lưu trong `event_triggers.threshold_rules` (JSON): mảng `[{ "key", "op", "value" }]`. Key có thể lấy từ:
    - `state_vector[$key]`
    - `state_vector['metrics'][$key]`
    - `state_vector['pressures'][$key]` (vd. `collapse_pressure`, `ascension_pressure`)
  - `getMetricValue($stateVector, $key)` dùng chung cho việc resolve giá trị.
- **Prompt fragment**: `getEventName()`, `getPromptFragment()` đọc từ `event_triggers` (name_template, prompt_fragment) theo `event_type`.

## 17.3 Perceived Archive Builder

- **Service**: `App\Services\Narrative\PerceivedArchiveBuilder`
- **Đầu ra** (mảng dùng cho narrative/LLM):
  - `flavor`, `events`, `materials`, `institutions`, `culture`, `branch_events`, `residual_prompt_tail`, `agent_reflections`, `whispers`, `existence`
  - **Bổ sung V6**:
    - **scars**: Gộp từ `state_vector['scars']` và bảng `myth_scars` (universe, chưa resolve).
    - **entropy_trend**: `'rising' | 'falling' | 'stable'` suy từ pressures/entropy (collapse_pressure, ascension_pressure, entropy).
    - **event_prompt_templates**: Template prompt cho `crisis`, `golden_age`, `fork`; ưu tiên `prompt_fragment` từ `event_triggers` nếu event type đang active.

## 17.4 Luồng tạo Chronicle

1. Lấy snapshot mới nhất → merge metrics vào state_vector.
2. `EventTriggerMapper::detectTriggeredEvents($stateVector)` → danh sách event type.
3. `PerceivedArchiveBuilder::build($universeId, $eventTypes, $vector, $tick)` → perceived context (gồm scars, entropy_trend, event_prompt_templates).
4. `NarrativeAiService::buildPrompt()` dựng prompt từ perceived + config (AgentConfig, existence tier).
5. `callLlm($prompt)` → dùng LlmNarrativeClientInterface nếu có, nếu không dùng logic cũ / mock.
6. Lưu Chronicle kèm perceived_archive_snapshot, embedding (nếu có).

---

Xem thêm: [05 Narrative Engine](05-narrative-engine.md), [12 Narrative Series](12-narrative-series.md).
