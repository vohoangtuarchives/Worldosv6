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

    public function evaluate(Universe $universe, int $currentTick): void
    {
        $interval = (int) config('worldos.intelligence.economy_tick_interval', 20);
        if ($interval <= 0 || $currentTick % $interval !== 0) {
            return;
        }

        $stateVector = $this->getStateVector($universe);
        if (config('worldos.simulation.rust_authoritative', false) && isset($stateVector['economy']['market'])) {
            return;
        }
        $civilization = $stateVector['civilization'] ?? null;
        $economy = $civilization['economy'] ?? null;
        $totalSurplus = (float) ($economy['total_surplus'] ?? 0);
        $totalConsumption = (float) ($economy['total_consumption'] ?? 0.01);
        $supply = max(0.01, $totalSurplus + $totalConsumption);

        $priceBase = (float) config('worldos.market.price_base_food', 1.0);
        $priceMin = (float) config('worldos.market.price_min_food', 0.2);
        $priceMax = (float) config('worldos.market.price_max_food', 5.0);
        $priceFactor = $totalConsumption / $supply;
        $priceFood = $priceBase * $priceFactor;
        $priceFood = max($priceMin, min($priceMax, round($priceFood, 4)));

        $priceEnergy = $this->computeEnergyPrice($stateVector);

        $market = $stateVector['economy']['market'] ?? [];
        $previousPrice = (float) (($market['prices'] ?? [])['food'] ?? $priceBase);
        $volatility = abs($priceFood - $previousPrice);

        $stateVector['economy'] = $stateVector['economy'] ?? [];
        $existingMarket = $stateVector['economy']['market'] ?? [];
        $prices = ['food' => $priceFood];
        if ($priceEnergy !== null) {
            $prices['energy'] = $priceEnergy;
        }
        $stateVector['economy']['market'] = [
            'prices' => $prices,
            'updated_tick' => $currentTick,
            'volatility' => round($volatility, 4),
            'trade_route_emitted_at_tick' => (int) ($existingMarket['trade_route_emitted_at_tick'] ?? 0),
        ];

        $crashThreshold = (float) config('worldos.market.crash_price_threshold', 0.4);
        $boomSurplusThreshold = (float) config('worldos.market.boom_surplus_threshold', 50.0);
        if ($previousPrice > $priceMin && $priceFood <= $priceMin + $crashThreshold) {
            Event::dispatch(new SimulationEventOccurred(
                (int) $universe->id,
                WorldEventType::MARKET_CRASH,
                $currentTick,
                ['price_food' => $priceFood, 'previous' => $previousPrice]
            ));
            Log::info("MarketEngine: MARKET_CRASH Universe {$universe->id} tick {$currentTick}");
        }
        if ($totalSurplus >= $boomSurplusThreshold) {
            Event::dispatch(new SimulationEventOccurred(
                (int) $universe->id,
                WorldEventType::ECONOMIC_BOOM,
                $currentTick,
                ['total_surplus' => $totalSurplus, 'price_food' => $priceFood]
            ));
            Log::debug("MarketEngine: ECONOMIC_BOOM Universe {$universe->id} tick {$currentTick}");
        }

        $this->maybeEmitTradeRouteEstablished($universe, $stateVector, $civilization, $currentTick);

        $this->universeRepository->update($universe->id, ['state_vector' => $stateVector]);
        Log::debug("MarketEngine: Universe {$universe->id} market updated at tick {$currentTick}");
    }

    /**
     * When at least one zone has surplus and another has deficit, emit TRADE_ROUTE_ESTABLISHED once.
     */
    private function maybeEmitTradeRouteEstablished(Universe $universe, array &$stateVector, ?array $civilization, int $currentTick): void
    {
        if (! config('worldos.market.emit_trade_route_event', true)) {
            return;
        }
        $market = &$stateVector['economy']['market'] ?? null;
        if ($market === null) {
            return;
        }
        if ((int) ($market['trade_route_emitted_at_tick'] ?? 0) > 0) {
            return;
        }
        $settlements = $civilization['settlements'] ?? [];
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
        Event::dispatch(new SimulationEventOccurred(
            (int) $universe->id,
            WorldEventType::TRADE_ROUTE_ESTABLISHED,
            $currentTick,
            ['zones_count' => count($settlements)]
        ));
        Log::info("MarketEngine: TRADE_ROUTE_ESTABLISHED Universe {$universe->id} tick {$currentTick}");
        $market['trade_route_emitted_at_tick'] = $currentTick;
    }

    /**
     * Energy price from cosmic_energy_pool scarcity (Laravel meta layer).
     * scarcity = 1 - (pool / pool_max); price = base * (1 + scarcity) clamped to [min, max].
     * Returns null when no cosmic_energy_pool or pool_max <= 0.
     */
    private function computeEnergyPrice(array $stateVector): ?float
    {
        $poolData = $stateVector['cosmic_energy_pool'] ?? null;
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
