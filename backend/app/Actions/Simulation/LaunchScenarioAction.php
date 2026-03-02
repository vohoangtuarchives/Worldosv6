<?php

namespace App\Actions\Simulation;

use App\Models\Universe;
use App\Services\Simulation\ScenarioEngine;

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
