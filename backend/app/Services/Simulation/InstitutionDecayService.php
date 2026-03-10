<?php

namespace App\Services\Simulation;

use App\Models\Chronicle;
use App\Models\InstitutionalEntity;
use App\Models\Universe;

/**
 * InstitutionDecayService — Phase 5.
 * Periodically reduce legitimacy/influence; set status declining/collapsed; Chronicle institution_collapse.
 */
class InstitutionDecayService
{
    public function process(Universe $universe, int $tick): void
    {
        $config = config('worldos.institution', []);
        $decayRate = (float) ($config['decay_rate'] ?? 0.005);

        InstitutionalEntity::where('universe_id', $universe->id)
            ->whereNull('collapsed_at_tick')
            ->get()
            ->each(function (InstitutionalEntity $inst) use ($tick, $decayRate) {
                $legitimacy = (float) $inst->legitimacy;
                $legitimacy = max(0.0, $legitimacy - $decayRate);
                $inst->legitimacy = $legitimacy;

                $status = $inst->status ?? 'emerging';
                if ($legitimacy <= 0.2 && $status !== 'collapsed') {
                    $inst->status = 'declining';
                }
                if ($legitimacy <= 0) {
                    $inst->status = 'collapsed';
                    $inst->collapsed_at_tick = $tick;
                    Chronicle::create([
                        'universe_id' => $inst->universe_id,
                        'actor_id' => $inst->founder_actor_id,
                        'from_tick' => $tick,
                        'to_tick' => $tick,
                        'type' => 'institution_collapse',
                        'importance' => 0.3,
                        'raw_payload' => [
                            'action' => 'legacy_event',
                            'description' => "Institution collapsed: {$inst->name}.",
                        ],
                    ]);
                }
                $inst->save();
            });
    }
}
