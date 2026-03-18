<?php

namespace App\Simulation\Engines\Physics;

use App\Models\Universe;
use App\Models\Material;
use App\Models\MaterialInstance;
use App\Models\MaterialMutation;
use Illuminate\Support\Facades\Log;

class MaterialEvolutionEngine
{
    public function __construct(
        protected \App\Services\AIResearch\MaterialSynthesisService $synthesisService
    ) {}

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
            if (!$material) continue;

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
     * Sinh đột biến từ DAG (§8.4) hoặc Sinh ra Paradigm (Material) Tự phát (Tech Tree GenAI).
     */
    protected function processMutations(Universe $universe, array $metrics): void
    {
        $ipScore = $metrics['ip_score'] ?? 0;
        
        $activeInstances = $universe->materialInstances()
            ->with('material')
            ->where('lifecycle', Material::LIFECYCLE_ACTIVE)
            ->get();

        // 1. EMERGENT PARADIGM SHIFT (GEN AI)
        // Khi innovation (ip_score) cực lớn, tỉ lệ cực nhỏ bypass hardcode mutation để GenAI tự sáng chế Material mới.
        if ($ipScore > 0.9) {
            $prng = clone \App\Services\Simulation\SimulationPRNG::forUniverse($universe);
            if ($prng->nextInt(0, 100) < 5) { // 5% chance per tick at high innovation
                $this->triggerGenAiSynthesis($universe, $activeInstances);
                return; // Stop processing predefined mutations to let the new paradigm take root
            }
        }
        
        // 2. NORMAL PREDEFINED MUTATIONS
        if ($ipScore > 0.7) {
            foreach ($activeInstances as $instance) {
                if (!$instance->material) continue;
                $possibleMutations = MaterialMutation::where('parent_material_id', $instance->material_id)
                    ->whereDoesntHave('childMaterial.instances', function ($q) use ($universe) {
                        $q->where('universe_id', $universe->id);
                    })
                    ->with('childMaterial')
                    ->get();

                foreach ($possibleMutations as $mutation) {
                    $childMaterial = $mutation->childMaterial ?? null;
                    if (!$childMaterial) continue;
                    // 20% chance to discover child material per high-IP tick
                    $prng = clone \App\Services\Simulation\SimulationPRNG::forUniverse($universe);
                    if ($prng->nextInt(0, 100) < 20) {
                        $universe->materialInstances()->create([
                            'material_id' => $mutation->child_material_id,
                            'lifecycle' => Material::LIFECYCLE_DORMANT,
                            'context' => ['origin_parent' => $instance->id],
                        ]);
                        Log::info("Mutation Discovered: {$childMaterial->name} from " . ($instance->material?->name ?? 'unknown'));
                    }
                }
            }
        }
    }

    protected function triggerGenAiSynthesis(Universe $universe, $activeInstances): void
    {
        $activeMaterials = $activeInstances->pluck('material.name')->filter()->unique()->values()->toArray();
        $stateVector = is_string($universe->state_vector) ? json_decode($universe->state_vector, true) : (array)($universe->state_vector ?? []);
        $scars = $stateVector['meta']['historical_scars'] ?? [];
        $scarNames = array_keys(is_array($scars) ? $scars : []);

        Log::info("MaterialEvolutionEngine: Calling GenAI for Emergent Paradigm Shift (Universe {$universe->id})");
        
        $newMaterialData = $this->synthesisService->synthesize($universe, $activeMaterials, $scarNames);

        if ($newMaterialData) {
            $material = Material::create([
                'name' => $newMaterialData['name'],
                'slug' => \Illuminate\Support\Str::slug($newMaterialData['name']) . '-' . uniqid(),
                'description' => $newMaterialData['description'],
                'ontology' => in_array($newMaterialData['ontology'] ?? '', [Material::ONTOLOGY_PHYSICAL, Material::ONTOLOGY_INSTITUTIONAL, Material::ONTOLOGY_SYMBOLIC, Material::ONTOLOGY_BEHAVIORAL]) ? $newMaterialData['ontology'] : Material::ONTOLOGY_PHYSICAL,
                'pressure_coefficients' => $newMaterialData['pressure_coefficients'] ?? [],
            ]);

            if (!empty($newMaterialData['parent_material_name'])) {
                $parent = Material::where('name', 'LIKE', '%' . $newMaterialData['parent_material_name'] . '%')->first();
                if ($parent) {
                    MaterialMutation::create([
                        'parent_material_id' => $parent->id,
                        'child_material_id' => $material->id,
                        'probability' => 1.0, 
                        'conditions' => []
                    ]);
                }
            }

            $universe->materialInstances()->create([
                'material_id' => $material->id,
                'lifecycle' => Material::LIFECYCLE_DORMANT,
                'context' => ['origin' => 'llm_emergent_synthesis'],
            ]);

            Log::alert("EMERGENT PARADIGM SHIFT: Universe {$universe->id} discovered [{$material->name}] via GenAI!");
        }
    }
}
