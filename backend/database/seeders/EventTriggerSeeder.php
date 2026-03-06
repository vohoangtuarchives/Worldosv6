<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EventTriggerSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            [
                'event_type' => 'unrest',
                'name_template' => 'Làn sóng Bất ổn: {material}',
                'prompt_fragment' => 'Sự khan hiếm {material} đã đẩy quần chúng vào cơn phẫn nộ.',
                'threshold_rules' => null,
                'scope' => 'universe',
                'probability' => 0.2,
                'cooldown_ticks' => 10,
            ],
            [
                'event_type' => 'secession',
                'name_template' => 'Ly khai tại {zone}',
                'prompt_fragment' => 'Sự khác biệt về ý thức hệ đã khiến {zone} tuyên bố độc lập.',
                'threshold_rules' => null,
                'scope' => 'universe',
                'probability' => 0.2,
                'cooldown_ticks' => 10,
            ],
            [
                'event_type' => 'formation',
                'name_template' => 'Sự trỗi dậy của {institution}',
                'prompt_fragment' => 'Giữa lúc khủng hoảng, {institution} đã nổi lên như một ngọn hải đăng mới.',
                'threshold_rules' => null,
                'scope' => 'universe',
                'probability' => 0.2,
                'cooldown_ticks' => 10,
            ],
            [
                'event_type' => 'collapse',
                'name_template' => 'Sụp đổ: {institution}',
                'prompt_fragment' => 'Định chế {institution} đã tan rã, để lại một khoảng trống quyền lực lớn.',
                'threshold_rules' => null,
                'scope' => 'universe',
                'probability' => 0.2,
                'cooldown_ticks' => 10,
            ],
            [
                'event_type' => 'myth_scar',
                'name_template' => 'Di chứng Thần thoại: {scar}',
                'prompt_fragment' => 'Dòng chảy lịch sử bị bẻ cong bởi sẹo thần thoại {scar}.',
                'threshold_rules' => null,
                'scope' => 'universe',
                'probability' => 0.2,
                'cooldown_ticks' => 10,
            ],
            [
                'event_type' => 'crisis',
                'name_template' => 'Khủng hoảng',
                'prompt_fragment' => 'Entropy cao và ổn định thấp báo hiệu một giai đoạn khủng hoảng.',
                'threshold_rules' => [
                    ['key' => 'entropy', 'op' => '>=', 'value' => 0.6],
                    ['key' => 'stability_index', 'op' => '<=', 'value' => 0.5],
                ],
                'scope' => 'universe',
                'probability' => 0.2,
                'cooldown_ticks' => 20,
            ],
            [
                'event_type' => 'golden_age',
                'name_template' => 'Thời kỳ hoàng kim',
                'prompt_fragment' => 'Trật tự và ổn định tạo nên một thời đại hưng thịnh.',
                'threshold_rules' => [
                    ['key' => 'entropy', 'op' => '<=', 'value' => 0.4],
                    ['key' => 'stability_index', 'op' => '>=', 'value' => 0.6],
                ],
                'scope' => 'universe',
                'probability' => 0.18,
                'cooldown_ticks' => 25,
            ],
            [
                'event_type' => 'fork',
                'name_template' => 'Phân nhánh vũ trụ',
                'prompt_fragment' => 'Ngưỡng criticality vượt qua, vũ trụ phân nhánh tại điểm quyết định.',
                'threshold_rules' => [
                    ['key' => 'entropy', 'op' => '>=', 'value' => 0.8],
                ],
                'scope' => 'universe',
                'probability' => 0.15,
                'cooldown_ticks' => 30,
            ],
        ];

        foreach ($data as $row) {
            $insert = $row;
            if (isset($insert['threshold_rules']) && is_array($insert['threshold_rules'])) {
                $insert['threshold_rules'] = json_encode($insert['threshold_rules']);
            }
            DB::table('event_triggers')->updateOrInsert(
                ['event_type' => $row['event_type']],
                $insert
            );
        }
    }
}
