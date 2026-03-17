<?php
declare(strict_types=1);

namespace App\Simulation\Domain;

use App\Simulation\Runtime\State\WorldState;

/**
 * Result of a SimulationKernel::runTick() call.
 * Contains the final state and any events/causal links emitted by engines.
 */
final class SimulationTickResult
{
    public function __construct(
        public readonly WorldState $state,
        /** @var array<array|object> */
        public readonly array $events = [],
        /** @var array<string, int> */
        public readonly array $causalLinks = [],
        /** @var EngineExecutionRecord[] */
        public readonly array $engineMetrics = [],
    ) {
    }
}
