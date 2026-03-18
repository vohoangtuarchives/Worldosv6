<?php

namespace App\Modules\Narrative\Services;

use App\Modules\Simulation\Entities\UniverseEntity;
use App\Models\UniverseSnapshot;
use App\Contracts\LlmNarrativeClientInterface;
use App\Modules\Narrative\Repositories\ChronicleMemoryRepository;
use App\Modules\Narrative\Dto\NarrativeProjection;
use App\Modules\Narrative\Dto\NarrativeMeaning;
use App\Modules\Narrative\Models\NarrativeState;
use Illuminate\Support\Facades\Log;

/**
 * NarrativeEngine: The main orchestrator for the narrative pipeline.
 * V2: Implements the "Interpreter vs System Brain" paradigm.
 */
class NarrativeEngine
{
    public function __construct(
        protected StateExtractorDSL $extractor,
        protected SignalExtractor $signalExtractor,
        protected SignalBuilder $signalBuilder,
        protected NarrativeScheduler $scheduler,
        protected StateMutationEngine $mutationEngine,
        protected ChronicleMemoryRepository $memoryRepository,
        protected LlmNarrativeClientInterface $llmClient
    ) {}

    /**
     * Run the narrative pipeline for a specific simulation tick.
     */
    public function pulse(UniverseEntity $universe, UniverseSnapshot $snapshot): void
    {
        try {
            // 0. Adaptive Scheduler: Skip if state hasn't changed enough
            if (!$this->scheduler->shouldPulse($universe, $snapshot)) {
                return;
            }

            // 1. Extract Narrative Tokens from current state
            $tokens = $this->extractor->extract($snapshot->state_vector ?? [], $snapshot->metrics ?? []);
            
            // 2. Manage Narrative State (Arc, Conflicts)
            /** @var NarrativeState $state */
            $state = NarrativeState::firstOrCreate(
                ['universe_id' => $universe->id],
                ['current_arc' => 'Genesis', 'active_conflicts' => []]
            );

            // 3. Build Projection (Perceived State)
            $projection = new NarrativeProjection(
                entropy: (float) ($universe->entropy ?? 0),
                stability: (float) ($universe->stabilityIndex ?? 0),
                activeConflicts: array_unique(array_merge($tokens, $state->active_conflicts ?? []))
            );

            // 4. Build context from memory
            $context = $this->memoryRepository->getContext($universe->id, $tokens);
            
            // 5. Construct Prompt for LLM
            $prompt = $this->buildPrompt($universe, $projection, $context, $state);
            
            // 6. Single LLM Call (The Interpretation phase)
            $response = $this->llmClient->generate($prompt);
            
            if (!$response) {
                Log::error("NarrativeEngine: LLM returned empty response for Universe {$universe->id}");
                return;
            }

            // 7. Parse Narrative Meaning (AI interpretation)
            /** @var NarrativeMeaning $meaning */
            $meaning = $this->signalExtractor->extract($response);
            
            // 8. Build Deterministic Signals (The System Brain phase)
            $signal = $this->signalBuilder->build($meaning);
            
            // 9. Apply deterministic state mutations
            $this->mutationEngine->apply($universe, [
                'entropy' => $signal->entropyDelta,
                'stability' => $signal->stabilityDelta
            ]);
            
            // 10. Store new Chronicle with memory index
            $this->memoryRepository->store($universe->id, $snapshot->tick, $meaning);

            // 11. Update Narrative State for continuity
            $state->update([
                'active_conflicts' => array_slice($meaning->keyFactors, 0, 5),
                'last_tick' => $snapshot->tick
            ]);

        } catch (\Throwable $e) {
            Log::error("NarrativeEngine: Pipeline failed for Universe {$universe->id}: " . $e->getMessage() . "\n" . $e->getTraceAsString());
        }
    }

    protected function buildPrompt(UniverseEntity $universe, NarrativeProjection $projection, string $context, NarrativeState $state): string
    {
        $tokens = implode(', ', $projection->toNarrativeTokens());
        
        return <<<EOT
Bạn là Narrative Engine của WorldOS. Nhiệm vụ của bạn là diễn giải trạng thái mô phỏng thành một biên niên sử sống động và trích xuất ý nghĩa xu hướng.

BỐI CẢNH VŨ TRỤ:
- Tên: {$universe->name}
- Chương hiện tại: {$state->current_arc}
- Chỉ số Tinh thần: {$tokens}

DỮ LIỆU LỊCH SỬ GẦN ĐÂY:
{$context}

YÊU CẦU:
1. Viết biên niên sử (Summary) về giai đoạn này.
2. Xác định Tâm thế (Tension) và Hướng đi (Direction) của thực tại.

PHẢI TRẢ VỀ JSON NGHIÊM NGẶT:
{
  "summary": "Nội dung biên niên sử tại đây...",
  "tension": "low | medium | high",
  "direction": "growth | stagnation | collapse",
  "key_factors": ["Từ khóa 1", "Từ khóa 2"],
  "omens": ["Lời sấm truyền ngắn gọn"]
}
EOT;
    }
}
