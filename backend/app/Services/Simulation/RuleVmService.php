<?php

namespace App\Services\Simulation;

use App\Contracts\SimulationEngineClientInterface;
use App\Events\Simulation\SimulationEventOccurred;
use App\Models\RuleProposal;
use App\Models\Universe;
use App\Models\UniverseSnapshot;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;

/**
 * WorldOS Rule VM integration: evaluate DSL rules against world state (Rust Rule VM)
 * and apply outputs (emit events, optional state adjustments).
 *
 * Called after snapshot is saved when config worldos.rule_engine.enabled is true.
 * State contract: see docs/WorldOS_DSL_Spec.md.
 */
class RuleVmService
{
    public function __construct(
        protected SimulationEngineClientInterface $engine, // Legacy gRPC fallback
        protected \App\Simulation\Runtime\State\StateManager $stateManager,
        protected \App\Services\Simulation\FfiRuleEngine $ffiEngine
    ) {}

    /**
     * Evaluate rules and return the full raw result (modified state + outputs).
     */
    public function evaluateRaw(Universe $universe, UniverseSnapshot $snapshot, string $rulesDsl): array
    {
        $state = $this->buildStateForVm($universe, $snapshot);
        return $this->evaluateRawState($state, $rulesDsl);
    }

    /**
     * Evaluate rules against a raw state array and return the full raw result.
     */
    public function evaluateRawState(array $state, string $rulesDsl): array
    {
        // Try Rust FFI directly first for massive performance gains (V10)
        try {
            $ffiResult = $this->ffiEngine->evaluateDsl($rulesDsl, json_encode($state), time());
            if ($ffiResult !== null && !isset($ffiResult['error'])) {
                return ['ok' => true, 'outputs' => $ffiResult];
            }
        } catch (\Throwable $e) {
            Log::warning("RuleVmService FfiRuleEngine failed in evaluateRawState, falling back to gRPC", ['error' => $e->getMessage()]);
        }
        
        // Fallback to gRPC/Legacy Engine
        return $this->engine->evaluateRules($state, $rulesDsl);
    }

    /**
     * Build state payload for Rule VM from universe + snapshot.
     * Puts entropy, stability_index, etc. at top level so DSL paths like "entropy" work.
     */
    public function buildStateForVm(Universe $universe, ?UniverseSnapshot $snapshot = null): array
    {
        $stateVector = ($snapshot && is_array($snapshot->state_vector)) ? $snapshot->state_vector : (is_array($universe->state_vector) ? $universe->state_vector : []);
        $metrics = ($snapshot && is_array($snapshot->metrics ?? [])) ? $snapshot->metrics : (is_array($universe->last_snapshot_metrics ?? []) ? $universe->last_snapshot_metrics : []);

        $state = array_merge($stateVector, [
            'tick' => (int) ($snapshot ? $snapshot->tick : $universe->current_tick),
            'entropy' => (float) ($snapshot->entropy ?? $universe->entropy ?? 0.0),
            'global_entropy' => (float) ($snapshot->entropy ?? $universe->entropy ?? 0.0),
            'stability_index' => (float) ($snapshot->stability_index ?? 1.0),
            'sci' => (float) ($metrics['sci'] ?? 1.0),
            'instability_gradient' => (float) ($metrics['instability_gradient'] ?? 0.0),
            'knowledge_core' => (float) ($stateVector['knowledge_core'] ?? $metrics['knowledge_core'] ?? 0.0),
        ]);

        if (isset($stateVector['axioms']) && is_array($stateVector['axioms'])) {
            $state['axioms'] = $stateVector['axioms'];
        }

        if (isset($stateVector['fields']) && is_array($stateVector['fields'])) {
            foreach ($stateVector['fields'] as $key => $val) {
                $state['field_' . $key] = $val; // e.g. field_belief_field
            }
            $state['fields'] = $stateVector['fields'];
        }

        if (isset($metrics['civ_fields']) && is_array($metrics['civ_fields'])) {
            $state['global_fields'] = $metrics['civ_fields'];
        }

        // Phase 3: Inject 8D Computed Metrics
        $hyper = $state['hyperspace_vector'] ?? [];
        $state = array_merge($state, $this->compute8DMetrics($hyper));

        return $state;
    }

