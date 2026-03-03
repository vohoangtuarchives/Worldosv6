<?php

namespace App\Actions\Simulation;

use App\Models\Demiurge;
use App\Models\Universe;
use App\Models\Chronicle;
use App\Actions\Simulation\CelestialEngineeringAction;
use Illuminate\Support\Facades\Log;

/**
 * DivineMiracleAction: The peak of divine intervention (§V17).
 * Allows Demiurges to spend Essence for high-impact reality shifts.
 */
class DivineMiracleAction
{
    public function __construct(
        protected CelestialEngineeringAction $engineering
    ) {}

    /**
     * Execute a miracle if the Demiurge has enough essence.
     */
    public function execute(Demiurge $demiurge, Universe $universe, string $type): void
    {
        $cost = $this->getMiracleCost($type);

        if ($demiurge->essence_pool < $cost) {
            Log::info("MYTHOS: Demiurge [{$demiurge->name}] failed to manifest miracle [{$type}]. Insufficient Essence.");
            return;
        }

        $demiurge->decrement('essence_pool', $cost);
        $this->manifest($demiurge, $universe, $type);
    }

    protected function manifest(Demiurge $demiurge, Universe $universe, string $type): void
    {
        Log::warning("MIRACLE: Demiurge [{$demiurge->name}] has manifested [{$type}] in Universe #{$universe->id}!");

        $payload = [
            'name' => "Phép màu: " . $type . " (" . $demiurge->name . ")",
            'demiurge_id' => $demiurge->id,
            'is_miracle' => true,
        ];

        switch ($type) {
            case 'absolute_order':
                $payload['sci_impact'] = 0.5;
                $payload['entropy_impact'] = -0.5;
                break;
            case 'void_eruption':
                $payload['sci_impact'] = -0.3;
                $payload['entropy_impact'] = 0.6;
                break;
            case 'legendary_ascension':
                $payload['sci_impact'] = 0.2;
                $payload['entropy_impact'] = -0.1;
                // Imagine extra logic here for agents
                break;
        }

        $this->engineering->executeMacro($universe->world_id, 'macro_edict', $payload);

        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $universe->current_tick,
            'to_tick' => $universe->current_tick,
            'type' => 'divine_miracle',
            'raw_payload' => [
                'action' => 'legacy_event',
                'description' => "PHÉP MÀU THIÊN THỂ: {$demiurge->name} đã thi triển [{$type}], đảo lộn quy luật tự nhiên của thực tại."
            ],
        ]);
    }

    protected function getMiracleCost(string $type): float
    {
        $costs = [
            'absolute_order' => 50.0,
            'void_eruption' => 40.0,
            'legendary_ascension' => 30.0,
        ];
        return $costs[$type] ?? 100.0;
    }
}
