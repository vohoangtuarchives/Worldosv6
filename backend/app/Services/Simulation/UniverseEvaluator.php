<?php

namespace App\Services\Simulation;

use App\Contracts\UniverseEvaluatorInterface;
use App\Models\UniverseSnapshot;
use App\Services\Simulation\MetricsExtractor;

class UniverseEvaluator implements UniverseEvaluatorInterface
{
    public function __construct(
        protected MetricsExtractor $metrics
    ) {}

    public function evaluate(UniverseSnapshot $snapshot): array
    {
        $m = $this->metrics->extract($snapshot);
        $entropy = $m['entropy'];
        $stability = $m['stability_index'];

        $ip_score = $stability * (1 - $entropy * 0.5);
        
        // Demo Logic: High entropy triggers Fork to survive, only total collapse (1.0) archives.
        if ($entropy >= 0.99) {
            $recommendation = 'archive';
        } elseif ($entropy >= 0.6) {
            $recommendation = 'fork';
        } else {
            $recommendation = 'continue';
        }
        
        $mutation_suggestion = null;
        if ($entropy >= 0.7) {
            $mutation_suggestion = ['suggest_reduce_entropy' => true];
        } elseif ($entropy >= 0.5 && $entropy < 0.6) {
             // High entropy warning: Suggest adding a scar if not already present
             // This is a "Crisis" state that was survived without forking
             $mutation_suggestion = ['add_scar' => 'entropy_crisis_scar'];
        }

        return [
            'ip_score' => round($ip_score, 4),
            'recommendation' => $recommendation,
            'mutation_suggestion' => $mutation_suggestion,
        ];
    }
}
