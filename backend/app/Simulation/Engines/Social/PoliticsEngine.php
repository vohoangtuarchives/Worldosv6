<?php

namespace App\Simulation\Engines\Social;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Models\Universe;
use App\Services\Simulation\RuleVmService;
use Illuminate\Support\Facades\Log;
use function resource_path;
use function config;
use function app;

/**
 * Politics Engine (Tier 11) via DSL.
 */
class PoliticsEngine implements \App\Simulation\Contracts\SimulationEngine
{
    use \App\Simulation\Concerns\DefaultSimulationEnginePhase;

    public function name(): string { return 'politics'; }
    public function priority(): int { return 10; }
    public function tickRate(): int { return (int) config('worldos.tick_pipeline.meta.interval', 10); }

    public function __construct(
        protected UniverseRepositoryInterface $universeRepository,
        protected RuleVmService $ruleVm
    ) {}

    public function handle(\App\Simulation\Runtime\State\WorldState $state, \App\Simulation\Domain\TickContext $ctx): \App\Simulation\Domain\EngineResult
    {
        return $this->runWithState($state, $ctx->getTick());
    }

    public function runWithState(\App\Simulation\Runtime\State\WorldState $state, int $currentTick): \App\Simulation\Domain\EngineResult
    {
        $interval = (int) config('worldos.intelligence.politics_tick_interval', 25);
        if ($interval <= 0 || $currentTick % $interval !== 0) {
            return \App\Simulation\Domain\EngineResult::empty();
        }

        $events = [];
        $effects = [];

        // 1. Thu thập dữ liệu từ Cultural Soul
        $activeMyths = $state->get('meta.active_myths', []);
        $meaningSystems = $state->get('meta.meaning_systems', []);
        $knowledge = (float)$state->get('fields.knowledge', 0.1);

        // 2. Tính toán Social Cohesion (Sự gắn kết xã hội)
        $totalCoherence = array_reduce($meaningSystems, fn($carry, $item) => $carry + ($item['coherence'] ?? 0), 0);
        $avgCoherence = count($meaningSystems) > 0 ? $totalCoherence / count($meaningSystems) : 0.5;
        
        $mythPower = array_reduce($activeMyths, fn($carry, $item) => $carry + ($item['symbolic_power'] ?? 0), 0);
        $avgMythPower = count($activeMyths) > 0 ? min(1.0, $mythPower / count($activeMyths)) : 0.1;

        $socialCohesion = min(1.0, ($avgCoherence * 0.6) + ($avgMythPower * 0.4));
        
        // 3. Xác định Governance Type (Hình thái chính trị)
        $governanceType = $this->determineGovernanceType($meaningSystems, $knowledge);

        $effects[] = new \App\Simulation\Effects\WorldStateUpdateEffect([
            'civilization.politics.social_cohesion' => round($socialCohesion, 4),
            'civilization.politics.governance_type' => $governanceType,
        ]);

        // 4. DSL Layer: Áp dụng quy tắc từ politics.dsl (Purely)
        $dslFile = resource_path('worldos_rules/simulation/politics.dsl');
        if (file_exists($dslFile)) {
            $outputs = $this->ruleVm->evaluateWithResults($state, 'simulation/politics.dsl', $currentTick);
            $dslResult = $this->ruleVm->mapOutputsToResults($outputs, (int)$state->get('universe_id'), $currentTick, $state);
            
            $events = array_merge($events, $dslResult->events);
            $effects = array_merge($effects, $dslResult->stateChanges);
        }

        return new \App\Simulation\Domain\EngineResult($events, $effects);
    }

    private function determineGovernanceType(array $meaningSystems, float $knowledge): string
    {
        if (count($meaningSystems) === 0) return 'ANARCHY';

        // Tìm meaning system có ảnh hưởng lớn nhất
        usort($meaningSystems, fn($a, $b) => ($b['influence'] ?? 0) <=> ($a['influence'] ?? 0));
        $dominant = $meaningSystems[0];

        if ($knowledge > 0.8) return 'TECHNOCRACY';
        if ($dominant['type'] === 'RELIGION' && ($dominant['influence'] ?? 0) > 0.6) return 'THEOCRACY';
        if ($dominant['type'] === 'IDEOLOGY') return 'IDEOLOGICAL_STATE';

        return 'TRADITIONAL_POLITY';
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

    private function detFloat(int $seed, int $tick, int $salt): float
    {
        $h = crc32($seed . ':' . $tick . ':' . $salt);
        return (float) (($h & 0x7FFFFFFF) / 0x7FFFFFFF);
    }
}
