<?php

namespace App\Modules\World\Services;

/**
 * PressureResolver: Resolve material pressure/stress across dimensions.
 */
class PressureResolver
{
    public function resolve(array $state): float
    {
        $entropy = (float)($state['entropy'] ?? 0);
        $stability = (float)($state['stability_index'] ?? 1);
        return ($entropy * 0.7) + ((1 - $stability) * 0.3);
    }
}
