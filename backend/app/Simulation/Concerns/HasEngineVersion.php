<?php

namespace App\Simulation\Concerns;

/**
 * Default engine version for deterministic replay (Doc §26).
 */
trait HasEngineVersion
{
    public function version(): string
    {
        return '1.0.0';
    }
}
