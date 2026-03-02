<?php

namespace App\Actions\Simulation;

use App\Models\Universe;
use App\Models\World;

class GetMultiverseTreeAction
{
    /**
     * Lấy cấu trúc cây của toàn bộ Universe thuộc về một World.
     */
    public function execute(int $worldId): array
    {
        $universes = Universe::where('world_id', $worldId)
            ->select(['id', 'parent_universe_id as parent_id', 'name', 'current_tick', 'status'])
            ->get();

        // Fetch shocks from branch events
        $shocks = \App\Models\BranchEvent::whereIn('universe_id', $universes->pluck('id'))
            ->where('event_type', 'fork')
            ->get()
            ->pluck('payload.external_shock', 'universe_id');

        // Fetch interactions (resonance, convergence)
        $interactions = \App\Models\UniverseInteraction::whereIn('universe_a_id', $universes->pluck('id'))
            ->orWhereIn('universe_b_id', $universes->pluck('id'))
            ->get(['id', 'universe_a_id', 'universe_b_id', 'interaction_type', 'payload']);

        return [
            'tree' => $this->buildTree($universes, $shocks),
            'interactions' => $interactions
        ];
    }

    /**
     * Xây dựng cấu trúc cây lồng nhau từ danh sách phẳng.
     */
    protected function buildTree($universes, $shocks, $parentId = null): array
    {
        $branch = [];

        foreach ($universes as $universe) {
            if ($universe->parent_id == $parentId) {
                $children = $this->buildTree($universes, $shocks, $universe->id);
                
                $node = [
                    'id' => $universe->id,
                    'name' => $universe->name,
                    'tick' => $universe->current_tick,
                    'status' => $universe->status,
                    'shock' => $shocks[$universe->id] ?? null,
                ];

                if ($children) {
                    $node['children'] = $children;
                }

                $branch[] = $node;
            }
        }

        return $branch;
    }
}
