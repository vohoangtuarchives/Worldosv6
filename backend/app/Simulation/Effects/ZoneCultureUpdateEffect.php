<?php

namespace App\Simulation\Effects;

use App\Simulation\Contracts\Effect;
use App\Simulation\Domain\WorldStateMutable;

/**
 * Merges culture arrays into zone state (drift/diffusion result).
 * Does not replace zones; only updates zone['state']['culture'] or zone['culture'] per index.
 */
final class ZoneCultureUpdateEffect implements Effect
{
    /** @param array<int, array<string, float>> $zoneCultures zone index => culture key => value */
    public function __construct(
        private readonly array $zoneCultures,
    ) {
    }

    public function apply(WorldStateMutable $state): void
    {
        $zones = $state->getZones();
        foreach ($this->zoneCultures as $index => $culture) {
            if (!isset($zones[$index]) || !is_array($culture)) {
                continue;
            }
            if (!isset($zones[$index]['state']) || !is_array($zones[$index]['state'])) {
                $zones[$index]['state'] = [];
            }
            $zones[$index]['state']['culture'] = $culture;
        }
        $state->setZones($zones);
    }
}
