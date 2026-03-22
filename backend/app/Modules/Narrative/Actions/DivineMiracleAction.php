<?php

namespace App\Modules\Narrative\Actions;

use App\Modules\Narrative\Models\Demiurge;
use App\Modules\Simulation\Models\Universe;
use App\Modules\Narrative\Models\Chronicle;
use App\Modules\Narrative\Actions\CelestialEngineeringAction;
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
        // Deprecated or Bridge if needed
    }

    public function executeWithState(Demiurge $demiurge, \App\Modules\Simulation\Core\Runtime\State\WorldState $state, string $type, int $tick): void
    {
        $cost = $this->getMiracleCost($type);

        if ($demiurge->essence_pool < $cost) {
            Log::info("MYTHOS: Demiurge [{$demiurge->name}] failed to manifest miracle [{$type}]. Insufficient Essence.");
            return;
        }

        $demiurge->decrement('essence_pool', $cost);
        $this->manifestToState($demiurge, $state, $type, $tick);
    }

    protected function manifestToState(Demiurge $demiurge, \App\Modules\Simulation\Core\Runtime\State\WorldState $state, string $type, int $tick): void
    {
        Log::warning("MIRACLE: Demiurge [{$demiurge->name}] has manifested [{$type}] in Universe #{$state->get('universe_id')} via Manifold!");

        $sciImpact = 0.0;
        $entropyImpact = 0.0;

        switch ($type) {
            case 'absolute_order':
                $sciImpact = 0.5;
                $entropyImpact = -0.5;
                break;
            case 'void_eruption':
                $sciImpact = -0.3;
                $entropyImpact = 0.6;
                break;
            case 'legendary_ascension':
                $sciImpact = 0.2;
                $entropyImpact = -0.1;
                break;
        }

        // Apply impacts to the manifold fields
        $state->set('entropy', max(0, min(2, (float)$state->get('entropy', 0.5) + $entropyImpact)));
        $state->set('structural_coherence', max(0, min(1, (float)$state->get('structural_coherence', 0.5) + $sciImpact)));

        // Phase 47: Emit event for DSL/Chronicle to capture
        $state->set('meta.last_miracle', [
            'type' => $type,
            'demiurge' => $demiurge->name,
            'tick' => $tick
        ]);
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

        $this->engineering->executeMacro($universe->world_id, 'macro_edict', $payload, $universe);

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



