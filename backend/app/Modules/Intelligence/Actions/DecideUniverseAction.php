<?php

namespace App\Modules\Intelligence\Actions;

use App\Models\UniverseSnapshot;

class DecideUniverseAction
{
    public function __construct(
        protected \App\Contracts\DecisionEngineInterface $decisionEngine
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


