<?php

namespace App\Modules\Simulation\Services\RuleEngine;

use App\Contracts\SimulationEngineClientInterface;
use App\Events\Simulation\SimulationEventOccurred;
use App\Models\RuleProposal;
use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Modules\Simulation\Services\RuleMutationService;
use App\Modules\Simulation\Services\CausalCacheService;
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
        protected FfiRuleEngine $ffiEngine,
        protected \App\Modules\Simulation\Services\AxiomRegistry $axiomRegistry
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
            $stateJson = json_encode($state);
            if ($state['tick'] % 5 === 0) { // Log every 5 ticks to avoid bloat
                 Log::debug("RuleVmService FFI State Summary", [
                     'tick' => $state['tick'],
                     'keys' => array_keys($state),
                     'axioms_keys' => array_keys($state['axioms'] ?? []),
                     'base_mass' => $state['base_mass'] ?? 'MISSING'
                 ]);
            }
            $ffiResult = $this->ffiEngine->evaluateDsl($rulesDsl, $stateJson, time());
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
        $worldState = new \App\Simulation\Runtime\State\WorldState($stateVector);
        
        $tick = (int) ($snapshot ? $snapshot->tick : $universe->current_tick);
        
        // Use the centralized manifold builder to ensure all properties (axioms, fields, etc.) are present
        return $this->buildRawStateFromManifold($worldState, $tick);
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
        $mutationService = app(\App\Modules\Simulation\Services\RuleMutationService::class);
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
                    $mutationService = app(RuleMutationService::class);
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
        
        $cacheService = app(CausalCacheService::class);
        $result = $cacheService->remember($rawState, $dsl, function() use ($rawState, $dsl) {
            // Force specific namespaces to be objects {} if empty, for Rust compatibility
            $state = $rawState;
            if (isset($state['axioms']) && is_array($state['axioms']) && empty($state['axioms'])) $state['axioms'] = (object)[];
            if (isset($state['cosmic']) && is_array($state['cosmic']) && empty($state['cosmic'])) $state['cosmic'] = (object)[];
            if (isset($state['fields']) && is_array($state['fields']) && empty($state['fields'])) $state['fields'] = (object)[];
            
            $stateJson = json_encode($state, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION);
            
            $ffiResult = $this->ffiEngine->evaluateDsl($dsl, $stateJson, time());
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
        $cosmic = $state->getCosmic();
        $raw = [
            'tick' => $tick,
            'universe_id' => (int) $state->get('universe_id', 0),
            'status' => $state->get('status', 'active'),
            'entropy' => (float) $state->get('entropy', 0.5),
            'order' => (float) $state->get('order', 0.5),
            'global_entropy' => (float) $state->get('entropy', 0.5),
            'stability_index' => (float) $state->get('stability_index', 0.5),
            'structural_coherence' => (float) $state->get('stability_index', 0.5), 
            'resonance_field' => (float) $state->get('resonance_field', 0.0),
            'field_resonance_field' => (float) $state->get('resonance_field', 0.0),
            'historical_phase' => $state->get('timeline.historical_phase', 'UNKNOWN'),
            'random_chance' => (float) (mt_rand(0, 1000) / 1000.0),
            // Physics / Pressure Triggers
            'energyLevel' => (float) ($cosmic['energy_level'] ?? 0.5),
            'base_mass' => (float) ($cosmic['base_mass'] ?? 100.0),
            'structured_mass' => (float) $state->get('planetary.structured_mass', 10.0),
            'cultural_distance' => (float) $state->get('social.cultural_distance', 0.1),
            'current_scars_weight' => (float) $state->get('timeline.scars_weight', 0.0),
            'civilizationComplexity' => (float) $state->get('metrics.civilization_complexity', 0.0),
            'civilizationCount' => (int) $state->get('metrics.civilization_count', 0),
            'innovation' => (float) ($fields['knowledge'] ?? 0.0),
            'myth' => (float) ($fields['meaning'] ?? 0.5),
            'violence' => (float) ($fields['power'] ?? 0.0),
            'spirituality' => (float) $state->get('meta.spirituality_index', 0.1),
            'ascension_probability' => 0.01,
            'fields' => $fields,
        ];

        // Flat fields for easier DSL access (e.g. "field_belief_field")
        foreach ($fields as $k => $v) {
            $raw['field_' . $k] = (float)$v;
        }

        // Add layer data
        $raw['market'] = $state->get('economy.market', []);
        $raw['civilization'] = $state->get('civilization', []);
        $raw['cosmic'] = $cosmic;
        $raw['planetary'] = $state->get('planetary', []);
        $raw['ecosystem'] = $state->get('ecosystem', []);

        // Load Axioms from Registry (Default to Tier 1)
        $raw['axioms'] = $this->axiomRegistry->getDefaultMapForTier(1);
        
        // Flatten and add DSL-specific defaults if missing in the registry
        $flatAxioms = [];
        foreach (($raw['axioms'] ?? []) as $dim => $vals) {
            if (is_array($vals)) {
                foreach ($vals as $k => $v) {
                    $flatAxioms[$k] = $v;
                }
            }
        }
        // Direct DSL requirements (Phase 11 consistency)
        $flatAxioms['entropy_drift_base'] = $flatAxioms['entropy_drift_base'] ?? 0.001;
        $flatAxioms['order_decay_rate'] = $flatAxioms['order_decay_rate'] ?? 0.005;
        $flatAxioms['pressure_decay'] = $flatAxioms['pressure_decay'] ?? 0.95;
        $flatAxioms['innovation_impact'] = $flatAxioms['innovation_impact'] ?? 0.01;
        
        $raw['axioms'] = array_merge($raw['axioms'], $flatAxioms);

        // Phase 72: Reflection Data (meta-logic)
        $raw['meta'] = [
            'active_mutations' => count($state->get('meta.active_mutations', [])),
            'has_shadow_rules' => !empty($state->get('meta.active_mutations', [])),
            'singularity_progress' => (float)$state->get('meta.singularity_progress', 0),
            'resonance' => (float) $state->get('resonance_field', 0.0),
            'omen' => $state->get('meta.omen', [
                'type' => 'Natural Flow',
                'sci_modifier' => 0.0,
                'entropy_modifier' => 0.0
            ])
        ];
        $raw['meta_logic'] = $raw['meta']; // Compatibility

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

            if ($type === 'drift' && !empty($out['drift_path'])) {
                $path = $out['drift_path'];
                $target = $out['drift_target'] ?? null;
                $speed = $out['drift_speed'] ?? null;
                
                $current = (float) $state->get($path, 0.0);
                
                if ($target === null && $speed !== null) {
                    // "drift X by Y" -> target is None, speed is Y (delta)
                    $newVal = $current + (float) $speed;
                } else if ($target !== null && $speed !== null) {
                    // "drift X target Y speed Z" -> approach Y 
                    $newVal = $current + ((float) $speed) * ((float)$target - $current);
                } else {
                    $newVal = $current;
                }
                
                $effects[] = new \App\Simulation\Effects\WorldStateUpdateEffect([
                    $path => $newVal
                ]);
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

