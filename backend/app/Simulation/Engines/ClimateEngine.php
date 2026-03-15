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

/**
 * doc §6.2: Climate Engine stub. Long-term cycles, agriculture impact.
 * Full logic in PlanetaryClimateEngine (called from AdvanceSimulationAction).
 */
final class ClimateEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function __construct(
        private ?RuleVmService $ruleVm = null
    ) {
        $this->ruleVm = $this->ruleVm ?? \app(RuleVmService::class);
    }

    public function phase(): string
    {
        return 'climate';
    }

    public function name(): string
    {
        return 'climate';
    }

    public function priority(): int
    {
        return 2;
    }

    public function tickRate(): int
    {
        return 1;
    }

    public function runWithState(\App\Simulation\Runtime\State\WorldState $state, int $tick): void
    {
        $ctx = new TickContext((int)$state->get('universe_id'), $tick, (int)$state->get('seed', 0));
        $this->handle($state, $ctx);
    }

    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        $dslFile = \resource_path('worldos_rules/biology/biosphere.dsl');
        $dsl = @file_get_contents($dslFile) ?: '';

        // Prepare raw state for VM
        $rawState = [
            'ecological_stability' => (float) ($state->get('ecology.stability', 0.8)),
            'random_chance' => lcg_value(),
        ];

        $result = $this->ruleVm->evaluateRawState($rawState, $dsl);
        
        $effects = [];
        $events = [];
        if ($result['ok'] ?? false) {
            $fs = $result['state'] ?? [];
            if (isset($fs['ecological_stability'])) {
                $state->set('ecology.stability', (float)$fs['ecological_stability']);
            }

            foreach ($result['outputs'] ?? [] as $out) {
                if (($out['event_name'] ?? '') === 'CLIMATE_INSTABILITY_WARNING') {
                    $events[] = WorldEvent::create(
                        WorldEventType::STRUCTURAL_DECAY,
                        $ctx->getUniverseId(),
                        $ctx->getTick(),
                        null,
                        [],
                        0.3,
                        [],
                        $out['metadata'] ?? []
                    );
                }
            }
        }

        return new EngineResult($events, $effects, []);
    }
}
