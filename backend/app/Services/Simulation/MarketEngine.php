<?php

namespace App\Services\Simulation;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Models\Universe;
use App\Simulation\Events\WorldEventType;
use App\Events\Simulation\SimulationEventOccurred;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;

/**
 * Market layer: prices (food, optional energy) from surplus/consumption, stored in state_vector.economy.market.
 * Fires MARKET_CRASH / ECONOMIC_BOOM when thresholds crossed. Optional TRADE_ROUTE_ESTABLISHED.
 */
class MarketEngine
{
    public function __construct(
        protected UniverseRepositoryInterface $universeRepository
    ) {}

    public function runWithState(\App\Simulation\Runtime\State\WorldState $state, int $currentTick): void
    {
        $interval = (int) config('worldos.intelligence.economy_tick_interval', 20);
        if ($interval <= 0 || $currentTick % $interval !== 0) {
            return;
        }

        // 1. Thu thập dữ liệu từ Manifold (Causal Soul & Politics)
        $activeMyths = $state->get('meta.active_myths', []);
        $governanceType = $state->get('civilization.politics.governance_type', 'TRADITIONAL_POLITY');
        $socialCohesion = (float)$state->get('civilization.politics.social_cohesion', 0.5);

        $economy = $state->get('civilization.economy', []);
        $totalSurplus = (float) ($economy['total_surplus'] ?? 0);
        $totalConsumption = (float) ($economy['total_consumption'] ?? 0.01);
        $supply = max(0.01, $totalSurplus + $totalConsumption);

        // 2. Điều chỉnh Price Factor dựa trên yếu tố văn hóa/chính trị
        // Kỹ trị (Technocracy) giúp tối ưu hóa giá cả, giảm lạm phát ảo.
        $stabilityBonus = ($governanceType === 'TECHNOCRACY') ? 0.2 : 0.0;
        
        // Sức mạnh biểu tượng của huyền thoại có thể làm tăng giá trị kỳ vọng (Speculative value)
        $mythicPremium = array_reduce($activeMyths, fn($carry, $item) => $carry + ($item['symbolic_power'] ?? 0), 0) * 0.05;

        $priceBase = (float) config('worldos.market.food_price_base', 1.0);
        $priceMin = (float) config('worldos.market.food_price_min', 0.2);
        $priceMax = (float) config('worldos.market.food_price_max', 5.0);
        
        $demandFactor = ($totalConsumption / $supply) + $mythicPremium - $stabilityBonus;
        $priceFood = $priceBase * max(0.1, $demandFactor);
        $priceFood = max($priceMin, min($priceMax, round($priceFood, 4)));

        $priceEnergy = $this->computeEnergyPrice($state, $governanceType);

        $market = $state->get('economy.market', []);
        $previousPrice = (float) (($market['prices'] ?? [])['food'] ?? $priceBase);
        
        // Volatility tỷ lệ nghịch với Social Cohesion (Sự gắn kết xã hội)
        $volatilityBase = abs($priceFood - $previousPrice);
        $volatility = $volatilityBase * (1.1 - $socialCohesion);

        $prices = ['food' => $priceFood];
        if ($priceEnergy !== null) {
            $prices['energy'] = $priceEnergy;
        }
        
        $universeId = (int) $state->get('universe_id');

        $state->set('economy.market', [
            'prices' => $prices,
            'updated_tick' => $currentTick,
            'volatility' => round($volatility, 4),
            'market_trust' => round($socialCohesion, 4),
            'trade_route_emitted_at_tick' => (int) ($market['trade_route_emitted_at_tick'] ?? 0),
        ]);

        $crashThreshold = (float) config('worldos.market.crash_price_threshold', 0.4);
        $boomSurplusThreshold = (float) config('worldos.market.boom_surplus_threshold', 50.0);
        
        if ($previousPrice > $priceMin && $priceFood <= $priceMin + $crashThreshold) {
            Event::dispatch(new SimulationEventOccurred(
                $universeId,
                WorldEventType::MARKET_CRASH,
                $currentTick,
                ['price_food' => $priceFood, 'previous' => $previousPrice]
            ));
            Log::info("MarketEngine: MARKET_CRASH Universe {$universeId} tick {$currentTick}");
        }
        if ($totalSurplus >= $boomSurplusThreshold) {
            Event::dispatch(new SimulationEventOccurred(
                $universeId,
                WorldEventType::ECONOMIC_BOOM,
                $currentTick,
                ['total_surplus' => $totalSurplus, 'price_food' => $priceFood]
            ));
            Log::debug("MarketEngine: ECONOMIC_BOOM Universe {$universeId} tick {$currentTick}");
        }

        $this->maybeEmitTradeRouteEstablishedWithState($state, $currentTick);
        Log::debug("MarketEngine: Universe {$universeId} market updated at tick {$currentTick}");
    }

    public function evaluate(Universe $universe, int $currentTick): void
    {
        // Deprecated
    }

    /**
     * When at least one zone has surplus and another has deficit, emit TRADE_ROUTE_ESTABLISHED once.
     */
    private function maybeEmitTradeRouteEstablishedWithState(\App\Simulation\Runtime\State\WorldState $state, int $currentTick): void
    {
        if (! config('worldos.market.emit_trade_route_event', true)) {
            return;
        }

        $market = $state->get('economy.market', []);
        if ((int) ($market['trade_route_emitted_at_tick'] ?? 0) > 0) {
            return;
        }

        $settlements = $state->get('civilization.settlements', []);
        if (count($settlements) < 2) {
            return;
        }

        $hasSurplus = false;
        $hasDeficit = false;
        foreach ($settlements as $settlement) {
            $surplus = (float) ($settlement['resource_surplus'] ?? 0);
            $pop = (int) ($settlement['population'] ?? 0);
            $consumption = $pop * 0.3;
            if ($surplus > 0) {
                $hasSurplus = true;
            }
            if ($consumption > $surplus || $surplus < 0) {
                $hasDeficit = true;
            }
            if ($hasSurplus && $hasDeficit) {
                break;
            }
        }

        if (! $hasSurplus || ! $hasDeficit) {
            return;
        }

        $universeId = (int) $state->get('universe_id');
        Event::dispatch(new SimulationEventOccurred(
            $universeId,
            WorldEventType::TRADE_ROUTE_ESTABLISHED,
            $currentTick,
            ['zones_count' => count($settlements)]
        ));
        Log::info("MarketEngine: TRADE_ROUTE_ESTABLISHED Universe {$universeId} tick {$currentTick}");
        $market['trade_route_emitted_at_tick'] = $currentTick;
        $state->set('economy.market', $market);
    }

    /**
     * Energy price from cosmic_energy_pool scarcity.
     */
    private function computeEnergyPrice(\App\Simulation\Runtime\State\WorldState $state): ?float
    {
        $poolData = $state->get('cosmic_energy_pool', null);
        if (! is_array($poolData)) {
            return null;
        }
        $pool = (float) ($poolData['pool'] ?? 0);
        $poolMax = (float) config('worldos.power_economy.cosmic_pool_max', 100.0);
        if ($poolMax <= 0) {
            return null;
        }
        $scarcity = 1.0 - min(1.0, $pool / $poolMax);
        $base = (float) config('worldos.market.price_base_energy', 1.0);
        $min = (float) config('worldos.market.price_min_energy', 0.3);
        $max = (float) config('worldos.market.price_max_energy', 4.0);
        $price = $base * (1.0 + $scarcity);
        return round(max($min, min($max, $price)), 4);
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
