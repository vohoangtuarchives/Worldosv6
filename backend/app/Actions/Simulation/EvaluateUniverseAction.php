<?php

namespace App\Actions\Simulation;

use App\Contracts\UniverseEvaluatorInterface;
use App\Models\UniverseSnapshot;

class EvaluateUniverseAction
{
    public function __construct(
        protected UniverseEvaluatorInterface $evaluator
    ) {}

    /**
     * Tách logic Evaluate từ DecisionEngine hoặc RuntimeService cũ
     */
    public function execute(UniverseSnapshot $snapshot): array
    {
        return $this->evaluator->evaluate($snapshot);
    }
}
