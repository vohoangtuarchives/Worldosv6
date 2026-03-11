<?php

namespace App\Simulation\Runtime\Stages;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Runtime\Contracts\SimulationStageInterface;
use App\Modules\Intelligence\Services\CultureEngine;

/**
 * Culture stage: meme transmission, drift, culture_group (Tier 7). Feeds behavior.
 */
final class CultureStage implements SimulationStageInterface
{
    public function __construct(
        protected CultureEngine $cultureEngine
    ) {}

    public function run(Universe $universe, int $tick, ?UniverseSnapshot $savedSnapshot = null, array $context = []): void
    {
        $this->cultureEngine->evaluate($universe, $tick);
    }
}
