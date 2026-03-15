<?php

namespace App\Simulation\Engines;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Runtime\State\WorldState;
use App\Services\Simulation\RuleVmService;
use App\Simulation\Effects\WorldRulesUpdateEffect;
use App\Simulation\Events\WorldEvent;
use App\Simulation\Events\WorldEventType;
use function resource_path;
use function file_get_contents;
use function app;
use function max;

/**
 * doc §7.3: Disease Engine via DSL.
 */
final class DiseaseEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function __construct(
        protected ?RuleVmService $ruleVm = null
    ) {
        $this->ruleVm = $ruleVm ?? \app(RuleVmService::class);
    }

    public function phase(): string
    {
        return 'ecology';
    }

    public function name(): string
    {
        return 'disease';
    }

    public function priority(): int
    {
        return 14;
    }

    public function tickRate(): int
    {
        return 1;
    }

    public function runWithState(\App\Simulation\Runtime\State\WorldState $state, int $tick): array
    {
        $dslFile = \resource_path('worldos_rules/biology/biosphere.dsl');
        $dsl = @file_get_contents($dslFile) ?: '';

        $vec = $state->toArray();
        $sir = $vec['ecology']['sir_model'] ?? [
            'susceptible' => (float) ($vec['population'] ?? 1000),
            'infected' => 0.0,
            'recovered' => 0.0
        ];

        $rawState = [
            'population' => (float) ($vec['population'] ?? 1000),
            'susceptible' => (float) $sir['susceptible'],
            'infected' => (float) $sir['infected'],
            'recovered' => (float) $sir['recovered'],
            'is_collapse_active' => (bool) ($vec['ecology']['is_collapse_active'] ?? false),
            'collapse_type' => $vec['ecology']['collapse_type'] ?? 'none',
            'mortality' => (float) ($vec['mortality_rate'] ?? 0.02),
        ];

        $result = $this->ruleVm->evaluateRawState($rawState, $dsl);
        
        if ($result['ok'] ?? false) {
            $fs = $result['state'] ?? [];
            
            foreach ($result['outputs'] ?? [] as $out) {
                if (($out['event_name'] ?? '') === 'PANDEMIC_PROGRESS') {
                    $meta = $out['metadata'] ?? [];
                    $sir['infected'] += (float) ($meta['new_infections'] ?? 0);
                    $sir['infected'] -= (float) ($meta['new_recoveries'] ?? 0);
                    $sir['infected'] -= (float) ($meta['new_deaths'] ?? 0);
                    $sir['susceptible'] -= (float) ($meta['new_infections'] ?? 0);
                    $sir['recovered'] += (float) ($meta['new_recoveries'] ?? 0);
                    
                    $sir['infected'] = max(0, $sir['infected']);
                    $sir['susceptible'] = max(0, $sir['susceptible']);
                    
                    $state->set('ecology.sir_model', $sir);
                    $state->set('mortality_rate', (float) ($fs['mortality'] ?? 0.02));
                }
            }
            return ['sir' => $sir];
        }

        return [];
    }

    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        $dslFile = \resource_path('worldos_rules/biology/biosphere.dsl');
        $dsl = @file_get_contents($dslFile) ?: '';

        $vec = $state->getStateVector();
        $sir = $vec['ecology']['sir_model'] ?? [
            'susceptible' => (float) ($vec['population'] ?? 1000),
            'infected' => 0.0,
            'recovered' => 0.0
        ];

        $rawState = [
            'population' => (float) ($vec['population'] ?? 1000),
            'susceptible' => (float) $sir['susceptible'],
            'infected' => (float) $sir['infected'],
            'recovered' => (float) $sir['recovered'],
            'is_collapse_active' => (bool) ($vec['ecology']['is_collapse_active'] ?? false),
            'collapse_type' => $vec['ecology']['collapse_type'] ?? 'none',
            'mortality' => (float) ($vec['mortality_rate'] ?? 0.02),
        ];

        $result = $this->ruleVm->evaluateRawState($rawState, $dsl);
        
        $effects = [];
        $events = [];

        if ($result['ok'] ?? false) {
            $fs = $result['state'] ?? [];
            
            // Map event logic
            foreach ($result['outputs'] ?? [] as $out) {
                if (($out['event_name'] ?? '') === 'PANDEMIC_PROGRESS') {
                    $meta = $out['metadata'] ?? [];
                    // Update SIR model locally for this tick's effect
                    $sir['infected'] += (float) ($meta['new_infections'] ?? 0);
                    $sir['infected'] -= (float) ($meta['new_recoveries'] ?? 0);
                    $sir['infected'] -= (float) ($meta['new_deaths'] ?? 0);
                    $sir['susceptible'] -= (float) ($meta['new_infections'] ?? 0);
                    $sir['recovered'] += (float) ($meta['new_recoveries'] ?? 0);
                    
                    // Prevent negatives
                    $sir['infected'] = max(0, $sir['infected']);
                    $sir['susceptible'] = max(0, $sir['susceptible']);
                    
                    $effects[] = new WorldRulesUpdateEffect([
                        'ecology.sir_model' => $sir,
                        'mortality_rate' => (float) ($fs['mortality'] ?? 0.02)
                    ]);

                    $events[] = WorldEvent::create(
                        WorldEventType::PLAGUE_OUTBREAK,
                        $ctx->getUniverseId(),
                        $ctx->getTick(),
                        null,
                        [],
                        0.5,
                        [],
                        $meta
                    );
                }
            }
        }

        return new EngineResult($events, $effects, []);
    }
}
