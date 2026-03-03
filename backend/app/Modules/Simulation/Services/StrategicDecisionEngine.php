<?php

namespace App\Modules\Simulation\Services;

use App\Contracts\UniverseEvaluatorInterface;
use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Repositories\UniverseRepository;
use App\Services\AI\EpistemicService;
use App\Services\Simulation\MetricsExtractor;
use Illuminate\Support\Facades\Log;

class StrategicDecisionEngine implements UniverseEvaluatorInterface
{
    protected int $branchLimit = 1;

    public function __construct(
        protected MetricsExtractor $metrics,
        protected EpistemicService $epistemicService,
        protected UniverseRepository $universeRepo
    ) {}

    /**
     * Unified evaluation logic from legacy AutonomicDecisionEngine and UniverseEvaluator.
     */
    public function evaluate(UniverseSnapshot $snapshot): array
    {
        $m = $this->metrics->extract($snapshot);
        $entropy = (float)($m['entropy'] ?? 0.5);
        $stability = (float)($m['stability_index'] ?? 0.5);

        // Calculate Fundamental IP Score
        $ip_score = $stability * (1 - $entropy * 0.5);
        
        // Base recommendation
        if ($entropy >= 0.99) {
            $recommendation = 'archive';
        } elseif ($entropy >= 0.6) {
            $recommendation = 'fork';
        } else {
            $recommendation = 'continue';
        }

        // Apply Advanced Heuristics (Noise & Resonance)
        $universe = $snapshot->universe;
        $noise = $this->epistemicService->calculateNoise($universe, $entropy);

        // 1. Hallucinated Forking (Epistemic Intuition)
        // High noise makes the AI "hallucinate" opportunities where data is blurry
        if ($noise > 0.8 && $recommendation === 'continue' && rand(1, 100) <= 15) {
            $recommendation = 'fork';
            Log::info("Strategic Action Distorted: [EPISTEMIC_INTUITION] fork triggered for Universe {$universe->id} due to high noise ({$noise})");
        }

        // 2. Isolation Decay
        // High noise + isolated universe = High risk of collapse
        if ($recommendation === 'continue' && $noise > 0.5) {
            $vec = $universe->state_vector ?? [];
            $metaResonance = (float)($vec['meta_resonance'] ?? 1.0);
            
            if ($metaResonance < 0.2 && rand(1, 100) <= 10) {
                $recommendation = 'archive';
                Log::warning("Strategic Action Modified: [ISOLATION_DECAY] archive triggered for Universe {$universe->id} (Low Resonance: {$metaResonance})");
            }
        }

        // Mutation suggestions based on crisis state
        $mutation_suggestion = null;
        if ($entropy >= 0.7) {
            $mutation_suggestion = ['suggest_reduce_entropy' => true];
        } elseif ($entropy >= 0.5 && $entropy < 0.6 && $recommendation === 'continue') {
             $mutation_suggestion = ['add_scar' => 'entropy_crisis_scar'];
        }

        return [
            'ip_score' => round($ip_score, 4),
            'recommendation' => $recommendation,
            'mutation_suggestion' => $mutation_suggestion,
            'meta' => [
                'noise' => $noise,
                'entropy' => $entropy,
                'stability' => $stability,
                'reason' => "Evaluated at Tick {$snapshot->tick} with Noise {$noise}",
            ]
        ];
    }
}
