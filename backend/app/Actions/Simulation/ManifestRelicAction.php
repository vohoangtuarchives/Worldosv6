<?php

namespace App\Actions\Simulation;

use App\Models\Universe;
use App\Models\ExtradimensionalRelic;
use App\Models\Chronicle;
use App\Models\BranchEvent;
use Illuminate\Support\Facades\Log;

class ManifestRelicAction
{
    /**
     * Kết tinh một huyền thoại thành cổ vật thực tại.
     */
    public function execute(Universe $universe, int $tick, array $relicData): ExtradimensionalRelic
    {
        // 1. Khởi tạo cổ vật (Legendary Artifact)
        $relic = ExtradimensionalRelic::create([
            'world_id' => $universe->world_id,
            'origin_universe_id' => $universe->id,
            'name' => $relicData['name'],
            'rarity' => $relicData['rarity'],
            'description' => $relicData['description'],
            'power_vector' => $relicData['power_vector'],
            'metadata' => array_merge($relicData['metadata'] ?? [], [
                'manifested_at_tick' => $tick,
                'is_narrative_gem' => true
            ])
        ]);

        // 2. Sử gia ghi chép lại huyền thoại khởi nguồn (Origin Myth)
        $narrative = $this->generateNarrative($relic, $universe);
        
        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'to_tick' => $tick,
            'type' => 'relic_discovery',
            'content' => $narrative,
            'perceived_archive_snapshot' => [
                'relic_name' => $relic->name,
                'relic_rarity' => $relic->rarity,
                'power' => $relic->power_vector
            ]
        ]);

        // 3. Phát động sự kiện rẽ nhánh (Gây chấn động thực tại)
        BranchEvent::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'event_type' => 'relic_manifestation',
            'payload' => [
                'relic_id' => $relic->id,
                'summary' => "Huyền thoại [{$relic->name}] đã kết tinh thành thực thể vật lý.",
                'narrative' => $narrative
            ],
        ]);

        Log::info("Relic Manifested: [{$relic->name}] in Universe {$universe->id}");

        return $relic;
    }

    protected function generateNarrative(ExtradimensionalRelic $relic, Universe $universe): string
    {
        $rarityLabel = strtoupper($relic->rarity);
        return "BIÊN NIÊN SỬ CỔ VẬT: Giữa những biến động của vũ trụ [{$universe->name}], một sự kiện bất hủ đã xảy ra. " .
               "Những dư âm của thực tại đã kết tụ lại tại điểm nứt gãy của Hư Không, tạo nên bảo vật [{$relic->name}] ({$rarityLabel}). " .
               "Sử gia ghi nhận: {$relic->description}";
    }
}
