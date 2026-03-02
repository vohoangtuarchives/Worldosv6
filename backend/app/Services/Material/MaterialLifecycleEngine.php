<?php

namespace App\Services\Material;

use App\Models\MaterialInstance;
use App\Models\MaterialLog;

class MaterialLifecycleEngine
{
    public function __construct(
        protected PressureResolver $pressureResolver
    ) {}

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
            if ($instance->lifecycle === 'active') {
                $ontology = $instance->material->ontology;
                $ontologyCounts[$ontology] = ($ontologyCounts[$ontology] ?? 0) + 1;
            }
        }
        $context['ontology_counts'] = $ontologyCounts;

        foreach ($instances as $instance) {
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
        // 10% chance to check mutations to avoid heavy load every tick
        if (mt_rand(0, 9) > 0) return false;

        $mutations = $instance->material->parentMutations;
        foreach ($mutations as $mutation) {
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
        
        if (preg_match('/([a-z_]+)\s*([><=]+)\s*([\d.]+)/', $condition, $matches)) {
            $key = $matches[1];
            $op = $matches[2];
            $val = (float)$matches[3];
            $current = $context[$key] ?? 0;
            
            return match($op) {
                '>' => $current > $val,
                '>=' => $current >= $val,
                '<' => $current < $val,
                '<=' => $current <= $val,
                '=' => abs($current - $val) < 0.001,
                default => false,
            };
        }
        return false;
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
        $inputs = $material->inputs ?? [];
        foreach ($inputs as $key => $minValue) {
            $val = $context[$key] ?? 0;
            if (is_numeric($minValue) && $val < $minValue) {
                return false;
            }
        }
        return true;
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
        $outputs = $instance->material->outputs ?? [];
        foreach ($outputs as $key => $minRequired) {
            $val = $context[$key] ?? 0;
            if (is_numeric($minRequired) && $val < $minRequired * 0.2) {
                return true;
            }
        }
        return false;
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
