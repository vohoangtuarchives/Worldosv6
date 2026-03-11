<?php

namespace App\Services\Narrative;

use App\Models\Chronicle;
use App\Models\AgentConfig;
use App\Models\HistorianProfile;
use App\Services\Narrative\Contracts\NarrativeStrategyInterface;

/**
 * Builds narrative prompt from action + payload using NarrativeStrategyRegistry.
 * Single responsibility: prompt assembly only (historian persona + strategy body).
 */
class NarrativePromptBuilder
{
    public function __construct(
        protected NarrativeStrategyRegistry $strategyRegistry
    ) {}

    /**
     * Build full prompt for a single event or an aggregated batch.
     *
     * @param  array<string, mixed>  $payload  Must contain 'action'; may contain _count, _samples, tick, etc.
     */
    public function build(string $action, array $payload, ?Chronicle $chronicle = null): string
    {
        $baseContext = $this->buildBaseContext($chronicle);
        $strategy = $this->strategyRegistry->resolve($action);
        $body = $strategy->buildPrompt($payload);
        return $baseContext . "\n\n" . $body;
    }

    /**
     * Build prompt for an aggregated batch (multiple events summarized in one payload per type).
     *
     * @param  array<int, array{action: string, payload: array}>  $batches  Each: action + payload (with _count, _samples)
     */
    public function buildAggregated(array $batches, ?Chronicle $chronicle = null): string
    {
        $baseContext = $this->buildBaseContext($chronicle);
        $parts = [];
        foreach ($batches as $batch) {
            $action = $batch['action'] ?? 'legacy_event';
            $payload = $batch['payload'] ?? [];
            $strategy = $this->strategyRegistry->resolve($action);
            $parts[] = $strategy->buildPrompt($payload);
        }
        $body = "Nhiều sự kiện trong cùng thời điểm:\n\n" . implode("\n\n---\n\n", $parts)
            . "\n\nYêu cầu: Viết MỘT đoạn văn ngắn (hoặc vài câu) tóm tắt không khí và ý nghĩa của TẤT CẢ các sự kiện trên, như một ghi chép biên niên của thời điểm này.";
        return $baseContext . "\n\n" . $body;
    }

    protected function buildBaseContext(?Chronicle $chronicle): string
    {
        $config = AgentConfig::first();
        $profile = null;
        if ($config?->historian_profile_id) {
            $profile = HistorianProfile::find($config->historian_profile_id);
        }
        if ($profile) {
            $name = $profile->name ?? 'Chronicler';
            $personality = $profile->personality ?? 'neutral';
            $bias = $profile->bias ? " Thiên kiến: {$profile->bias}." : '';
            $style = $profile->writing_style ? " Phong cách: {$profile->writing_style}." : '';
            return "Bạn là {$name}, một sử gia với tính cách {$personality}.{$bias}{$style} "
                . "Viết một đoạn TRUYỆN NGẮN mang tính sử thi dựa trên dữ liệu thô sau đây, không mâu thuẫn với sự kiện.\n\n";
        }
        $personality = $config?->personality ?? 'Sử Gia Mù';
        $agentName = $config?->agent_name ?? 'He Who Watches';
        $themes = implode(', ', $config?->themes ?? ['kỳ ảo', 'siêu thực']);

        return "Bạn là {$agentName}, một {$personality} của hệ thống WorldOS. "
            . "Chủ đề trọng tâm: {$themes}. "
            . "Hãy viết một đoạn TRUYỆN NGẮN mang tính sử thi, hoặc ngớ ngẩn tùy tình huống, dựa trên dữ liệu thô sau đây.\n\n";
    }
}
