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
        protected SimulationEngineClientInterface $engine,
        protected \App\Simulation\Runtime\State\StateManager $stateManager
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

        return $state;
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

    public function evaluateAndApplyWithState(\App\Simulation\Runtime\State\WorldState $state, string $dslOrPath, int $tick, array $context = []): void
    {
        // 1. Resolve DSL content with cache
        $dsl = $dslOrPath;
        if (!str_contains($dslOrPath, "\n")) {
            // It's a path, not inline DSL — resolve with caching
            $suffix = str_ends_with($dslOrPath, '.dsl') ? $dslOrPath : $dslOrPath . '.dsl';
            $path = resource_path('worldos_rules/' . $suffix);

            if (!isset(self::$dslFileCache[$path])) {
                if (file_exists($path)) {
                    $mutationService = app(\App\Services\Simulation\RuleMutationService::class);
                    $mutated = $mutationService->getMutatedContent($path);
                    self::$dslFileCache[$path] = $mutated ?: (@file_get_contents($path) ?: '');
                } else {
                    Log::warning("RuleVmService: DSL file not found at {$path}");
                    self::$dslFileCache[$path] = '';
                }
            }

            $dsl = self::$dslFileCache[$path];
        }

        if (empty($dsl)) {
            return;
        }

        // 2. Build state and merge context
        $rawState = array_merge($this->buildRawStateFromManifold($state, $tick), $context);
        
        // Tối ưu hiệu năng bằng Causal Cache
        $cacheService = app(\App\Services\Simulation\CausalCacheService::class);
        $result = $cacheService->remember($rawState, $dsl, function() use ($rawState, $dsl) {
            return $this->engine->evaluateRules($rawState, $dsl);
        });

        if (! ($result['ok'] ?? false)) {
            Log::warning('Rule VM evaluateAndApplyWithState failed', [
                'universe_id' => $state->get('universe_id'),
                'dsl_source' => $dslOrPath,
                'error' => $result['error_message'] ?? 'unknown',
            ]);
            return;
        }

        $outputs = $result['outputs'] ?? [];
        $universeId = (int) $state->get('universe_id');
        $this->processOutputs($state, $outputs, $universeId, $tick);
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
        $result = $this->engine->evaluateRules($rawState, $rulesDsl ?? '');

        if (! ($result['ok'] ?? false)) {
            Log::warning('Rule VM evaluate failed', [
                'universe_id' => $universe->id,
                'error' => $result['error_message'] ?? 'unknown',
            ]);
            return;
        }

        $outputs = $result['outputs'] ?? [];
        $tick = (int) ($snapshot ? $snapshot->tick : $universe->current_tick);
        $this->processOutputs($state, $outputs, $universe->id, $tick);
    }

    protected function processOutputs(\App\Simulation\Runtime\State\WorldState $state, array $outputs, int $universeId, int $tick): void
    {
        foreach ($outputs as $out) {
            $type = $out['type'] ?? '';
            
            // 1. Standard Event Emission
            if ($type === 'event' && ! empty($out['event_name'])) {
                $this->emitSimulationEvent($universeId, $out['event_name'], $tick, $out['metadata'] ?? []);
            }

            // 2. Standardized state adjustments (In-memory via WorldState)
            if ($type === 'adjust_stability' && isset($out['adjust_stability_delta'])) {
                $current = (float) $state->get('stability_index', 1.0);
                $state->set('stability_index', max(0.0, min(1.0, $current + (float) $out['adjust_stability_delta'])));
            }

            if ($type === 'adjust_entropy' && isset($out['adjust_entropy_delta'])) {
                $current = (float) $state->get('entropy', 0.0);
                $newEntropy = max(0.0, min(1.0, $current + (float) $out['adjust_entropy_delta']));
                $state->set('entropy', $newEntropy);
                $state->set('global_entropy', $newEntropy);
            }

            if ($type === 'add_path' && isset($out['add_path'], $out['add_path_delta'])) {
                $current = (float) $state->get($out['add_path'], 0.0);
                $state->set($out['add_path'], max(0.0, min(1.0, $current + (float) $out['add_path_delta'])));
            }

            if ($type === 'set_path' && isset($out['set_path'], $out['set_path_value'])) {
                $state->set($out['set_path'], $out['set_path_value']);
            }

            // 3. Phase 32: Declarative Actions (Drift & Constraints)
            if ($type === 'drift_path' && isset($out['path'], $out['target'], $out['speed'])) {
                $current = (float) ($state->get($out['path']) ?? 0.0);
                $newVal = $current + (float) $out['speed'] * ((float) $out['target'] - $current);
                $state->set($out['path'], $newVal);
            }

            if ($type === 'constraints') {
                $this->applyConstraintsToState($state, $out['constraints'] ?? []);
            }

            // 4. Actor Spawning Trigger
            if ($type === 'spawn_actor' && isset($out['spawn_actor_kind'])) {
                $this->emitSimulationEvent($universeId, 'SPAWN_ACTOR', $tick, ['kind' => $out['spawn_actor_kind']]);
            }

            // 5. Phase 42: Meta-History Phase Shifts
            if ($type === 'event' && ($out['event_name'] ?? '') === 'HISTORICAL_PHASE_SHIFT') {
                $phase = $out['metadata']['phase'] ?? 'UNKNOWN';
                $state->set('timeline.historical_phase', $phase);
                Log::info("RuleVmService: Meta-History Phase Shift to {$phase} for Universe {$universeId}");
            }

            // 6. Phase 69: Terminal Primitives (V10)
            if ($type === 'saturate' && isset($out['path'], $out['limit'])) {
                $current = (float) $state->get($out['path'], 0.0);
                $limit = (float) $out['limit'];
                if ($current > $limit) {
                    $state->set($out['path'], $limit);
                    $this->emitSimulationEvent($universeId, 'FIELD_SATURATION', $tick, ['path' => $out['path']]);
                }
            }

            if ($type === 'leak' && isset($out['target_index'], $out['packet'])) {
                // Rò rỉ dữ liệu xuống tầng giả lập lồng nhau
                $nested = $state->getNestedRealities();
                $target = (int) $out['target_index'];
                if (isset($nested[$target])) {
                    $nested[$target]['leaked_data'][] = $out['packet'];
                    $state->setNestedRealities($nested);
                    $this->emitSimulationEvent($universeId, 'INFORMATION_LEAK', $tick, ['target' => $target]);
                }
            }

            // Phase 72: Meaning Weighting
            if ($type === 'weight_meaning' && isset($out['meaning_id'], $out['weight_delta'])) {
                $systems = $state->get('meta.meaning_systems', []);
                foreach ($systems as &$sys) {
                    if ($sys['id'] === $out['meaning_id']) {
                        $sys['total_influence'] = max(0.0, min(1.0, (float)$sys['total_influence'] + (float)$out['weight_delta']));
                        break;
                    }
                }
                $state->set('meta.meaning_systems', $systems);
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
