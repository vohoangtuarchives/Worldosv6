<?php

namespace App\Services\Simulation;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Models\ExtradimensionalRelic;
use App\Models\Chronicle;
use App\Models\BranchEvent;
use Illuminate\Support\Facades\Log;

class VoidExplorationEngine
{
    protected array $relicPool = [
        [
            'name' => 'Mắt Thần Khởi Nguyên',
            'rarity' => 'mythic',
            'description' => 'Một thấu kính đa chiều cho phép nhìn thấu các dòng thời gian song song.',
            'power_vector' => ['innovation' => 1.5, 'order' => 1.2]
        ],
        [
            'name' => 'Mảnh Vỡ Hư Vô',
            'rarity' => 'legendary',
            'description' => 'Tàn tích của một vũ trụ đã sụp đổ, chứa đựng sức mạnh phân rã tối thượng.',
            'power_vector' => ['entropy' => 2.0, 'trauma' => 1.5]
        ],
        [
            'name' => 'Chuông Vĩnh Hằng',
            'rarity' => 'epic',
            'description' => 'Âm thanh của nó có thể ổn định các vết nứt không gian.',
            'power_vector' => ['stability' => 1.8, 'order' => 1.4]
        ],
        [
            'name' => 'Bản Đồ Đa Chiều',
            'rarity' => 'rare',
            'description' => 'Chỉ dẫn con đường an toàn qua các dòng Fork.',
            'power_vector' => ['complexity' => 1.3]
        ]
    ];

    public function __construct(
        protected \App\Actions\Simulation\ManifestRelicAction $manifestRelicAction
    ) {}

    /**
     * Khám phá Hư Không trong quá trình mô phỏng.
     */
    public function explore(Universe $universe, UniverseSnapshot $snapshot): void
    {
        $stateVector = $snapshot->state_vector ?? [];
        $entropy = $stateVector['entropy'] ?? 0;
        
        // Vết nứt Hư Không chỉ xuất hiện khi thực tại đủ hỗn loạn hoặc kỳ ảo
        $breachChance = ($entropy * 0.04) + 0.005;

        if (mt_rand(1, 1000) <= ($breachChance * 1000)) {
            $this->triggerVoidBreach($universe, $snapshot);
        }
    }

    protected function triggerVoidBreach(Universe $universe, UniverseSnapshot $snapshot): void
    {
        $tick = $snapshot->tick;
        
        // Xúc sắc định mệnh: 35% cơ hội kết tinh huyền thoại
        if (mt_rand(1, 100) <= 35) {
            $relicData = $this->relicPool[array_rand($this->relicPool)];
            $relicData['metadata'] = ['discovery_method' => 'void_breach'];
            
            $this->manifestRelicAction->execute($universe, $tick, $relicData);
        } else {
            $this->reportIncursion($universe, $tick);
        }
    }

    protected function reportIncursion(Universe $universe, int $tick): void
    {
        $flavors = [
            "Một cơn gió lạnh từ Hư Không thổi qua, làm rung chuyển nền tảng của thực tại.",
            "Tiếng thì thầm của các tà thần từ chiều không gian khác vọng lại qua vết nứt.",
            "Bóng tối tràn ra từ một lỗ hổng không gian, nhưng nhanh chóng tan biến."
        ];

        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'to_tick' => $tick,
            'type' => 'void_incursion',
            'content' => $flavors[array_rand($flavors)],
        ]);
    }
}
