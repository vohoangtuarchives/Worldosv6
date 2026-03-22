<?php
namespace App\Modules\Simulation\Core\Engines;

use App\Modules\Simulation\Core\Context\SimulationContext;
use App\Modules\Simulation\Core\State\WorldState;

interface EngineInterface {
    public function name(): string;
    public function handle(WorldState $state, SimulationContext $ctx): EngineResult;
}
