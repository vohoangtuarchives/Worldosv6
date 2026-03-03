<?php

namespace App\Services\Simulation;

use App\Models\Universe;
use App\Models\Material;
use App\Models\MaterialInstance;
use App\Models\MaterialMutation;
use Illuminate\Support\Facades\Log;

class MaterialEvolutionEngine
{
    /**
     * Đồng bộ hóa và tiến hóa các Material trong Universe dựa trên metrics.
     */
    public function evolve(Universe $universe, array $metrics): void
    {
        $this->processLifecycles($universe, $metrics);
        $this->processMutations($universe, $metrics);
    }

    /**
     * Dormant -> Active | Active -> Obsolete (§8.2)
     */
    protected function processLifecycles(Universe $universe, array $metrics): void
    {
        $instances = $universe->materialInstances()->with('material')->get();
        $entropy = $metrics['entropy'] ?? 0;
        $order = $metrics['order'] ?? 0;

        foreach ($instances as $instance) {
            $material = $instance->material;

            // Simple logic: If order is high, stabilize materials. If entropy is high, degrade them.
            if ($instance->lifecycle === Material::LIFECYCLE_DORMANT) {
                if ($order > 0.6) {
                    $instance->update(['lifecycle' => Material::LIFECYCLE_ACTIVE]);
                    Log::info("Material Activated: {$material->name} in Universe [{$universe->id}]");
                }
            } elseif ($instance->lifecycle === Material::LIFECYCLE_ACTIVE) {
                if ($entropy > 0.8) {
                    $instance->update(['lifecycle' => Material::LIFECYCLE_OBSOLETE]);
                    Log::info("Material Obsolete: {$material->name} in Universe [{$universe->id}]");
                }
            }
        }
    }

    /**
     * Sinh đột biến từ DAG (§8.4)
     */
    protected function processMutations(Universe $universe, array $metrics): void
    {
        $ipScore = $metrics['ip_score'] ?? 0;
        
        // High IP-score (Innovation) triggers mutation discovery
        if ($ipScore > 0.7) {
            $activeInstances = $universe->materialInstances()
                ->where('lifecycle', Material::LIFECYCLE_ACTIVE)
                ->get();

            foreach ($activeInstances as $instance) {
                $possibleMutations = MaterialMutation::where('parent_material_id', $instance->material_id)
                    ->whereDoesntHave('childMaterial.instances', function ($q) use ($universe) {
                        $q->where('universe_id', $universe->id);
                    })
                    ->with('childMaterial')
                    ->get();

                foreach ($possibleMutations as $mutation) {
                    // 20% chance to discover child material per high-IP tick
                    if (mt_rand(0, 100) < 20) {
                        $universe->materialInstances()->create([
                            'material_id' => $mutation->child_material_id,
                            'lifecycle' => Material::LIFECYCLE_DORMANT,
                            'context' => ['origin_parent' => $instance->id],
                        ]);
                        Log::info("Mutation Discovered: {$mutation->childMaterial->name} from {$instance->material->name}");
                    }
                }
            }
        }
    }
}
