<?php

namespace App\Actions\Simulation;

use App\Models\Demiurge;
use App\Models\LegendaryAgent;
use Illuminate\Support\Facades\Log;

/**
 * EmpowerDemiurgesAction: Scales Divine Power based on followers (§V16).
 * 'will_power' determines the frequency and impact of autonomous edicts.
 */
class EmpowerDemiurgesAction
{
    /**
     * Recalculate will_power for all active Demiurges.
     */
    public function execute(): void
    {
        $demiurges = Demiurge::all();

        foreach ($demiurges as $demiurge) {
            $followersCount = LegendaryAgent::where('alignment_id', $demiurge->id)->count();
            
            // Base power 100 + 50 per legend
            $newPower = 100 + ($followersCount * 50);
            
            $demiurge->update(['will_power' => $newPower]);
            
            Log::info("PAN-MULTIVERSE: Demiurge [{$demiurge->name}] now has Will Power: {$newPower} (Followers: {$followersCount})");
        }
    }
}
