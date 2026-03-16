<?php

namespace App\Simulation\Runtime\Systems;

use App\Simulation\Runtime\Contracts\WorldSystemInterface;
use App\Simulation\Runtime\State\WorldState;
use App\Simulation\Runtime\Causality\ImpactReport;

/**
 * EngineSystemAdapter – Wraps legacy Engines that use run() method.
 * 
 * Allows high-level engines to be orchestrated by the WorldKernel.
 */
class EngineSystemAdapter implements WorldSystemInterface
{
    protected object $engine;

    public function __construct(object $engine)
    {
        $this->engine = $engine;
    }

    public function update(array $context, int $tick): ?ImpactReport
    {
        // Capture system metadata for reporting
        $report = new ImpactReport(get_class($this->engine), 'Hybrid', 'Legacy');

        // Legacy engines still need WorldState. We create a temporary one from context.
        $state = WorldState::fromArray($context);

        if (method_exists($this->engine, 'run')) {
            $this->engine->run($state, $tick);
        } elseif (method_exists($this->engine, 'update')) {
            $this->engine->update($state, $tick);
        }

        // Note: Scalar changes in $state won't propagate back automatically unless we implement merge.
        return null; 
    }
}
