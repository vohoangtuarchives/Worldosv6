<?php

namespace App\Modules\Narrative\Services;

use App\Modules\Simulation\Entities\UniverseEntity;
use App\Models\UniverseSnapshot;
use App\Contracts\LlmNarrativeClientInterface;
use App\Modules\Narrative\Repositories\ChronicleMemoryRepository;
use Illuminate\Support\Facades\Log;

/**
 * NarrativeEngine: The main orchestrator for the narrative pipeline.
 * Implements the "1 Tick = 1 LLM Call" paradigm.
 */
class NarrativeEngine
{
    public function __construct(
        protected StateExtractorDSL $extractor,
        protected SignalExtractor $signalExtractor,
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
            // 1. Extract Narrative Tokens from current state
            $tokens = $this->extractor->extract($snapshot->state_vector ?? [], $snapshot->metrics ?? []);
            
            // 2. Build context from memory and tokens
            $context = $this->memoryRepository->getContext($universe->id, $tokens);
            
            // 3. Construct Prompt for LLM
            $prompt = $this->buildPrompt($universe, $tokens, $context);
            
            // 4. Single LLM Call
            $response = $this->llmClient->generate($prompt);
            
            if (!$response) {
                Log::error("NarrativeEngine: LLM returned empty response for Universe {$universe->id}");
                return;
            }

            // 5. Parse Signals (JSON) from response
            $extracted = $this->signalExtractor->extract($response);
            
            // 6. Apply deterministic state mutations
            $this->mutationEngine->apply($universe, $extracted['impacts']);
            
            // 7. Store new Chronicle with memory index
            $this->memoryRepository->store(
                $universe->id, 
                $snapshot->tick, 
                $extracted['chronicle'], 
                $extracted['omens'],
                $extracted['events']
            );

        } catch (\Throwable $e) {
            Log::error("NarrativeEngine: Pipeline failed for Universe {$universe->id}: " . $e->getMessage());
        }
    }

    protected function buildPrompt(UniverseEntity $universe, array $tokens, string $context): string
    {
        $tokenStr = implode(', ', $tokens);
        
        return <<<EOT
Bạn là Narrative Engine của WorldOS. Nhiệm vụ của bạn là diễn giải trạng thái mô phỏng thành một biên niên sử sống động và trích xuất các tín hiệu phản hồi.

TRẠNG THÁI HIỆN TẠI:
- Vũ trụ: {$universe->name}
- Token phân tích: {$tokenStr}

LỊCH SỬ & BỐI CẢNH:
{$context}

YÊU CẦU:
1. Viết một đoạn biên niên sử (Chronicle) giàu hình ảnh, phản ánh các Token hiện tại.
2. Trích xuất các tín hiệu (Signals) dưới dạng JSON để điều chỉnh mô phỏng.

PHẢI TRẢ VỀ DƯỚI ĐỊNH DẠNG JSON SAU:
```json
{
  "omens": ["Lời sấm truyền 1", "Lời sấm truyền 2"],
  "impacts": {
    "entropy": 0.01,
    "stability_index": -0.005
  },
  "events": ["Tên sự kiện quan trọng"],
  "chronicle": "Nội dung biên niên sử chi tiết tại đây..."
}
```
EOT;
    }
}
