<?php

namespace App\Repositories;

use App\Models\ExtradimensionalRelic;
use App\Models\World;
use Illuminate\Support\Collection;

class RelicRepository
{
    /**
     * Lấy danh sách các cổ vật (huyền thoại) của một thế giới.
     */
    public function getForWorld(int|World $world): Collection
    {
        $worldId = $world instanceof World ? $world->id : $world;
        
        return ExtradimensionalRelic::where('world_id', $worldId)
            ->with(['originUniverse'])
            ->orderByDesc('created_at')
            ->get();
    }

    /**
     * Tìm cổ vật theo ID với đầy đủ ngữ cảnh sử gia.
     */
    public function findWithNarrative(int $id): ?ExtradimensionalRelic
    {
        return ExtradimensionalRelic::with(['world', 'originUniverse'])->find($id);
    }
}
