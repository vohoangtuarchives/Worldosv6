<?php

namespace App\Simulation\Engines;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Runtime\State\WorldState;

/**
 * doc §8.5: Trade & Economy Engine stub. market price, trade route.
 */
/**
 * Trade & Economy Engine (Phase 45 Unified).
 * Simulates trade flows between zones based on wealth/power field gradients.
 */
final class TradeEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function name(): string { return 'trade'; }
    public function version(): string { return '1.0.0'; }
    public function priority(): int { return 17; }
    public function tickRate(): int { return 1; }
    public function phase(): string { return 'economy'; }

    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        $this->runWithState($state, $ctx->getTick());
        return EngineResult::empty();
    }

    public function runWithState(\App\Simulation\Runtime\State\WorldState $state, int $tick): void
    {
        $zones = $state->get('zones', []);
        if (count($zones) < 2) return;

        $fields = $state->getFields();
        $wealthField = (float) ($fields['wealth_field'] ?? 0.5);
        $powerField = (float) ($fields['power_field'] ?? 0.5);
        $entropy = (float) ($state->get('entropy', 0.5));

        // Aggregate trade volume from field intensities
        $baseTradeVolume = $wealthField * 100.0 * (1.1 - $entropy);
        
        $tradeFlows = [];
        $totalFlow = 0.0;

        foreach ($zones as $i => $zone) {
            $localWealth = (float) ($zone['fields']['wealth'] ?? 0.5);
            $localPower = (float) ($zone['fields']['power'] ?? 0.5);
            
            // Flow = Gradient between local and global field
            $outflow = max(0, ($localWealth - $wealthField) + ($localPower - $powerField)) * 10.0;
            $tradeFlows[$i] = round($outflow, 2);
            $totalFlow += $outflow;
            
            // Update local zone state
            $zones[$i]['state']['trade_outflow'] = round($outflow, 2);
        }

        $economy = $state->get('civilization.economy', []);
        $economy['trade_volume'] = round($totalFlow + $baseTradeVolume, 2);
        $economy['trade_updated_tick'] = $tick;

        $state->set('civilization.economy', $economy);
        $state->set('zones', $zones);
        
        \Illuminate\Support\Facades\Log::debug("TradeEngine: Tick {$tick}, Trade Volume: " . $economy['trade_volume']);
    }
}
