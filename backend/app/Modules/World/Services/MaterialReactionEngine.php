<?php

namespace App\Modules\World\Services;

use App\Models\MaterialInstance;
use App\Models\MaterialReaction;
use App\Modules\Simulation\Core\Runtime\RuleVM\RuleVmService;
use App\Modules\Simulation\Core\Runtime\State\WorldState;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class MaterialReactionEngine
{
    public function __construct(
        private readonly RuleVmService $ruleVm,
        private readonly PressureResolver $pressureResolver
    ) {}

    /**
     * Tận dụng RuleVM để xử lý phản ứng vật chất quy mô lớn.
     */
    public function process(WorldState $state): void
    {
        $tick = (int) $state->get('tick', 0);
        $zones = $state->getZones();
        $reactions = MaterialReaction::all();

        // 1. Group instances by zone for performance
        $instancesByZone = MaterialInstance::all()->groupBy('zone_id');

        foreach ($zones as &$zone) {
            $zoneId = $zone['id'];
            $zoneInstances = $instancesByZone->get($zoneId, collect());
            
            if ($zoneInstances->isEmpty() && $tick % 10 !== 0) {
                // Skip empty zones unless it's a "spontaneous generation" tick
                continue;
            }

            foreach ($reactions as $reaction) {
                if ($this->shouldTrigger($zone, $zoneInstances, $reaction, $tick)) {
                    $this->applyReaction($zone, $zoneInstances, $reaction, $tick);
                }
            }
        }

        $state->setZones($zones);
    }

    /**
     * Kiểm tra điều kiện đầu vào và RuleVM DSL.
     */
    private function shouldTrigger(array $zone, Collection $instances, MaterialReaction $reaction, int $tick): bool
    {
        // 1. Check if all inputs are present in sufficient quantity
        $materialCounts = $instances->groupBy('material_slug')->map->count();
        foreach ($reaction->inputs as $slug => $requiredQty) {
            if (($materialCounts[$slug] ?? 0) < $requiredQty) {
                return false;
            }
        }

        // 2. Check Probability (Rate)
        if (mt_rand() / mt_getrandmax() > $reaction->rate) {
            return false;
        }

        // 3. Evaluate RuleVM DSL Condition
        if (!empty($reaction->condition)) {
            $rawState = $this->prepareRawState($zone, $tick);
            $result = $this->ruleVm->evaluateRaw($rawState, $reaction->condition);
            
            // Assume the DSL script emits a 'REACTION_TRIGGERED' event if conditions met
            $outputs = $result['outputs'] ?? [];
            $triggered = false;
            foreach ($outputs as $out) {
                if (($out['event_name'] ?? '') === 'REACTION_TRIGGERED') {
                    $triggered = true;
                    break;
                }
            }
            if (!$triggered) return false;
        }

        return true;
    }

    /**
     * Thực hiện phản ứng: Tiêu thụ đầu vào, sinh đầu ra, cập nhật năng lượng/entropy.
     */
    private function applyReaction(array &$zone, Collection $instances, MaterialReaction $reaction, int $tick): void
    {
        Log::info("Material Reaction Triggered", [
            'zone_id' => $zone['id'],
            'reaction' => $reaction->slug
        ]);

        // 1. Consume Inputs
        foreach ($reaction->inputs as $slug => $qty) {
            MaterialInstance::where('zone_id', $zone['id'])
                ->where('material_slug', $slug)
                ->limit($qty)
                ->delete();
        }

        // 2. Produce Outputs
        foreach ($reaction->outputs as $slug => $qty) {
            for ($i = 0; $i < $qty; $i++) {
                MaterialInstance::create([
                    'zone_id' => $zone['id'],
                    'material_slug' => $slug,
                    'stability' => 1.0,
                    'resonance_potential' => 0.1,
                ]);
            }
        }

        // 3. Update Zone Metrics (Conservation & Side-effects)
        $zone['state']['energy'] = max(0, ($zone['state']['energy'] ?? 0) - $reaction->energy_cost);
        $zone['state']['entropy'] = min(1.0, ($zone['state']['entropy'] ?? 0) + $reaction->entropy_produced);
        
        // Recalculate stress using PressureResolver
        $zone['state']['material_stress'] = $this->pressureResolver->resolve($zone, app(\App\Modules\Simulation\Core\Runtime\State\StateManager::class)->get());
    }

    private function prepareRawState(array $zone, int $tick): array
    {
        return array_merge($zone['state'] ?? [], [
            'tick' => $tick,
            'zone_id' => $zone['id'],
        ]);
    }
}
