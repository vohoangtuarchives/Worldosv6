<?php

namespace App\Actions\Simulation;

use App\Models\Demiurge;
use App\Models\LegendaryAgent;
use App\Models\Universe;
use App\Models\Chronicle;
use App\Services\Simulation\CelestialAntibodyEngine;
use Illuminate\Support\Facades\Log;

/**
 * DivineInquisitionAction: Demiurges hunt down heretics (§V23).
 * Represents active warfare between the Gods and self-aware Agents.
 */
class DivineInquisitionAction
{
    public function __construct(
        protected CelestialAntibodyEngine $antibodyEngine
    ) {}

    /**
     * Demiurge expends Essence to force an Inquisition in a world.
     */
    public function execute(Universe $universe, Demiurge $demiurge): void
    {
        $cost = 50.0; // Essence cost to trigger a targeted inquisition

        if ($demiurge->essence_pool < $cost) {
            Log::warning("DIVINE INQUISITION: Demiurge #{$demiurge->id} lacks essence ({$demiurge->essence_pool} < {$cost}) to trigger Inquisition.");
            return;
        }

        // Consume Essence
        $demiurge->decrement('essence_pool', $cost);

        // Find targets (agents with heresy > 0, doesn't need to be critical yet)
        $targets = LegendaryAgent::where('universe_id', $universe->id)
            ->where('heresy_score', '>', 0)
            ->get();

        if ($targets->isEmpty()) {
            // Wasted effort
            Chronicle::create([
                'universe_id' => $universe->id,
                'from_tick' => $universe->current_tick,
                'to_tick' => $universe->current_tick,
                'type' => 'divine_inquisition',
                'raw_payload' => [
                'action' => 'legacy_event',
                'description' => "TÒA ÁN TỐI CAO: Demiurge [{$demiurge->name}] đã càn quét vũ trụ nhưng không tìm thấy mầm mống dị giáo nào."
            ],
            ]);
            return;
        }

        foreach ($targets as $target) {
            // Forcefully spike their heresy to critical levels to trigger the Antibody Engine immediately
            $target->update(['heresy_score' => 1.0]);
            
            Chronicle::create([
                'universe_id' => $universe->id,
                'from_tick' => $universe->current_tick,
                'to_tick' => $universe->current_tick,
                'type' => 'divine_inquisition',
                'raw_payload' => [
                'action' => 'legacy_event',
                'description' => "TÒA ÁN TỐI CAO: Demiurge [{$demiurge->name}] đã chỉ đích danh [{$target->name}] là Dị giáo. Ánh sáng Trừng phạt bắt đầu giáng xuống."
            ],
            ]);

            // Immediately call the Purge
            $this->antibodyEngine->execute($universe);
        }

        Log::info("WAR IN HEAVEN: Demiurge #{$demiurge->id} executed a Divine Inquisition in Universe #{$universe->id}, purging {$targets->count()} agents.");
    }
}
