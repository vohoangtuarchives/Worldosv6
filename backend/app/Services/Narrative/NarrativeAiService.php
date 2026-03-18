<?php

namespace App\Services\Narrative;

use App\Contracts\LlmNarrativeClientInterface;
use Illuminate\Support\Facades\Log;

/**
 * [SHIM / DEPRECATED] 🚧
 * 
 * ĐÂY LÀ FILE TƯƠNG THÍCH NGƯỢC (BACKWARD COMPATIBILITY).
 * 
 * - Lý do tồn tại: Hỗ trợ các component cũ chưa kịp refactor sang NarrativeEngine V8.0.
 * - Hướng dẫn: KHÔNG thêm mới logic vào đây. Hãy sử dụng App\Modules\Narrative\Services\NarrativeEngine.
 * - Kế hoạch: Sẽ bị xóa bỏ hoàn toàn sau khi tất cả các caller (AscensionEngine, v.v.) được cập nhật.
 * 
 * @deprecated Sử dụng App\Modules\Narrative\Services\NarrativeEngine
 */
class NarrativeAiService
{
    protected LlmNarrativeClientInterface $llmClient;

    public function __construct(?LlmNarrativeClientInterface $llmClient = null)
    {
        $this->llmClient = $llmClient ?? app(LlmNarrativeClientInterface::class);
    }

    /**
     * Legacy method for generating a short snippet.
     */
    public function generateSnippet(string $prompt, array $options = []): ?string
    {
        return $this->llmClient->generate($prompt, $options);
    }

    /**
     * Legacy method for generating a chronicle (now redirects to simplest possible logic).
     */
    public function generateChronicle(int $universeId, int $fromTick, int $toTick, string $type = 'lore'): ?\App\Models\Chronicle
    {
        Log::info("NarrativeAiService Shim: generateChronicle called for Universe {$universeId}");
        
        $historyGenerator = app(\App\Modules\Narrative\Services\UniverseHistoryGenerator::class);
        $universe = \App\Models\Universe::find($universeId);
        
        if (!$universe) return null;

        $history = $historyGenerator->generate($universe, $fromTick, $toTick);

        if (!$history) return null;

        return \App\Models\Chronicle::create([
            'universe_id' => $universeId,
            'from_tick'   => $fromTick,
            'to_tick'     => $toTick,
            'content'     => $history->full_text,
            'type'        => $type,
        ]);
    }

    /**
     * Stub for other methods if needed.
     */
    public function __call($name, $arguments)
    {
        Log::warning("NarrativeAiService Shim: Unimplemented method {$name} called.");
        return null;
    }
}
