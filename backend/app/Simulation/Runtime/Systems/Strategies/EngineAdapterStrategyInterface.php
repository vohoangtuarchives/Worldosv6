<?php

namespace App\Simulation\Runtime\Systems\Strategies;

use App\Simulation\Runtime\State\WorldState;
use App\Simulation\Runtime\Causality\ImpactReport;

/**
 * Interface cho Engine Adapter Strategy.
 */
interface EngineAdapterStrategyInterface
{
    /**
     * Kiểm tra xem engine có phù hợp với strategy này không.
     */
    public function canHandle(object $engine): bool;

    /**
     * Thực thi engine.
     */
    public function execute(object $engine, array $context, int $tick, WorldState $state, ImpactReport $report): void;
}
