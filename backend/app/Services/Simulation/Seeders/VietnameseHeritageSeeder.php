<?php

namespace App\Services\Simulation\Seeders;

use App\Contracts\Simulation\SeederInterface;
use App\Models\Universe;
use App\Models\Material;
use App\Models\MaterialInstance;
use App\Models\MaterialMutation;
use App\Models\Chronicle;

class VietnameseHeritageSeeder implements SeederInterface
{
    public function supports(string $origin): bool
    {
        return strtolower($origin) === 'vietnamese';
    }

    public function seed(Universe $universe): void
    {
        // 1. Core Materials
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
                'slug' => 'thuy-loi-so-khai',
                'name' => 'Thủy lợi Sơ khai',
                'ontology' => 'physical',
                'description' => 'Hệ thống đê điều và kênh rạch buổi đầu.',
                'pressure' => ['order' => 0.1, 'growth' => 0.2, 'entropy' => 0.1]
            ]
        ];

        $materialModels = [];
        foreach ($materials as $m) {
            $model = Material::firstOrCreate(
                ['slug' => $m['slug']],
                [
                    'name' => $m['name'],
                    'ontology' => $m['ontology'],
                    'description' => $m['description'],
                    'pressure_coefficients' => $m['pressure'],
                    'lifecycle' => 'dormant'
                ]
            );
            $materialModels[$m['slug']] = $model;
        }

        // 2. Initial Instances (Starting materials are Active)
        $startingSlugs = ['nong-nghiep-lua-nuoc', 'tho-cung-to-tien'];
        foreach ($startingSlugs as $slug) {
            MaterialInstance::create([
                'universe_id' => $universe->id,
                'material_id' => $materialModels[$slug]->id,
                'lifecycle' => 'active',
                'context' => ['origin' => 'Vietnamese']
            ]);
        }

        // 3. Mutation DAG (§8.4)
        // Nong nghiep lua nuoc -> Thuy loi so khai
        MaterialMutation::firstOrCreate([
            'parent_material_id' => $materialModels['nong-nghiep-lua-nuoc']->id,
            'child_material_id' => $materialModels['thuy-loi-so-khai']->id,
        ], [
            'trigger_condition' => 'ip_score > 0.5',
            'context_constraint' => ['origin' => 'Vietnamese']
        ]);

        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => 0,
            'to_tick' => 0,
            'type' => 'myth',
            'content' => 'Hạt giống của văn minh Lạc Việt đã được gieo xuống, mang theo hơi thở của đất và hồn của tổ tiên.'
        ]);
    }
}
