<?php

namespace App\Simulation\Engines\Social;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Models\Universe;
use Illuminate\Support\Facades\Log;

/**
 * Global Economy Engine (Tier 10).
 * Resource economy per settlement: production, storage, consumption. Simple market/trade proxy.
 * Reads state_vector['civilization']['settlements'], writes economy metrics per zone.
 */
class GlobalEconomyEngine implements \App\Simulation\Contracts\SimulationEngine
{
    use \App\Simulation\Concerns\DefaultSimulationEnginePhase;

    public function name(): string { return 'global_economy'; }
    public function priority(): int { return 10; }
    public function tickRate(): int { return (int) config('worldos.tick_pipeline.meta.interval', 10); }

    public function handle(\App\Simulation\Runtime\State\WorldState $state, \App\Simulation\Domain\TickContext $ctx): \App\Simulation\Domain\EngineResult
    {
        if (method_exists($this, 'runWithState')) {
            $this->runWithState($state, $ctx->getTick());
        } elseif (method_exists($this, 'evaluate')) {
            // Unlikely, but fallback
            $universe = \App\Models\Universe::find($ctx->getUniverseId());
            if ($universe) $this->evaluate($universe, $ctx->getTick());
        }
        return \App\Simulation\Domain\EngineResult::empty();
    }

    public function __construct(
        protected UniverseRepositoryInterface $universeRepository
    ) {}

    public function runWithState(\App\Simulation\Runtime\State\WorldState $state, int $currentTick): void
    {
        $interval = (int) config('worldos.intelligence.economy_tick_interval', 20);
        if ($interval <= 0 || $currentTick % $interval !== 0) {
            return;
        }

        $settlements = $state->get('civilization.settlements', []);
        if (empty($settlements)) {
            return;
        }

        $zones = $state->get('zones', []);
        if (!is_array($zones)) {
            return;
        }

        // 1. Thu thập dữ liệu từ Manifold (Causal Soul & Politics)
        $knowledge = (float)$state->get('fields.knowledge', 0.1);
        $complexity = (float)$state->get('fields.complexity', 0.1);
        $socialCohesion = (float)$state->get('civilization.politics.social_cohesion', 0.5);

        // 2. Hệ số sản xuất dựa trên Tri thức và Độ phức tạp
        $productionMultiplier = 1.0 + ($knowledge * 1.5) + ($complexity * 0.5);

        $totalSurplus = 0.0;
        $totalConsumption = 0.0;
        $zoneSurpluses = [];
        $numZones = count($settlements);
        
        foreach ($settlements as $zoneIndex => $settlement) {
            $pop = (int) ($settlement['population'] ?? 0);
            
            // Tính toán sản lượng gốc điều chỉnh theo Multiplier
            $baseSurplus = (float) ($settlement['resource_surplus'] ?? 0);
            $surplus = $baseSurplus * $productionMultiplier;
            
            $consumption = $pop * 0.3;
            $totalSurplus += $surplus;
            $totalConsumption += $consumption;
            $zoneSurpluses[(int) $zoneIndex] = $surplus;
            
            if (isset($zones[$zoneIndex]['state']) && is_array($zones[$zoneIndex]['state'])) {
                $zones[$zoneIndex]['state']['economy_consumption'] = round($consumption, 2);
                $zones[$zoneIndex]['state']['economy_surplus'] = round($surplus, 2);
                $zones[$zoneIndex]['state']['production_multiplier'] = round($productionMultiplier, 2);
            }
        }

        // 3. Trade Flow dựa trên Social Cohesion (Sự gắn kết xã hội)
        $tradeFlow = $this->computeTradeFlow($totalSurplus, $totalConsumption, $zoneSurpluses, $numZones, $socialCohesion);
        $hubScores = $this->computeHubScores($zoneSurpluses, $totalSurplus, $numZones);

        $state->set('civilization.economy', array_merge($state->get('civilization.economy', []), [
            'total_surplus' => round($totalSurplus, 2),
            'total_consumption' => round($totalConsumption, 2),
            'trade_flow' => round($tradeFlow, 4),
            'trade_efficiency' => round($socialCohesion, 4),
            'hub_scores' => $hubScores,
            'updated_tick' => $currentTick,
        ]));
        $state->set('zones', $zones);
        
        $universeId = (int) $state->get('universe_id');
        Log::debug("GlobalEconomyEngine: Universe {$universeId} economy updated at tick {$currentTick}");
    }

    public function evaluate(Universe $universe, int $currentTick): void
    {
        // Deprecated
    }

    /** Doc §16: trade flow ≈ route_capacity × supply × demand (aggregate proxy). */
    private function computeTradeFlow(float $totalSurplus, float $totalConsumption, array $zoneSurpluses, int $numZones): float
    {
        $routeCapacity = min(1.0, $numZones > 0 ? (float) config('worldos.economy.trade_route_capacity_factor', 0.5) * $numZones : 0);
        $supply = max(0.01, $totalSurplus);
        $demand = max(0.01, $totalConsumption);
        return $routeCapacity * min($supply, $demand) * (1.0 + min($supply, $demand) / max($supply, $demand));
    }

    /** Doc §16: hub_score per zone (connectivity + surplus share). */
    private function computeHubScores(array $zoneSurpluses, float $totalSurplus, int $numZones): array
    {
        $connectivityFactor = (float) config('worldos.economy.hub_connectivity_factor', 0.3);
        $maxSurplus = max(0.01, $totalSurplus);
        $hubScores = [];
        foreach ($zoneSurpluses as $zoneIndex => $surplus) {
            $surplusShare = $surplus / $maxSurplus;
            $connectivity = $numZones > 1 ? ($numZones - 1) / (float) $numZones : 0;
            $hubScores[$zoneIndex] = round($surplusShare * (1.0 - $connectivityFactor) + $connectivityFactor * $connectivity, 4);
        }
        return $hubScores;
    }

    private function getStateVector(Universe $universe): array
    {
        $sv = $universe->state_vector;
        if (is_string($sv)) {
            $sv = json_decode($sv, true) ?? [];
        }
        return is_array($sv) ? $sv : [];
    }
}
