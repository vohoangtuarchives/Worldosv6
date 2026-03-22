<?php

namespace App\Modules\Narrative\Actions;

use App\Modules\Simulation\Models\Universe;
use App\Modules\Simulation\Services\ScenarioEngine;

class LaunchScenarioAction
{
    public function __construct(
        protected ScenarioEngine $scenarioEngine
    ) {}

    public function execute(Universe $universe, string $scenarioId): array
    {
        return $this->scenarioEngine->launch($universe, $scenarioId);
    }
}

