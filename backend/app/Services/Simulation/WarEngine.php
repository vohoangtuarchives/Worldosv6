<?php

namespace App\Services\Simulation;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Models\Universe;
use Illuminate\Support\Facades\Log;
use function resource_path;
use function config;

/**
 * War Engine (Tier 12). Doc §12.
 * Military model (soldiers, training, technology, morale); war stages (Mobilization → Campaign → Battles → Attrition → Negotiation).
 * Casus belli (resource, territory, culture), battle power.
 */
class WarEngine
{
    public const WAR_STAGE_MOBILIZATION = 'mobilization';
    public const WAR_STAGE_CAMPAIGN = 'campaign';
    public const WAR_STAGE_BATTLES = 'battles';
    public const WAR_STAGE_ATTRITION = 'attrition';
    public const WAR_STAGE_NEGOTIATION = 'negotiation';

    public function __construct(
        protected UniverseRepositoryInterface $universeRepository,
        protected \App\Services\Simulation\RuleVmService $ruleVm
    ) {}

    public function runWithState(\App\Simulation\Runtime\State\WorldState $state, int $currentTick): void
    {
        $interval = (int) config('worldos.intelligence.war_tick_interval', 30);
        if ($interval <= 0 || $currentTick % $interval !== 0) {
            return;
        }

        $dslFile = resource_path('worldos_rules/civilization/war.dsl');
        if (!file_exists($dslFile)) {
            Log::warning("WarEngine: war.dsl not found at {$dslFile}");
            return;
        }

        $dsl = file_get_contents($dslFile);
        $this->ruleVm->evaluateAndApplyWithState($state, $dsl, $currentTick);
        
        Log::debug("WarEngine: Universe {$state->get('universe_id')} war rules evaluated via DSL at tick {$currentTick}");
    }

    public function evaluate(Universe $universe, int $currentTick): void
    {
        // Deprecated
    }

    private function getStateVector(Universe $universe): array
    {
        $sv = $universe->state_vector;
        if (is_string($sv)) {
            $sv = json_decode($sv, true) ?? [];
        }
        return is_array($sv) ? $sv : [];
    }
}
