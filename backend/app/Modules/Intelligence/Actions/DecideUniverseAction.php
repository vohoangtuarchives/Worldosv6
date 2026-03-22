<?php

namespace App\Modules\Intelligence\Actions;

use App\Modules\Simulation\Models\UniverseSnapshot;

class DecideUniverseAction
{
    public function __construct(
        protected \App\Modules\Simulation\Core\Engines\Meta\DecisionEngine $decisionEngine
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


