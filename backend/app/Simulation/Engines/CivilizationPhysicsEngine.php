<?php

namespace App\Simulation\Engines;

use App\Simulation\Runtime\State\WorldState;
use App\Services\Simulation\RuleVmService;
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
class CivilizationPhysicsEngine
{
    public function __construct(
        protected RuleVmService $ruleVm
    ) {}

    public function runWithState(WorldState $state, int $tick): void
    {
        $path = resource_path('worldos_rules/simulation/field_physics.dsl');
        if (!file_exists($path)) {
            Log::warning("CivilizationPhysicsEngine: field_physics.dsl not found at {$path}");
            return;
        }

        $dsl = file_get_contents($path);

        // Chạy DSL để thực hiện các tương tác (Interactions) và khuếch tán (Diffusion)
        $this->ruleVm->evaluateAndApplyWithState($state, $dsl, $tick);

        Log::debug("CivilizationPhysicsEngine: Field interactions processed at tick {$tick}.");
    }
}
