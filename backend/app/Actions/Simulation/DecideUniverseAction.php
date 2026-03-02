<?php

namespace App\Actions\Simulation;

use App\Models\UniverseSnapshot;

class DecideUniverseAction
{
    public function __construct(
        protected EvaluateUniverseAction $evaluateUniverseAction
    ) {}

    /**
     * Thay thế DecisionEngine cũ
     * 
     * @return array{action: string, meta: array}
     */
    public function execute(UniverseSnapshot $snapshot): array
    {
        $result = $this->evaluateUniverseAction->execute($snapshot);
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
