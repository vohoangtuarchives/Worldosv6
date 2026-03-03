<?php

namespace App\Services\Simulation;

use App\Models\Universe;
use App\Models\InstitutionalEntity;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

use App\Models\UniverseSnapshot;

class DiplomacyEngine
{
    /**
     * Cập nhật quan hệ ngoại giao giữa các nền văn minh trong một vũ trụ.
     */
    public function process(Universe $universe, UniverseSnapshot $snapshot): void
    {
        $entities = InstitutionalEntity::where('universe_id', $universe->id)
            ->where('entity_type', 'CIVILIZATION')
            ->whereNull('collapsed_at_tick')
            ->get();

        if ($entities->count() < 2) {
            return;
        }

        $stateVector = $snapshot->state_vector ?? [];
        $relations = $stateVector['diplomacy'] ?? [];

        foreach ($entities as $i => $civA) {
            foreach ($entities as $j => $civB) {
                if ($i >= $j) continue;

                $this->updateRelation($universe, $snapshot, $civA, $civB, $relations);
            }
        }

        $stateVector['diplomacy'] = $relations;
        $snapshot->state_vector = $stateVector;
        $snapshot->save();
    }

    /**
     * Tính toán và cập nhật quan hệ giữa hai nền văn minh.
     */
    protected function updateRelation(Universe $universe, UniverseSnapshot $snapshot, InstitutionalEntity $civA, InstitutionalEntity $civB, array &$relations): void
    {
        $friction = $this->calculateFriction($civA->ideology_vector ?? [], $civB->ideology_vector ?? []);
        $status = $this->determineStatus($friction);
        
        $key = $this->getRelationKey($civA->id, $civB->id);
        $oldStatus = $relations[$key]['status'] ?? 'NEUTRAL';

        $relations[$key] = [
            'status' => $status,
            'friction' => $friction,
            'updated_at_tick' => $snapshot->tick,
            'participants' => [$civA->id, $civB->id]
        ];

        if ($status !== $oldStatus) {
            $this->triggerDiplomaticEvent($universe, (int)$snapshot->tick, $civA, $civB, $status, "Quan hệ thay đổi từ $oldStatus sang $status.");
        }
    }

    protected function getRelationKey(int $id1, int $id2): string
    {
        $ids = [$id1, $id2];
        sort($ids);
        return "rel_{$ids[0]}_{$ids[1]}";
    }

    protected function calculateFriction(array $v1, array $v2): float
    {
        if (empty($v1) || empty($v2)) return 0.5;

        $dist = 0;
        $keys = array_keys($v1);
        foreach ($keys as $key) {
            if (isset($v2[$key])) {
                $dist += pow($v1[$key] - $v2[$key], 2);
            }
        }
        
        $dist = sqrt($dist);
        // Normalize (max dist for 5 dims is ~2.23)
        return min(1.0, $dist / 1.5);
    }

    protected function determineStatus(float $friction): string
    {
        if ($friction > 0.85) return 'WAR';
        if ($friction > 0.7) return 'HOSTILE';
        if ($friction < 0.2) return 'ALLIANCE';
        if ($friction < 0.4) return 'FRIENDLY';
        return 'NEUTRAL';
    }

    protected function triggerDiplomaticEvent(Universe $universe, int $tick, InstitutionalEntity $a, InstitutionalEntity $b, string $type, string $content): void
    {
        \App\Models\Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'to_tick' => $tick,
            'type' => 'diplomacy',
            'content' => "NGOẠI GIAO ĐA VĂN MINH [$type]: $content"
        ]);

        Log::info("Diplomatic Event [$type]: $content");
    }
}
