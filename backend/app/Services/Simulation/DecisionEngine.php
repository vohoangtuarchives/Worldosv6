<?php

namespace App\Services\Simulation;

use App\Contracts\UniverseEvaluatorInterface;
use App\Models\UniverseSnapshot;

class DecisionEngine
{
    public function __construct(
        protected UniverseEvaluatorInterface $evaluator
    ) {}

    /**
     * Decide action from evaluation result: fork, archive, or continue.
     *
     * @return array{action: string, meta: array}
     */
    public function decide(UniverseSnapshot $snapshot): array
    {
        $result = $this->evaluator->evaluate($snapshot);
        $recommendation = $result['recommendation'] ?? 'continue';
        
        return [
            'action' => $recommendation,
            'meta' => [
                'ip_score' => $result['ip_score'] ?? 0,
                'mutation_suggestion' => $result['mutation_suggestion'] ?? null,
                'reason' => "Entropy: " . ($snapshot->entropy ?? 'N/A'),
            ]
        ];
    }
}
