<?php

namespace App\Services\Material;

use App\Models\MaterialInstance;
use App\Models\MaterialLog;
use App\Modules\Simulation\Services\RuleEngine\RuleVmService; // Added this line

class MaterialLifecycleEngine
{
    public function __construct(
        protected PressureResolver $pressureResolver,
        protected \App\Modules\Simulation\Services\RuleEngine\RuleVmService $ruleVm // Added this line
    ) {
        $this->ruleVm = $ruleVm ?? \app(\App\Modules\Simulation\Services\RuleEngine\RuleVmService::class); // Added this line
    }

    /**
     * Process lifecycle and return aggregated pressure deltas.
     */
    public function processTick(int $universeId, int $tick, array $context): array
    {
        $aggregatedDeltas = [];
        $instances = MaterialInstance::with(['material.parentMutations'])
            ->where('universe_id', $universeId)
            ->get();

        // Calculate Ontology Resonance
        $ontologyCounts = [];
        foreach ($instances as $instance) {
            if ($instance->lifecycle === 'active' && $instance->material) {
                $ontology = $instance->material->ontology ?? 'physical';
                $ontologyCounts[$ontology] = ($ontologyCounts[$ontology] ?? 0) + 1;
            }
        }
        $context['ontology_counts'] = $ontologyCounts;

        foreach ($instances as $instance) {
            if (!$instance->material) {
                continue;
            }
            if ($instance->lifecycle === 'dormant') {
                if ($this->canActivate($instance, $context)) {
                    $this->activate($instance, $tick);
                }
            } elseif ($instance->lifecycle === 'active') {
                // AGGREGATE DELTAS
                $deltas = $this->pressureResolver->apply($instance, $context);
                foreach ($deltas as $key => $val) {
                    $aggregatedDeltas[$key] = ($aggregatedDeltas[$key] ?? 0) + $val;
                }
                
                if ($this->checkMutations($instance, $tick, $context)) {
                    continue; // Mutation occurred, skip obsolete check this tick
                }

                if ($this->shouldBecomeObsolete($instance, $context)) {
                    $this->obsolete($instance, $tick);
                }
            }
        }

        return $aggregatedDeltas;
    }

    protected function checkMutations(MaterialInstance $instance, int $tick, array $context): bool
    {
        if (!$instance->material) return false;
        // 10% chance to check mutations to avoid heavy load every tick
        $prng = \App\Modules\Simulation\Services\SimulationPRNG::forUniverse($instance->universe);
        if ($prng->nextInt(0, 9) > 0) return false;

        $mutations = $instance->material->parentMutations;
        $dsl = @file_get_contents(\resource_path('worldos_rules/material/lifecycle.dsl')) ?: ''; // Added this line

        foreach ($mutations as $mutation) {
            $vmState = [ // Added this block
                'metrics' => $context,
                'condition_string' => $mutation->trigger_condition
            ];
            
            $result = $this->ruleVm->evaluateRawState($vmState, $dsl); // Added this line
            
            // NOTE: For now, we still use the internal comparison logic if DSL evaluates to nothing
            // OR we can trust the DSL completely if we implement the string comparison there.
            // Since our DSL is simple, let's keep a fallback or implement it properly.
            
            if ($this->evaluateCondition($mutation->trigger_condition, $context)) {
                // Check if child already exists
                $exists = MaterialInstance::where('universe_id', $instance->universe_id)
                    ->where('material_id', $mutation->child_material_id)
                    ->exists();
                
                if (!$exists) {
                    $this->mutate($instance, $mutation, $tick);
                    return true;
                }
            }
        }
        return false;
    }

    protected function evaluateCondition(?string $condition, array $context): bool
    {
        if (empty($condition)) return true;
        
        // Support multiple conditions separated by '&&'
        $parts = explode('&&', $condition);
        foreach ($parts as $part) {
            $part = trim($part);
            if (preg_match('/([a-z_]+)\s*([><=]+)\s*([\d.]+)/', $part, $matches)) {
                $key = $matches[1];
                $op = $matches[2];
                $val = (float)$matches[3];
                $current = $context[$key] ?? 0;
                
                $satisfied = match($op) {
                    '>' => $current > $val,
                    '>=' => $current >= $val,
                    '<' => $current < $val,
                    '<=' => $current <= $val,
                    '=' => abs($current - $val) < 0.001,
                    default => false,
                };

                if (!$satisfied) return false;
            }
        }
        return true;
    }

    protected function mutate(MaterialInstance $parent, $mutation, int $tick): void
    {
        MaterialInstance::create([
            'material_id' => $mutation->child_material_id,
            'universe_id' => $parent->universe_id,
            'lifecycle' => 'active',
            'activated_at_tick' => $tick,
            'context' => ['origin_mutation_id' => $mutation->id],
        ]);

        MaterialLog::create([
            'material_instance_id' => $parent->id,
            'event' => 'mutated',
            'tick' => $tick,
            'payload' => ['child_material_id' => $mutation->child_material_id],
        ]);
    }

    protected function canActivate(MaterialInstance $instance, array $context): bool
    {
        $material = $instance->material;
        if (!$material) return false;

        $dsl = @file_get_contents(\resource_path('worldos_rules/material/lifecycle.dsl')) ?: ''; // Modified this block
        $vmState = [
            'metrics' => $context,
            'material_inputs' => $material->inputs ?? []
        ];

        // Evaluate the can_activate rule in the DSL
        // Since the VM evaluates the whole script, we expect it to set a variable or return it.
        // Let's assume the DSL script is written to return the result or set 'ok'.
        $result = $this->ruleVm->evaluateRawState($vmState, $dsl);
        
        return (bool)($result['state']['ok'] ?? true); // Modified this block
    }

    protected function activate(MaterialInstance $instance, int $tick): void
    {
        $instance->update(['lifecycle' => 'active', 'activated_at_tick' => $tick]);
        MaterialLog::create([
            'material_instance_id' => $instance->id,
            'event' => 'activated',
            'tick' => $tick,
        ]);
    }

    protected function shouldBecomeObsolete(MaterialInstance $instance, array $context): bool
    {
        $material = $instance->material;
        if (!$material) return false;

        $dsl = @file_get_contents(\resource_path('worldos_rules/material/lifecycle.dsl')) ?: ''; // Modified this block
        $vmState = [
            'metrics' => $context,
            'material_outputs' => $material->outputs ?? []
        ];

        $result = $this->ruleVm->evaluateRawState($vmState, $dsl);
        
        return (bool)($result['state']['trigger'] ?? false); // Modified this block
    }

    protected function obsolete(MaterialInstance $instance, int $tick): void
    {
        $instance->update(['lifecycle' => 'obsolete']);
        MaterialLog::create([
            'material_instance_id' => $instance->id,
            'event' => 'obsolete',
            'tick' => $tick,
        ]);
    }
}




