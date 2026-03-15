<?php

namespace App\Simulation\Engines;

use App\Simulation\Runtime\State\WorldState;
use App\Services\Simulation\RuleVmService;
use Illuminate\Support\Facades\Log;
use function resource_path;
use function file_get_contents;
use function file_exists;

/**
 * Phase 52: Reality Attractor Engine (Định hướng vi mô thực tại) 🌌🌀
 * 
 * Tính toán "lực hấp dẫn" của các trạng thái vĩ mô (Attractors) dựa trên 
 * sự phân bổ các trường lực trong manifold.
 */
class RealityAttractorEngine
{
    public function __construct(
        protected RuleVmService $ruleVm
    ) {}

    public function runWithState(WorldState $state, int $tick): void
    {
        $path = resource_path('worldos_rules/simulation/attractors.dsl');
        if (!file_exists($path)) {
            Log::warning("RealityAttractorEngine: attractors.dsl not found at {$path}");
            return;
        }

        $dsl = file_get_contents($path);

        // 1. Phân tích trạng thái hiện tại so với các Attractors thông qua Rules
        $this->ruleVm->evaluateAndApplyWithState($state, $dsl, $tick);

        Log::debug("RealityAttractorEngine: Calculated reality topology at tick {$tick}. Active attractors updated.");
    }
}
