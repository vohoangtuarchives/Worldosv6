<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Models\MaterialInstance;
use App\Models\MaterialMutation;
use App\Models\Universe;
use Illuminate\Http\Request;

class MaterialMutationController extends Controller
{
    /**
     * Get the Material Mutation DAG (nodes and edges) for a specific universe.
     * This will return ALL base materials, instances specific to this universe, and all mutations.
     */
    public function getDagData(int $universeId)
    {
        $universe = Universe::findOrFail($universeId);

        // Fetch all materials (this is our base dictionary)
        $materials = Material::select('id', 'name', 'slug', 'ontology', 'description')->get();


        // Fetch instances for this universe to see which ones are Active/Dormant in THIS universe
        $instances = MaterialInstance::where('universe_id', $universe->id)->get();
        
        // Map instance states by material_id
        $instanceStates = $instances->keyBy('material_id')->map(function ($inst) {
            return [
                'lifecycle' => $inst->lifecycle,
                'quantity' => $inst->quantity ?? 0,
            ];
        });

        // Build nodes
        $nodes = $materials->map(function ($mat) use ($instanceStates) {
            $state = $instanceStates->get($mat->id);
            return [
                'id' => (string) $mat->id,
                'position' => ['x' => 0, 'y' => 0], // Position will be handled by Dagre on frontend
                'data' => [
                    'label' => $mat->name,
                    'ontology' => $mat->ontology,
                    'culture' => $mat->ontology === 'institutional' ? 'Imperial' : ($mat->ontology === 'symbolic' ? 'Mystic' : 'Common'),
                    'lifecycle' => $state ? $state['lifecycle'] : 'dormant', // Default to dormant if not instanced
                    'description' => $mat->description,
                ],
                'type' => 'materialNode',
            ];
        });

        // Fetch all mutations (edges)
        $mutations = MaterialMutation::all();
        $edges = $mutations->map(function ($mut) {
            return [
                'id' => 'e' . $mut->parent_material_id . '-' . $mut->child_material_id,
                'source' => (string) $mut->parent_material_id,
                'target' => (string) $mut->child_material_id,
                'label' => $mut->trigger_condition, // Can be used as edge label
                'animated' => true,
            ];
        });

        return response()->json([
            'ok' => true,
            'nodes' => $nodes,
            'edges' => $edges,
        ]);
    }
}
