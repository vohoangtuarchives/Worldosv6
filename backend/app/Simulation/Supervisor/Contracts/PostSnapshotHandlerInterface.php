<?php

namespace App\Simulation\Supervisor\Contracts;

use App\Models\Universe;
use App\Models\UniverseSnapshot;

/**
 * Handler run after snapshot is persisted (LEVEL 7: cognitive, collapse, social, demographic, knowledge, civilization discovery, self-improving, rule VM).
 */
interface PostSnapshotHandlerInterface
{
    public function handle(Universe $universe, UniverseSnapshot $snapshot): void;
}