    /**
     * Helper to compute 8D space mathematics.
     */
    protected function compute8DMetrics(array $vector): array
    {
        if (empty($vector)) {
            return [
                'hyperspace_8d_magnitude' => 0.0,
                'hyperspace_8d_resonance' => 0.0,
            ];
        }
        
        $sumSq = 0;
        foreach ($vector as $val) {
            $v = (float) $val;
            $sumSq += $v * $v;
        }
        
        return [
            'hyperspace_8d_magnitude' => sqrt($sumSq),
            'hyperspace_8d_resonance' => array_sum($vector) / count($vector),
        ];
    }

    /**
     * Base + optional deployed rule DSL (Doc §30 closed loop). When use_deployed_from_table, appends latest deployed proposal.
     */
    public function getResolvedRulesDsl(?int $universeId = null): string
    {
        $mutationService = app(\App\Services\Simulation\RuleMutationService::class);
        $base = Config::get('worldos.rule_engine.rules_dsl');
        
        if ($base === null || $base === '') {
            $path = Config::get('worldos.rule_engine.rules_path');
            if ($path && is_string($path) && is_readable($path)) {
                // Kiểm tra xem rule này có bản đột biến (mutated) không
                $mutated = $mutationService->getMutatedContent($path);
                $base = $mutated ?: (@file_get_contents($path) ?: '');
            }
        }
        
        // Phase 42: Append Meta-History rules
        $historyPath = resource_path('worldos_rules/simulation/history.dsl');
        if (file_exists($historyPath)) {
             $mutatedHistory = $mutationService->getMutatedContent($historyPath);
             $base .= "\n" . ($mutatedHistory ?: (@file_get_contents($historyPath) ?: ''));
        }

        // Phase 72: Append Ascension logic (The Final Threshold)
        $ascensionPath = resource_path('worldos_rules/simulation/ascension.dsl');
        if (file_exists($ascensionPath)) {
            $mutatedAscension = $mutationService->getMutatedContent($ascensionPath);
            $base .= "\n" . ($mutatedAscension ?: (@file_get_contents($ascensionPath) ?: ''));
        }

        return (string) $base;
    }

    /**
     * Phase 45: Evaluate and apply rules directly using WorldState.
     * Standardized V10: Supports file paths and extra context.
     *
     * V10+ Vector 7: DSL File Cache — compiled DSL content is cached per path
     * to avoid reading from disk every tick (large performance boost at scale).
     */
    /** @var array<string, string> In-process DSL content cache keyed by full path */
    private static array $dslFileCache = [];
    /** @var array<string, int> mtime of each cached DSL file for hot-reload invalidation */
    private static array $dslFileMtime = [];

    public function evaluateAndApplyWithState(\App\Simulation\Runtime\State\WorldState $state, string $dslOrPath, int $tick, array $context = []): void
    {
        $outputs = $this->evaluateWithResults($state, $dslOrPath, $tick, $context);
        $universeId = (int) $state->get('universe_id');
        $this->processOutputs($state, $outputs, $universeId, $tick);
    }

    /**
     * Phase 5: Pure Evaluation.
     * Evaluates DSL but returns the raw outputs (events/state changes) instead of applying them.
     * 
     * @return array Raw outputs from the DSL engine.
     */
    public function evaluateWithResults(\App\Simulation\Runtime\State\WorldState $state, string $dslOrPath, int $tick, array $context = []): array
    {
        // 1. Resolve DSL content with cache
        $dsl = $dslOrPath;
        if (!str_contains($dslOrPath, "\n")) {
            $suffix = str_ends_with($dslOrPath, '.dsl') ? $dslOrPath : $dslOrPath . '.dsl';
            $path = resource_path('worldos_rules/' . $suffix);

            $isProduction = app()->environment('production');
            $currentMtime = !$isProduction && file_exists($path) ? filemtime($path) : null;

            $needsReload = !isset(self::$dslFileCache[$path])
                || ($currentMtime !== null && $currentMtime !== (self::$dslFileMtime[$path] ?? null));

            if ($needsReload) {
                if (file_exists($path)) {
                    $mutationService = app(\App\Services\Simulation\RuleMutationService::class);
                    $mutated = $mutationService->getMutatedContent($path);
                    self::$dslFileCache[$path] = $mutated ?: (@file_get_contents($path) ?: '');
                    if ($currentMtime !== null) {
                        self::$dslFileMtime[$path] = $currentMtime;
                    }
                } else {
                    Log::warning("RuleVmService: DSL file not found at {$path}");
                    self::$dslFileCache[$path] = '';
                }
            }

            $dsl = self::$dslFileCache[$path];
        }

        if (empty($dsl)) {
            return [];
        }

        // 2. Build state and merge context
        $rawState = array_merge($this->buildRawStateFromManifold($state, $tick), $context);
        
        $cacheService = app(\App\Services\Simulation\CausalCacheService::class);
        $result = $cacheService->remember($rawState, $dsl, function() use ($rawState, $dsl) {
            $ffiResult = $this->ffiEngine->evaluateDsl($dsl, json_encode($rawState), time());
            if ($ffiResult !== null && !isset($ffiResult['error'])) {
                return ['ok' => true, 'outputs' => $ffiResult];
            }
            return $this->engine->evaluateRules($rawState, $dsl);
        });

        if (! ($result['ok'] ?? false)) {
            Log::warning('Rule VM evaluateWithResults failed', [
                'universe_id' => $state->get('universe_id'),
                'dsl_source' => substr($dslOrPath, 0, 50),
                'error' => $result['error_message'] ?? 'unknown',
            ]);
            return [];
        }

        return $result['outputs'] ?? [];
    }

