<?php

namespace App\Modules\Simulation\Core\Runtime\RuleVM;

use App\Contracts\SimulationEngineClientInterface;
use App\Modules\Simulation\Core\Runtime\State\WorldState;
use App\Modules\Simulation\Core\Engines\EngineResult;
use App\Modules\Simulation\Core\Effects\WorldStateUpdateEffect;
use App\Modules\Simulation\Services\RuleMutationService;
use App\Modules\Simulation\Services\CausalCacheService;
use App\Modules\Simulation\Services\AxiomRegistry;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;

/**
 * RuleVmService (Standardized V10): Evaluate DSL rules against world state (Rust Rule VM).
 * Functional Core: returns an EngineResult (collection of Effects).
 */
class RuleVmService
{
    private static array $dslFileCache = [];
    private static array $dslFileMtime = [];

    public function __construct(
        protected readonly SimulationEngineClientInterface $engine,
        protected readonly AxiomRegistry $axiomRegistry,
        protected readonly EffectExecutor $executor
    ) {}

    /**
     * Legacy support: Evaluate and apply effects immediately.
     */
    public function evaluateAndApply(\App\Models\Universe $universe, ?\App\Models\UniverseSnapshot $snapshot = null, ?string $rulesDsl = null): void
    {
        $state = app(\App\Modules\Simulation\Core\Runtime\State\StateManager::class)->get();
        if (!$state) return;

        $tick = (int) ($snapshot ? $snapshot->tick : $universe->current_tick);
        $rulesPath = Config::get('worldos.rule_engine.rules_path');
        $dsl = $rulesDsl ?? ($rulesPath ? $this->resolveDslContent($rulesPath) : '');
        if (empty($dsl)) return;

        $result = $this->evaluate($state, $dsl, $tick);
        
        $this->executor->execute((int)$universe->id, $tick, $result, $state);
    }

    public function evaluateAndApplyWithState(WorldState $state, string $dsl, int $tick): void
    {
        if (empty($dsl)) return;
        $result = $this->evaluate($state, $dsl, $tick);
        $universeId = (int) $state->get('universe_id');
        if ($universeId && $state instanceof \App\Modules\Simulation\Core\Runtime\State\WorldStateMutable) {
            $this->executor->execute($universeId, $tick, $result, $state);
        }
    }

    /**
     * Evaluate rules and return result without applying it.
     */
    public function evaluate(WorldState $state, string $dslOrPath, int $tick, array $context = []): EngineResult
    {
        $outputs = $this->evaluateWithResults($state, $dslOrPath, $tick, $context);
        return $this->mapOutputsToResults($outputs, (int)$state->get('universe_id'), $tick, $state);
    }

    public function evaluateRawState(array $rawState, string $dsl): array
    {
        if (empty($dsl)) return ['ok' => false, 'state' => [], 'error_message' => 'empty DSL'];
        $result = $this->engine->evaluateRules($rawState, $dsl);
        return $result ?? ['ok' => false, 'state' => []];
    }

    public function evaluateWithResults(WorldState $state, string $dslOrPath, int $tick, array $context = []): array
    {
        $dsl = $this->resolveDslContent($dslOrPath);
        if (empty($dsl)) return [];

        $rawState = array_merge($this->buildRawStateFromManifold($state, $tick), $context);
        
        $cacheService = app(CausalCacheService::class);
        $result = $cacheService->remember($rawState, $dsl, function() use ($rawState, $dsl) {
             // Rust-compatibility: force empty arrays to objects
             $state = $rawState;
             if (isset($state['axioms']) && empty($state['axioms'])) $state['axioms'] = (object)[];
             if (isset($state['fields']) && empty($state['fields'])) $state['fields'] = (object)[];
             
             return $this->engine->evaluateRules($rawState, $dsl);
        });

        if (! ($result['ok'] ?? false)) {
            Log::warning('Rule VM evaluation failed', [
                'universe_id' => $state->get('universe_id'),
                'error' => $result['error_message'] ?? 'unknown',
            ]);
            return [];
        }

        return $result['outputs'] ?? [];
    }

    public function mapOutputsToResults(array $outputs, int $universeId, int $tick, WorldState $state): EngineResult
    {
        $events = [];
        $effects = [];

        foreach ($outputs as $out) {
            $type = $out['type'] ?? '';

            if ($type === 'event' && !empty($out['event_name'])) {
                $events[] = $out; 
            }

            if ($type === 'adjust_stability' && isset($out['adjust_stability_delta'])) {
                $current = (float) $state->get('stability_index', 1.0);
                $effects[] = new WorldStateUpdateEffect([
                    'stability_index' => max(0.0, min(1.0, $current + (float) $out['adjust_stability_delta']))
                ]);
            }

            if ($type === 'adjust_entropy' && isset($out['adjust_entropy_delta'])) {
                $current = (float) $state->get('entropy', 0.0);
                $newEntropy = max(0.0, min(1.0, $current + (float) $out['adjust_entropy_delta']));
                $effects[] = new WorldStateUpdateEffect([
                    'entropy' => $newEntropy,
                    'global_entropy' => $newEntropy
                ]);
            }

            // ... (Additional mapping for spawn_actor, drift, etc)
            if ($type === 'spawn_actor') {
                 $events[] = ['event_name' => 'SPAWN_ACTOR', 'payload' => ['kind' => $out['spawn_actor_kind'] ?? 'villager']];
            }
        }

        return new EngineResult($events, $effects, []);
    }

    protected function resolveDslContent(string $pathOrDsl): string
    {
        if (str_contains($pathOrDsl, "\n") || str_contains($pathOrDsl, "rule")) {
            return $pathOrDsl;
        }

        $suffix = str_ends_with($pathOrDsl, '.dsl') ? $pathOrDsl : $pathOrDsl . '.dsl';
        $path = resource_path('worldos_rules/' . $suffix);

        if (!file_exists($path)) return '';

        $isProduction = app()->environment('production');
        $currentMtime = !$isProduction ? filemtime($path) : null;

        if (!isset(self::$dslFileCache[$path]) || ($currentMtime !== null && $currentMtime !== (self::$dslFileMtime[$path] ?? null))) {
            $mutationService = app(RuleMutationService::class);
            $mutated = $mutationService->getMutatedContent($path);
            self::$dslFileCache[$path] = $mutated ?: (@file_get_contents($path) ?: '');
            self::$dslFileMtime[$path] = $currentMtime;
        }

        return self::$dslFileCache[$path];
    }

    protected function buildRawStateFromManifold(WorldState $state, int $tick): array
    {
        // ... (Same mapping as before, simplified for Pure VM)
        $fields = $state->getFields();
        return [
            'tick' => $tick,
            'universe_id' => (int) $state->get('universe_id', 0),
            'entropy' => (float) $state->get('entropy', 0.5),
            'stability_index' => (float) $state->get('stability_index', 0.5),
            'fields' => $fields,
            'axioms' => $this->axiomRegistry->getDefaultMapForTier(1),
            'meta' => $state->get('meta', []),
        ];
    }
}

