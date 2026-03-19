<?php

namespace App\Simulation\Engines\Social;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Models\Universe;
use App\Modules\Simulation\Services\RuleEngine\RuleVmService;
use Illuminate\Support\Facades\Log;
use function resource_path;
use function config;

/**
 * Inequality dynamics (Doc §7) via DSL.
 */
class InequalityEngine implements \App\Simulation\Contracts\SimulationEngine
{
    use \App\Simulation\Concerns\DefaultSimulationEnginePhase;

    public function name(): string { return 'inequality'; }
    public function priority(): int { return 10; }
    public function tickRate(): int { return (int) config('worldos.tick_pipeline.meta.interval', 10); }

    public function handle(\App\Simulation\Runtime\State\WorldState $state, \App\Simulation\Domain\TickContext $ctx): \App\Simulation\Domain\EngineResult
    {
        if (method_exists($this, 'runWithState')) {
            $this->runWithState($state, $ctx->getTick());
        } elseif (method_exists($this, 'evaluate')) {
            // Unlikely, but fallback
            $universe = \App\Models\Universe::find($ctx->getUniverseId());
            if ($universe) $this->evaluate($universe, $ctx->getTick());
        }
        return \App\Simulation\Domain\EngineResult::empty();
    }

    public function __construct(
        protected UniverseRepositoryInterface $universeRepository,
        protected RuleVmService $ruleVm
    ) {}

    public function runWithState(\App\Simulation\Runtime\State\WorldState $state, int $currentTick): void
    {
        $interval = (int) config('worldos.intelligence.economy_tick_interval', 20);
        if ($interval <= 0 || $currentTick % $interval !== 0) {
            return;
        }

        $settlements = $state->get('civilization.settlements', []);
        if (empty($settlements)) {
            return;
        }

        $surpluses = [];
        $totalPop = 0;
        foreach ($settlements as $s) {
            $surpluses[] = max(0.0, (float) ($s['resource_surplus'] ?? 0));
            $totalPop += max(0, (int) ($s['population'] ?? 0));
        }

        $gini = $this->computeGiniFromShares($surpluses);
        $surplusConcentration = $this->surplusConcentration($surpluses);

        // Call DSL for social impact
        $dslFile = resource_path('worldos_rules/society/dynamics.dsl');
        $dsl = @file_get_contents($dslFile) ?: '';

        $rawState = [
            'gini_index' => $gini,
            'surplus_concentration' => $surplusConcentration,
            'total_population' => $totalPop,
            'legitimacy' => (float) ($state->get('civilization.politics.legitimacy', 0.5)),
        ];

        $result = $this->ruleVm->evaluateRawState($rawState, $dsl);
        $finalState = $result['state'] ?? [];

        $inequality = [
            'gini_index' => round($gini, 4),
            'surplus_concentration' => round($surplusConcentration, 4),
            'elite_share_proxy' => round((float)($finalState['elite_share'] ?? 0.1), 4),
            'updated_tick' => $currentTick,
        ];

        $state->set('civilization.economy.inequality', $inequality);
        
        $universeId = (int) $state->get('universe_id');
        Log::debug("InequalityEngine: Universe {$universeId} inequality updated via DSL at tick {$currentTick}");
    }

    public function evaluate(Universe $universe, int $currentTick): void
    {
        // Deprecated
    }

    /** Gini-like from surplus per zone (0 = equal, 1 = maximally unequal). */
    private function computeGiniFromShares(array $surpluses): float
    {
        if (count($surpluses) < 2) {
            return 0.0;
        }
        $total = array_sum($surpluses);
        if ($total <= 0) {
            return 0.0;
        }
        sort($surpluses, SORT_NUMERIC);
        $n = count($surpluses);
        $cumsum = 0;
        $sumB = 0;
        for ($i = 0; $i < $n; $i++) {
            $cumsum += $surpluses[$i];
            $sumB += $cumsum;
        }
        $gini = (float) (1.0 - 2.0 * $sumB / ($n * $total));
        return max(0.0, min(1.0, $gini));
    }

    /** Share of total surplus held by top fraction of zones (concentration). */
    private function surplusConcentration(array $surpluses): float
    {
        if (empty($surpluses)) {
            return 0.0;
        }
        $total = array_sum($surpluses);
        if ($total <= 0) {
            return 0.0;
        }
        rsort($surpluses, SORT_NUMERIC);
        $topCount = max(1, (int) ceil(count($surpluses) * 0.2));
        $topSum = array_sum(array_slice($surpluses, 0, $topCount));
        return min(1.0, $topSum / $total);
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



