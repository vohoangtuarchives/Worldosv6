<?php

namespace App\Actions\Simulation;

use App\Models\Universe;
use App\Models\Chronicle;
use App\Models\BranchEvent;
use App\Services\Simulation\WorldEdictEngine;

class InjectExternalShockAction
{
    public function __construct(
        protected WorldEdictEngine $edictEngine
    ) {}

    /**
     * Inject a high-intensity shock into a newly forked universe.
     */
    public function execute(Universe $universe, array $forkPayload): bool
    {
        $tick = $universe->current_tick;
        $reason = $forkPayload['reason'] ?? 'criticality_event';
        
        // Determine shock type based on reason or random
        $shockType = $this->determineShockType($reason);
        
        // 1. Apply immediate state impact (via Edict)
        $metrics = []; // We will inject into the next snapshot's metrics
        $this->edictEngine->activateEdict($universe, $tick, $metrics, $shockType['edict'], 'Ngoại Lực');

        // 2. Record the shock in Chronicle
        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'to_tick' => $tick,
            'type' => 'external_shock',
            'raw_payload' => [
                'action' => 'legacy_event',
                'description' => "CÚ SỐC NGOẠI LỰC: Một biến cố chấn động xảy ra ngay tại điểm phân tách. {$shockType['description']}"
            ],
        ]);

        // 3. Mark the branch event with the shock info
        BranchEvent::where('universe_id', $universe->id)
            ->where('event_type', 'fork')
            ->where('from_tick', $tick)
            ->update([
                'payload' => array_merge($forkPayload, ['external_shock' => $shockType['name']])
            ]);

        return true;
    }

    protected function determineShockType(string $reason): array
    {
        $shocks = [
            'high_entropy' => [
                'name' => 'Sự Sụp Đổ Của Trật Tự',
                'edict' => 'heavenly_tribulation',
                'description' => 'Sự hỗn loạn đạt đỉnh điểm, quét sạch các cấu trúc định chế cũ.'
            ],
            'low_stability' => [
                'name' => 'Kỷ Nguyên Hỗn Độn',
                'edict' => 'age_of_chaos',
                'description' => 'Lý trí lụi tàn, bản năng và nỗi sợ hãi trỗi dậy chiếm lĩnh.'
            ],
            'default' => [
                'name' => 'Thần Khải Bất Ngờ',
                'edict' => 'divine_inspiration',
                'description' => 'Một luồng tri thức thần bí xuất hiện, thúc đẩy sự đổi mới bùng nổ.'
            ]
        ];

        return $shocks[$reason] ?? $shocks['default'];
    }
}
