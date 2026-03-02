<?php

namespace App\Services\Simulation;

use App\Models\Universe;
use App\Models\Material;
use App\Models\MaterialInstance;

class OriginSeeder
{
    /**
     * Tiêm DNA di sản vào vũ trụ dựa trên Origin của World.
     */
    public function seed(Universe $universe): void
    {
        $origin = $universe->world->origin;

        switch (strtolower($origin)) {
            case 'vietnamese':
                $this->seedVietnameseHeritage($universe);
                break;
            case 'western':
            case 'european':
                $this->seedWesternHeritage($universe);
                break;
            case 'eastern':
            case 'chinese':
                $this->seedEasternHeritage($universe);
                break;
            case 'futuristic':
                $this->seedFuturisticHeritage($universe);
                break;
            default:
                // Mặc định không làm gì hoặc tiêm các giá trị cơ bản
                break;
        }
    }

    protected function seedVietnameseHeritage(Universe $universe): void
    {
        // 1. Tạo các Material đặc trưng
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
                    'quantity' => 100,
                    'location' => ['x' => 0, 'y' => 0, 'z' => 0],
                    'origin' => 'Vietnamese'
                ]
            ]);
        }

        // 2. Ghi nhận vào Chronicle
        \App\Models\Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => 0,
            'to_tick' => 0,
            'type' => 'myth',
            'content' => 'Hạt giống của văn minh Lạc Việt đã được gieo xuống, mang theo hơi thở của đất và hồn của tổ tiên.'
        ]);
    }

    protected function seedWesternHeritage(Universe $universe): void
    {
        // 1. Tạo các Material đặc trưng
        $materials = [
            [
                'slug' => 'feudal-contract',
                'name' => 'Feudal Contract',
                'ontology' => 'institutional',
                'description' => 'A hierarchical system of land ownership and duties.',
                'pressure' => ['order' => 0.4, 'innovation' => -0.2, 'entropy' => -0.1]
            ],
            [
                'slug' => 'code-of-chivalry',
                'name' => 'Code of Chivalry',
                'ontology' => 'symbolic',
                'description' => 'Moral system which goes beyond rules of combat.',
                'pressure' => ['order' => 0.1, 'stability' => 0.3, 'growth' => -0.05]
            ],
            [
                'slug' => 'guild-system',
                'name' => 'Guild System',
                'ontology' => 'institutional',
                'description' => 'Association of artisans or merchants who control the practice of their craft.',
                'pressure' => ['growth' => 0.2, 'innovation' => 0.1, 'order' => 0.1]
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
                    'quantity' => 80,
                    'location' => ['x' => 10, 'y' => 10, 'z' => 0],
                    'origin' => 'Western'
                ]
            ]);
        }

        // 2. Ghi nhận vào Chronicle
        \App\Models\Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => 0,
            'to_tick' => 0,
            'type' => 'myth',
            'content' => 'The foundations of the Realm have been laid, bound by oath and iron.'
        ]);
    }

    protected function seedEasternHeritage(Universe $universe): void
    {
        $materials = [
            [
                'slug' => 'imperial-examination',
                'name' => 'Imperial Examination',
                'ontology' => 'institutional',
                'description' => 'Civil service examination system to select candidates for the state bureaucracy.',
                'pressure' => ['order' => 0.8, 'meritocracy' => 0.6]
            ],
            [
                'slug' => 'mandate-of-heaven',
                'name' => 'Mandate of Heaven',
                'ontology' => 'symbolic',
                'description' => 'The idea that there could be only one legitimate ruler of China at a time.',
                'pressure' => ['authority' => 1.0, 'stability' => 0.6]
            ],
            [
                'slug' => 'martial-arts-sects',
                'name' => 'Martial Arts Sects',
                'ontology' => 'institutional',
                'description' => 'Independent organizations of martial artists, often operating outside state law.',
                'pressure' => ['chaos' => 0.4, 'honor' => 0.5]
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
                    'quantity' => 90,
                    'location' => ['x' => 20, 'y' => 20, 'z' => 0],
                    'origin' => 'Eastern'
                ]
            ]);
        }

        \App\Models\Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => 0,
            'to_tick' => 0,
            'type' => 'myth',
            'content' => 'The Dragon has awoken, and the Mandate of Heaven is bestowed upon the worthy.'
        ]);
    }

    protected function seedFuturisticHeritage(Universe $universe): void
    {
        // 1. Tạo các Material đặc trưng
        $materials = [
            [
                'slug' => 'neural_link',
                'name' => 'Neural Link',
                'ontology' => 'physical',
                'description' => 'Direct brain-computer interface.',
                'pressure' => ['innovation' => 0.5, 'entropy' => 0.3, 'order' => -0.2]
            ],
            [
                'slug' => 'corporate_sovereignty',
                'name' => 'Corporate Sovereignty',
                'ontology' => 'institutional',
                'description' => 'Megacorporations replace nation-states.',
                'pressure' => ['growth' => 0.4, 'entropy' => 0.2, 'stability' => -0.1]
            ],
            [
                'slug' => 'synthetic_labor',
                'name' => 'Synthetic Labor',
                'ontology' => 'physical',
                'description' => 'Automated workforce replacing human labor.',
                'pressure' => ['growth' => 0.5, 'trauma' => 0.2, 'entropy' => 0.1]
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
                    'quantity' => 150,
                    'location' => ['x' => 50, 'y' => 50, 'z' => 10],
                    'origin' => 'Futuristic'
                ]
            ]);
        }

        // 2. Ghi nhận vào Chronicle
        \App\Models\Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => 0,
            'to_tick' => 0,
            'type' => 'myth',
            'content' => 'The Neon Genesis has begun, where chrome meets flesh in the eternal dance of data.'
        ]);
    }
}
