<?php

namespace App\Simulation\Engines\Social;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Runtime\State\WorldState;
use App\Simulation\Effects\WorldStateUpdateEffect;
use Illuminate\Support\Facades\DB;

/**
 * Production Chain Engine (Phase 10.3)
 * Converts raw materials (from active MaterialInstances) and economic surplus into industrial output.
 */
final class ProductionChainEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function name(): string { return 'production_chain'; }
    public function version(): string { return '1.0.0'; }
    public function priority(): int { return 19; } // Runs after FinanceEngine
    public function tickRate(): int { return (int) config('worldos.tick_pipeline.meta.interval', 10); }
    public function phase(): string { return 'economy'; }

    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        $tick = $ctx->getTick();
        $interval = (int) config('worldos.intelligence.economy_tick_interval', 20);
        if ($interval <= 0 || $tick % $interval !== 0) {
            return EngineResult::empty();
        }

        $zones = $state->get('zones', []);
        if (empty($zones)) {
            return EngineResult::empty();
        }

        $universeId = $ctx->getUniverseId();
        
        // Count active materials in the universe to form an abstract raw material index
        $activeMaterialsCount = DB::table('material_instances')
            ->where('universe_id', $universeId)
            ->where('lifecycle', 'ACTIVE')
            ->count();
            
        // The more active materials, the better the conversion rate from surplus to industrial output.
        // Every active material adds a 10% bonus to industrial efficiency.
        $materialBonus = 1.0 + ($activeMaterialsCount * 0.1);

        $productionState = $state->get('civilization.production', []);
        $zoneProduction = $productionState['zones'] ?? [];

        $totalIndustrialOutput = 0.0;

        foreach ($zones as $i => &$zone) {
            $economyState = $zone['state'] ?? [];
            $surplus = (float) ($economyState['economy_surplus'] ?? 0);
            
            // Industrial output generated from surplus * materials factor
            // Represents turning basic caloric/energetic surplus into manufactured wealth
            $industrialOutput = $surplus * $materialBonus * 0.5;

            $zprod = $zoneProduction[$i] ?? ['industrial_output' => 0.0];
            $currentOutput = (float)($zprod['industrial_output'] ?? 0);
            
            // Accumulate industrial manufactured capacity over time
            $newOutput = $currentOutput + $industrialOutput;
            
            $zprod['industrial_output'] = round($newOutput, 2);
            $totalIndustrialOutput += $newOutput;

            $zoneProduction[$i] = $zprod;
            
            // Decorate zone state for easy UI mapping
            $zone['state']['industrial_output'] = $zprod['industrial_output'];
        }

        $productionState = [
            'total_industrial_output' => round($totalIndustrialOutput, 2),
            'material_bonus_multiplier' => round($materialBonus, 2),
            'zones' => $zoneProduction,
            'updated_tick' => $tick,
        ];

        return new EngineResult([], [
            new WorldStateUpdateEffect([
                'civilization.production' => $productionState,
                'zones' => $zones
            ])
        ]);
    }
}
