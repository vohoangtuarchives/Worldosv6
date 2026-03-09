<?php

namespace App\Repositories;

use App\Contracts\Repositories\BranchEventRepositoryInterface;
use App\Models\BranchEvent;

class BranchEventRepository implements BranchEventRepositoryInterface
{
    public function existsFork(int $universeId, int $fromTick): bool
    {
        return BranchEvent::where('universe_id', $universeId)
            ->where('from_tick', $fromTick)
            ->where('event_type', 'fork')
            ->exists();
    }

    public function hasForkAsParent(int $universeId): bool
    {
        return BranchEvent::where('universe_id', $universeId)
            ->where('event_type', 'fork')
            ->exists();
    }
}
