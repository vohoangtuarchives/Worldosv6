<?php

namespace App\Simulation\SnapshotArchive;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Contracts\SnapshotArchiveInterface;

final class NullSnapshotArchive implements SnapshotArchiveInterface
{
    public function archive(Universe $universe, UniverseSnapshot $snapshot): void
    {
        // no-op
    }
}