    protected function buildRawStateFromManifold(\App\Simulation\Runtime\State\WorldState $state, int $tick): array
    {
        $fields = $state->getFields();
        $raw = [
            'tick' => $tick,
            'entropy' => (float) $state->get('entropy', 0.5),
            'global_entropy' => (float) $state->get('entropy', 0.5),
            'stability_index' => (float) $state->get('stability_index', 0.5),
            'resonance_field' => (float) $state->get('resonance_field', 0.0),
            'historical_phase' => $state->get('timeline.historical_phase', 'UNKNOWN'),
            'fields' => $fields,
        ];

        // Flat fields for easier DSL access (e.g. "fields.wealth")
        foreach ($fields as $k => $v) {
            $raw['field_' . $k] = $v;
        }

        // Add economy/market structures if they exist
        $raw['market'] = $state->get('economy.market', []);
        $raw['civilization'] = $state->get('civilization', []);

        // Phase 72: Reflection Data (meta-logic)
        $raw['meta_logic'] = [
            'active_mutations' => count($state->get('meta.active_mutations', [])),
            'has_shadow_rules' => !empty($state->get('meta.active_mutations', [])),
            'singularity_progress' => (float)$state->get('meta.singularity_progress', 0)
        ];

        // Phase 3: Inject 8D Computed Metrics for DSL
        $calc8d = $this->compute8DMetrics($state->getHyperspaceVector());
        $raw['hyperspace_8d_magnitude'] = $calc8d['hyperspace_8d_magnitude'];
        $raw['hyperspace_8d_resonance'] = $calc8d['hyperspace_8d_resonance'];

        return $raw;
    }

    /**
     * Evaluate rules and apply outputs: emit events, adjust world state via standardized DTO.
     */
    public function evaluateAndApply(Universe $universe, ?UniverseSnapshot $snapshot = null, ?string $rulesDsl = null): void
    {
        $state = $this->stateManager->get();
        if (!$state) {
            Log::error('RuleVmService: StateManager returned null state during evaluateAndApply');
            return;
        }

        $rulesDsl = $rulesDsl ?? $this->getResolvedRulesDsl($universe->id);

        // Build a temporary raw state for the Rust Engine (which doesn't know about our DTO)
        $rawState = $this->buildStateForVm($universe, $snapshot);
        
        // Use Rust FFI Evaluate Pipeline via evaluateRawState
        $result = $this->evaluateRawState($rawState, $rulesDsl ?? '');

        if (! ($result['ok'] ?? false)) {
            Log::warning('Rule VM evaluate failed', [
                'universe_id' => $universe->id,
                'error' => $result['error_message'] ?? 'unknown',
            ]);
            return;
        }

        $outputs = $result['outputs'] ?? [];
        $tick = (int) ($snapshot ? $snapshot->tick : $universe->current_tick);
        $this->processOutputs($state, $outputs, (int) ($universe->id ?? 0), $tick);
    }

