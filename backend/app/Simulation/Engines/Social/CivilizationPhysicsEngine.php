<?php

namespace App\Simulation\Engines\Social;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Runtime\State\WorldState;
use App\Modules\Simulation\Services\RuleEngine\RuleVmService;
use Illuminate\Support\Facades\Log;
use function resource_path;
use function file_get_contents;
use function file_exists;

/**
 * Phase 54: Civilization Field Physics Engine 🪐✨
 * 
 * Xử lý các tương tác cốt lõi giữa các trường lực xã hội (Knowledge, Power, Belief, etc.)
 * theo triết lý vật lý trường (Field Physics).
 */
class CivilizationPhysicsEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function __construct(
        protected RuleVmService $ruleVm
    ) {}

    public function name(): string
    {
        return 'civilization_physics';
    }

    public function phase(): string
    {
        return 'social';
    }

    public function priority(): int
    {
        return 16;
    }

    public function tickRate(): int
    {
        return 1;
    }

    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        $tick = $ctx->getTick();
        $path = resource_path('worldos_rules/simulation/field_physics.dsl');
        if (!file_exists($path)) {
            Log::warning("CivilizationPhysicsEngine: field_physics.dsl not found at {$path}");
            return EngineResult::empty();
        }

        $dsl = file_get_contents($path);

        // Chạy DSL để thực hiện các tương tác (Interactions) và khuếch tán (Diffusion)
        $this->ruleVm->evaluateAndApplyWithState($state, $dsl, $tick);

        Log::debug("CivilizationPhysicsEngine: Field interactions processed at tick {$tick}.");

        return EngineResult::empty();
    }
}



