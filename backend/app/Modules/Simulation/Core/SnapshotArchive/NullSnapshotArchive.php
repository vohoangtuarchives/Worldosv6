<?php

namespace App\Modules\Simulation\Core\SnapshotArchive;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Modules\Simulation\Core\Contracts\SnapshotArchiveInterface;

final class NullSnapshotArchive implements SnapshotArchiveInterface
{
    public function archive(Universe $universe, UniverseSnapshot $snapshot): void
    {
        // no-op
    }
}