    /**
     * Phase 5: Map raw DSL outputs to an EngineResult (Pure model).
     */
    public function mapOutputsToResults(array $outputs, int $universeId, int $tick, \App\Simulation\Runtime\State\WorldState $state): \App\Simulation\Domain\EngineResult
    {
        $events = [];
        $effects = [];

        foreach ($outputs as $out) {
            $type = $out['type'] ?? '';

            if ($type === 'event' && !empty($out['event_name'])) {
                // Return as raw array/event for emitEvents
                $events[] = $out; 
            }

            if ($type === 'adjust_stability' && isset($out['adjust_stability_delta'])) {
                $current = (float) $state->get('stability_index', 1.0);
                $effects[] = new \App\Simulation\Effects\WorldStateUpdateEffect([
                    'stability_index' => max(0.0, min(1.0, $current + (float) $out['adjust_stability_delta']))
                ]);
            }

            if ($type === 'adjust_entropy' && isset($out['adjust_entropy_delta'])) {
                $current = (float) $state->get('entropy', 0.0);
                $newEntropy = max(0.0, min(1.0, $current + (float) $out['adjust_entropy_delta']));
                $effects[] = new \App\Simulation\Effects\WorldStateUpdateEffect([
                    'entropy' => $newEntropy,
                    'global_entropy' => $newEntropy
                ]);
            }

            if ($type === 'add_path' && isset($out['add_path'], $out['add_path_delta'])) {
                $current = (float) $state->get($out['add_path'], 0.0);
                $effects[] = new \App\Simulation\Effects\WorldStateUpdateEffect([
                    $out['add_path'] => max(0.0, min(1.0, $current + (float) $out['add_path_delta']))
                ]);
            }

            if ($type === 'set_path' && isset($out['set_path'], $out['set_path_value'])) {
                $effects[] = new \App\Simulation\Effects\WorldStateUpdateEffect([
                    $out['set_path'] => $out['set_path_value']
                ]);
            }

            if ($type === 'spawn_actor' && isset($out['spawn_actor_kind'])) {
                $events[] = ['type' => 'SPAWN_ACTOR', 'payload' => ['kind' => $out['spawn_actor_kind']]];
            }
        }

        return new \App\Simulation\Domain\EngineResult($events, $effects, []);
    }

    protected function processOutputs(\App\Simulation\Runtime\State\WorldState $state, array $outputs, int $universeId, int $tick): void
    {
        // ... (existing processOutputs implementation)
        // Note: In Phase 5+, this will be deprecated once all engines are Pure.
        $result = $this->mapOutputsToResults($outputs, $universeId, $tick, $state);
        
        // Emulate behavior for now
        foreach ($result->stateChanges as $effect) {
            // We use a trick: we know WorldStateUpdateEffect has apply but we need WorldStateMutable
            // For now, processOutputs still works on mutable state
            if (method_exists($effect, 'apply')) {
                $effect->apply($state instanceof \App\Simulation\Runtime\State\WorldStateMutable ? $state : new class($state) extends \App\Simulation\Runtime\State\WorldStateMutable {
                    public function __construct(private $s) {}
                    public function set($k, $v): void { $this->s->set($k, $v); }
                    public function get($k, $d=null) { return $this->s->get($k, $d); }
                    public function getStateVector(): array { return $this->s->getStateVector(); }
                    public function setStateVector(array $v): void { 
                        // This is hacky, but processOutputs is legacy
                        $rem = new \ReflectionProperty(get_class($this->s), 'data');
                        $rem->setAccessible(true);
                        $rem->setValue($this->s, $v);
                    }
                });
            }
        }
        
        foreach ($result->events as $ev) {
             if (is_array($ev) && isset($ev['event_name'])) {
                 $this->emitSimulationEvent($universeId, $ev['event_name'], $tick, $ev['metadata'] ?? []);
             }
        }
    }

    /**
     * Helper to emit simulation events to the central bus.
     */
    protected function emitSimulationEvent(int $universeId, string $name, int $tick, array $payload): void
    {
        event(new SimulationEventOccurred($universeId, $name, $tick, array_merge(['source' => 'rule_vm'], $payload)));
    }

    /**
     * Enforce variable boundaries in memory.
     */
    protected function applyConstraintsToState(\App\Simulation\Runtime\State\WorldState $state, array $constraints): void
    {
        foreach ($constraints as $path => $bounds) {
            if (count($bounds) >= 2) {
                $current = (float) ($state->get($path) ?? 0.0);
                $min = (float) $bounds[0];
                $max = (float) $bounds[1];
                $state->set($path, max($min, min($max, $current)));
            }
        }
    }
}
