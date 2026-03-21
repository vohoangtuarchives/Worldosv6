<?php
namespace App\Simulation\Engines;

use App\Simulation\Context\SimulationContext;
use App\Simulation\State\WorldState;

interface EngineInterface {
    public function name(): string;
    public function handle(WorldState $state, SimulationContext $ctx): EngineResult;
}
