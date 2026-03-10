<?php

namespace App\Actions\Simulation;

use App\Models\BranchEvent;
use App\Models\Chronicle;
use App\Models\Universe;
use Illuminate\Support\Collection;

class GetUniverseActorsAction
{
    /**
     * Lấy danh sách toàn bộ Actor đã từng xuất hiện trong Universe.
     * Trích xuất từ BranchEvent và Chronicles.
     */
    public function execute(int $universeId): Collection
    {
        return \App\Models\Actor::with('supremeEntity')
            ->where('universe_id', $universeId)
            ->orderBy('is_alive', 'desc') // Alive first
            ->orderBy('id', 'desc')
            ->get();
    }
}
