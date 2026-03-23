<?php
namespace App\Modules\Simulation\Core\Engines\Physics;

use App\Modules\Simulation\Core\Concerns\DefaultSimulationEnginePhase;
use App\Modules\Simulation\Core\Engines\EngineInterface;
use App\Modules\Simulation\Core\Engines\EngineResult;
use App\Modules\Simulation\Core\Domain\TickContext;
use App\Modules\Simulation\Core\Runtime\State\WorldState;

class RealityAnchorEngine implements EngineInterface
{
    use DefaultSimulationEnginePhase;
    public function name(): string { return 'reality_anchor'; }
    public function phase(): string { return 'physical'; }
    public function priority(): int { return 0; }
    public function tickRate(): int { return 1; }
    public function handle(WorldState $state, TickContext $ctx): EngineResult { return EngineResult::empty(); }
}
