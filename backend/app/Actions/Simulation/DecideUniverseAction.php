<?php

namespace App\Actions\Simulation;

use App\Models\UniverseSnapshot;

class DecideUniverseAction
{
    public function __construct(
        protected \App\Services\Simulation\DecisionEngine $decisionEngine
    ) {}

    /**
     * Thay thế DecisionEngine cũ
     * 
     * @return array{action: string, meta: array}
     */
    public function execute(UniverseSnapshot $snapshot): array
    {
        return $this->decisionEngine->decide($snapshot);
    }
}
