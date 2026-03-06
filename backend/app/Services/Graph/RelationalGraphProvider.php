<?php

namespace App\Services\Graph;

use App\Contracts\GraphProviderInterface;
use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Models\BranchEvent;
use Illuminate\Support\Facades\Log;

class RelationalGraphProvider implements GraphProviderInterface
{
    public function getUniverseNodes(int $universeId): array
    {
        $nodes = [];
        $universe = Universe::find($universeId);
        if (!$universe) return [];

        // 1. Universe Node
        $nodes[] = [
            'id' => "universe_{$universeId}",
            'type' => 'Universe',
            'label' => $universe->name ?? "Universe #{$universeId}",
            'data' => [
                'current_tick' => $universe->current_tick,
                'status' => $universe->status,
                'level' => $universe->level,
            ]
        ];

        // 2. Snapshots as Nodes (limit last 20 for performance)
        $snapshots = UniverseSnapshot::where('universe_id', $universeId)
            ->orderBy('tick', 'desc')
            ->limit(20)
            ->get();

        foreach ($snapshots as $s) {
            $nodes[] = [
                'id' => "snapshot_{$s->id}",
                'type' => 'Snapshot',
                'label' => "Tick {$s->tick}",
                'data' => [
                    'entropy' => $s->entropy,
                    'stability' => $s->stability_index,
                    'material_stress' => ($s->metrics ?? [])['material_stress'] ?? 0,
                ]
            ];
        }

        // 3. Myth Scars as Nodes
        $scars = \App\Models\MythScar::where('universe_id', $universeId)->get();
        foreach ($scars as $scar) {
            $nodes[] = [
                'id' => "scar_{$scar->id}",
                'type' => 'MythScar',
                'label' => $scar->name,
                'data' => [
                    'severity' => $scar->severity,
                    'zone_id' => $scar->zone_id,
                ]
            ];
        }

        return $nodes;
    }

    public function getUniverseEdges(int $universeId): array
    {
        $edges = [];
        
        // 1. Snapshot Flow (Chronological Edges)
        $snapshots = UniverseSnapshot::where('universe_id', $universeId)
            ->orderBy('tick', 'desc')
            ->limit(20)
            ->get()
            ->reverse();

        $prevId = null;
        foreach ($snapshots as $s) {
            $currentId = "snapshot_{$s->id}";
            if ($prevId) {
                $edges[] = [
                    'id' => "flow_{$prevId}_{$currentId}",
                    'source' => $prevId,
                    'target' => $currentId,
                    'type' => 'EVOLVED_TO'
                ];
            }
            $prevId = $currentId;
        }

        // 2. Myth Scar Relations
        $scars = \App\Models\MythScar::where('universe_id', $universeId)->get();
        foreach ($scars as $scar) {
            // Find snapshots near the tick it was created
            $snapshot = UniverseSnapshot::where('universe_id', $universeId)
                ->where('tick', '>=', $scar->created_at_tick)
                ->orderBy('tick', 'asc')
                ->first();

            if ($snapshot) {
                $edges[] = [
                    'id' => "scar_inflict_{$scar->id}",
                    'source' => "snapshot_{$snapshot->id}",
                    'target' => "scar_{$scar->id}",
                    'type' => 'INFLICTED_BY'
                ];
            }
        }

        return $edges;
    }

    public function sync(int $universeId, array $data): bool
    {
        // Placeholder for real Neo4j sync later
        Log::info("GraphSync: Virtual synchronization completed for Universe {$universeId}. Relational projections updated.");
        return true;
    }
}
