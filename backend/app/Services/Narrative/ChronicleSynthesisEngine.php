<?php

namespace App\Services\Narrative;

use App\Contracts\CausalityGraphServiceInterface;
use Illuminate\Support\Collection;

/**
 * Phase 5: Chronicle Synthesis Engine 🕰️📜
 * 
 * Chịu trách nhiệm tổng hợp các liên kết nhân quả từ CausalityGraph và 
 * chuyển đổi chúng thành cấu trúc "Fact Sheet" mà LLM có thể hiểu được.
 */
class ChronicleSynthesisEngine
{
    public function __construct(
        protected CausalityGraphServiceInterface $causalityGraph
    ) {}

    /**
     * Synthesize causal links for a specific tick range.
     */
    public function synthesize(int $universeId, int $fromTick, int $toTick): array
    {
        $links = $this->causalityGraph->getRecentLinksForUniverse($universeId, 50);

        return collect($links)
            ->filter(fn($link) => $link['tick'] >= $fromTick && $link['tick'] <= $toTick)
            ->map(function($link) {
                return $this->formatLinkAsNarrative($link);
            })
            ->values()
            ->toArray();
    }

    /**
     * Format a raw causal link into a human-readable (and LLM-readable) string.
     */
    protected function formatLinkAsNarrative(array $link): string
    {
        $src = $this->parseEntity($link['src']);
        $tgt = $this->parseEntity($link['tgt']);
        $rel = $link['rel'];
        
        // Example: [Environment] Scarcity triggered [Resource] Depletion
        return sprintf(
            "[%s] %s -> %s -> [%s] %s (Probability: %s)",
            ucfirst($src['type']),
            $src['id'],
            strtoupper($rel),
            ucfirst($tgt['type']),
            $tgt['id'],
            $link['meta']['probability'] ?? '1.0'
        );
    }

    protected function parseEntity(string $entityStr): array
    {
        $parts = explode(':', $entityStr);
        return [
            'type' => $parts[0] ?? 'unknown',
            'id'   => $parts[1] ?? 'unknown'
        ];
    }
}
