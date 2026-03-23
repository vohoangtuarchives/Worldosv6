<?php
namespace App\Modules\Simulation\Core\Engines\Physics;
use App\Modules\Simulation\Core\Concerns\DefaultSimulationEnginePhase;
use App\Modules\Simulation\Core\Engines\EngineInterface;
use App\Modules\Simulation\Core\Engines\EngineResult;
use App\Modules\Simulation\Core\Domain\TickContext;
use App\Modules\Simulation\Core\Runtime\State\WorldState;
class ClimateEngine implements EngineInterface {
    use DefaultSimulationEnginePhase;
    public function name(): string { return 'climate.stub'; }
    public function phase(): string { return 'climate'; }
    public function priority(): int { return 2; }
    public function tickRate(): int { return 1; }
    public function handle(WorldState $state, TickContext $ctx): EngineResult { return EngineResult::empty(); }
}
