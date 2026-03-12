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
        protected SimulationEngineClientInterface $engine
    ) {}

    /**
     * Build state payload for Rule VM from universe + snapshot.
     * Puts entropy, stability_index, etc. at top level so DSL paths like "entropy" work.
     */
    public function buildStateForVm(Universe $universe, UniverseSnapshot $snapshot): array
    {
        $stateVector = is_array($snapshot->state_vector) ? $snapshot->state_vector : [];
        $metrics = is_array($snapshot->metrics ?? []) ? $snapshot->metrics : [];

        $state = array_merge($stateVector, [
            'tick' => (int) $snapshot->tick,
            'entropy' => (float) ($snapshot->entropy ?? $universe->entropy ?? 0.0),
            'global_entropy' => (float) ($snapshot->entropy ?? $universe->entropy ?? 0.0),
            'stability_index' => (float) ($snapshot->stability_index ?? 1.0),
            'sci' => (float) ($metrics['sci'] ?? 1.0),
            'instability_gradient' => (float) ($metrics['instability_gradient'] ?? 0.0),
            'knowledge_core' => (float) ($stateVector['knowledge_core'] ?? $metrics['knowledge_core'] ?? 0.0),
        ]);

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
        $base = Config::get('worldos.rule_engine.rules_dsl');
        if ($base === null || $base === '') {
            $path = Config::get('worldos.rule_engine.rules_path');
            if ($path && is_string($path) && is_readable($path)) {
                $base = file_get_contents($path) ?: '';
            }
        }
        $base = (string) $base;
        if (! Config::get('worldos.rule_engine.use_deployed_from_table', false)) {
            return $base;
        }
        $deployed = RuleProposal::whereNotNull('deployed_at')
            ->when($universeId !== null, fn ($q) => $q->where('universe_id', $universeId))
            ->orderByDesc('deployed_at')
            ->first();
        if ($deployed && $deployed->dsl !== '') {
            return $base !== '' ? $base . "\n" . $deployed->dsl : $deployed->dsl;
        }
        return $base;
    }

    /**
     * Evaluate rules and apply outputs: emit events, optionally adjust universe state.
     * When rulesDsl is null, uses base DSL from config/file and, if use_deployed_from_table, appends latest deployed rule.
     */
    public function evaluateAndApply(Universe $universe, UniverseSnapshot $snapshot, ?string $rulesDsl = null): void
    {
        $state = $this->buildStateForVm($universe, $snapshot);
        $rulesDsl = $rulesDsl ?? $this->getResolvedRulesDsl($universe->id);

        $result = $this->engine->evaluateRules($state, $rulesDsl ?? '');

        if (! ($result['ok'] ?? false)) {
            Log::warning('Rule VM evaluate failed', [
                'universe_id' => $universe->id,
                'error' => $result['error_message'] ?? 'unknown',
            ]);
            return;
        }

        $outputs = $result['outputs'] ?? [];
        $tick = (int) $snapshot->tick;

        foreach ($outputs as $out) {
            $type = $out['type'] ?? '';
            if ($type === 'event' && ! empty($out['event_name'])) {
                event(new SimulationEventOccurred(
                    (int) $universe->id,
                    $out['event_name'],
                    $tick,
                    ['source' => 'rule_vm']
                ));
            }
            if ($type === 'adjust_stability' && isset($out['adjust_stability_delta'])) {
                $this->applyStabilityAdjustment($universe, (float) $out['adjust_stability_delta']);
            }
            if ($type === 'adjust_entropy' && isset($out['adjust_entropy_delta'])) {
                $this->applyEntropyAdjustment($universe, (float) $out['adjust_entropy_delta']);
            }
            if ($type === 'add_path' && isset($out['add_path'], $out['add_path_delta'])) {
                $this->applyAddPath($universe, $out['add_path'], (float) $out['add_path_delta']);
            }
            if ($type === 'set_path' && isset($out['set_path'], $out['set_path_value'])) {
                $this->applySetPath($universe, $out['set_path'], $out['set_path_value']);
            }
            if ($type === 'spawn_actor' && ! empty($out['spawn_actor_kind'])) {
                event(new SimulationEventOccurred(
                    (int) $universe->id,
                    'SPAWN_ACTOR',
                    $tick,
                    ['source' => 'rule_vm', 'kind' => $out['spawn_actor_kind']]
                ));
            }
        }
    }

    protected function applyStabilityAdjustment(Universe $universe, float $delta): void
    {
        $vec = is_array($universe->state_vector) ? $universe->state_vector : [];
        $current = (float) ($vec['stability_index'] ?? 1.0);
        $vec['stability_index'] = max(0.0, min(1.0, $current + $delta));
        $universe->state_vector = $vec;
        $universe->save();
    }

    protected function applyEntropyAdjustment(Universe $universe, float $delta): void
    {
        $vec = is_array($universe->state_vector) ? $universe->state_vector : [];
        $current = (float) ($vec['entropy'] ?? $universe->entropy ?? 0.0);
        $newEntropy = max(0.0, min(1.0, $current + $delta));
        $vec['entropy'] = $newEntropy;
        $vec['global_entropy'] = $newEntropy;
        $universe->state_vector = $vec;
        $universe->entropy = $newEntropy;
        $universe->save();
    }

    protected function applyAddPath(Universe $universe, string $path, float $delta): void
    {
        $vec = is_array($universe->state_vector) ? $universe->state_vector : [];
        $current = (float) (data_get($vec, $path) ?? 0.0);
        $newVal = max(0.0, min(1.0, $current + $delta));
        data_set($vec, $path, $newVal);
        $universe->state_vector = $vec;
        $universe->save();
    }

    protected function applySetPath(Universe $universe, string $path, mixed $value): void
    {
        $vec = is_array($universe->state_vector) ? $universe->state_vector : [];
        data_set($vec, $path, $value);
        $universe->state_vector = $vec;
        $universe->save();
    }
}
