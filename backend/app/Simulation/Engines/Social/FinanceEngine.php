<?php

namespace App\Simulation\Engines\Social;

use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Runtime\State\WorldState;
use App\Simulation\Effects\WorldStateUpdateEffect;

/**
 * Finance Engine (Phase 10.3)
 * Handles credit, debt, inflation, and interest rates per zone based on economic surplus/consumption.
 */
final class FinanceEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    public function name(): string { return 'finance'; }
    public function version(): string { return '1.0.0'; }
    public function priority(): int { return 18; }
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

        $financeState = $state->get('civilization.finance', []);
        $zoneFinances = $financeState['zones'] ?? [];

        $totalCredit = 0.0;
        $totalDebt = 0.0;
        $globalSurplus = 0.0;

        $baseInterestRate = 0.05; // 5% base static interest per economy cycle

        foreach ($zones as $i => &$zone) {
            $economyState = $zone['state'] ?? [];
            $surplus = (float) ($economyState['economy_surplus'] ?? 0);
            $consumption = (float) ($economyState['economy_consumption'] ?? 0.01);
            
            $globalSurplus += $surplus;

            $netIncome = $surplus - $consumption;

            $zfin = $zoneFinances[$i] ?? ['credit' => 0.0, 'debt' => 0.0];
            $credit = (float)($zfin['credit'] ?? 0);
            $debt = (float)($zfin['debt'] ?? 0);

            // Apply interest to existing debt
            if ($debt > 0) {
                $debt *= (1.0 + $baseInterestRate);
            }

            if ($netIncome > 0) {
                // First pay off debt if we have net income
                if ($debt > 0) {
                    if ($netIncome >= $debt) {
                        $netIncome -= $debt;
                        $debt = 0;
                        $credit += $netIncome;
                    } else {
                        $debt -= $netIncome;
                    }
                } else {
                    $credit += $netIncome;
                }
            } else {
                // Shortfall -> take on debt
                $shortfall = abs($netIncome);
                if ($credit >= $shortfall) {
                    $credit -= $shortfall;
                } else {
                    $debt += ($shortfall - $credit);
                    $credit = 0;
                }
            }

            $zfin['credit'] = round($credit, 2);
            $zfin['debt'] = round($debt, 2);
            
            $totalCredit += $credit;
            $totalDebt += $debt;

            $zoneFinances[$i] = $zfin;
            
            // Store shortcut in zone state for UI mapping and integration
            $zone['state']['finance_credit'] = $zfin['credit'];
            $zone['state']['finance_debt'] = $zfin['debt'];
        }

        // Calculate Inflation
        // Simplistic inflation proxy: (Money Supply / Real Goods)
        $moneySupply = $totalCredit + $totalDebt;
        $realGoods = max(0.01, $globalSurplus);
        $inflationRate = ($moneySupply > 0) ? ($moneySupply / $realGoods) * 0.01 : 0.0;
        
        $inflationRate = min(5.0, round($inflationRate, 4));

        $financeState = [
            'total_credit' => round($totalCredit, 2),
            'total_debt' => round($totalDebt, 2),
            'global_interest_rate' => $baseInterestRate,
            'global_inflation_rate' => $inflationRate,
            'zones' => $zoneFinances,
            'updated_tick' => $tick,
        ];

        return new EngineResult([], [
            new WorldStateUpdateEffect([
                'civilization.finance' => $financeState,
                'zones' => $zones
            ])
        ]);
    }
}
