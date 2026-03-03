<?php

namespace App\Services\Simulation\Seeders;

use App\Contracts\Simulation\SeederInterface;
use App\Models\Universe;
use App\Models\Material;
use App\Models\MaterialInstance;
use App\Models\Chronicle;

class VietnameseHeritageSeeder implements SeederInterface
{
    public function supports(string $origin): bool
    {
        return strtolower($origin) === 'vietnamese';
    }

    public function seed(Universe $universe): void
    {
        $materials = [
            [
                'slug' => 'nong-nghiep-lua-nuoc',
                'name' => 'Nông nghiệp Lúa nước',
                'ontology' => 'institutional',
                'description' => 'Nền tảng của sự ổn định và cộng đồng làng xã.',
                'pressure' => ['order' => 0.2, 'growth' => 0.1, 'entropy' => 0.05]
            ],
            [
                'slug' => 'tho-cung-to-tien',
                'name' => 'Thờ cúng Tổ tiên',
                'ontology' => 'symbolic',
                'description' => 'Sợi dây liên kết tâm linh xuyên thế hệ.',
                'pressure' => ['order' => 0.3, 'innovation' => -0.1, 'stability' => 0.1]
            ],
            [
                'slug' => 'lang-xa-tu-tri',
                'name' => 'Làng xã Tự trị',
                'ontology' => 'institutional',
                'description' => 'Tính tự quản cao của các đơn vị hành chính nhỏ.',
                'pressure' => ['order' => -0.1, 'stability' => 0.2, 'resistance' => 0.1]
            ]
        ];

        foreach ($materials as $m) {
            $model = Material::firstOrCreate(
                ['slug' => $m['slug']],
                [
                    'name' => $m['name'],
                    'ontology' => $m['ontology'],
                    'description' => $m['description'],
                    'pressure_coefficients' => $m['pressure']
                ]
            );

            MaterialInstance::create([
                'universe_id' => $universe->id,
                'material_id' => $model->id,
                'lifecycle' => 'active',
                'context' => [
                    'location' => ['x' => 0, 'y' => 0, 'z' => 0],
                    'quantity' => 100,
                    'origin' => 'Vietnamese'
                ]
            ]);
        }

        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => 0,
            'to_tick' => 0,
            'type' => 'myth',
            'content' => 'Hạt giống của văn minh Lạc Việt đã được gieo xuống, mang theo hơi thở của đất và hồn của tổ tiên.'
        ]);
    }
}
