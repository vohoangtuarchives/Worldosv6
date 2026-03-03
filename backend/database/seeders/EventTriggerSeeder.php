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
            ],
            [
                'event_type' => 'secession',
                'name_template' => 'Ly khai tại {zone}',
                'prompt_fragment' => 'Sự khác biệt về ý thức hệ đã khiến {zone} tuyên bố độc lập.',
            ],
            [
                'event_type' => 'formation',
                'name_template' => 'Sự trỗi dậy của {institution}',
                'prompt_fragment' => 'Giữa lúc khủng hoảng, {institution} đã nổi lên như một ngọn hải đăng mới.',
            ],
            [
                'event_type' => 'collapse',
                'name_template' => 'Sụp đổ: {institution}',
                'prompt_fragment' => 'Định chế {institution} đã tan rã, để lại một khoảng trống quyền lực lớn.',
            ],
            [
                'event_type' => 'myth_scar',
                'name_template' => 'Di chứng Thần thoại: {scar}',
                'prompt_fragment' => 'Dòng chảy lịch sử bị bẻ cong bởi sẹo thần thoại {scar}.',
            ],
        ];

        foreach ($data as $row) {
            DB::table('event_triggers')->updateOrInsert(
                ['event_type' => $row['event_type']],
                $row
            );
        }
    }
}
