<?php

namespace App\Services\Simulation;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Models\SupremeEntity;
use App\Models\Chronicle;

class SupremeEntityEngine
{
    /**
     * Process supreme entities during a simulation tick.
     * Evaluates emergence of new entities and applies their impact on the universe metrics.
     */
    public function process(Universe $universe, UniverseSnapshot $snapshot): void
    {
        $metrics = is_string($snapshot->metrics) ? json_decode($snapshot->metrics, true) : ($snapshot->metrics ?? []);
        
        $this->evaluateEmergence($universe, $snapshot, $metrics);
        $this->evaluateAscendedHeroes($universe, $snapshot);
        $this->applyWorldImpact($universe, $snapshot, $metrics);
    }

    private function evaluateEmergence(Universe $universe, UniverseSnapshot $snapshot, array $metrics): void
    {
        $energyLevel = $metrics['energy_level'] ?? 0.5;
        $entropy = $snapshot->entropy ?? 0.5;
        $tick = $snapshot->tick;

        // 1. World Will (Thiên Đạo) -> High Energy, Low Entropy
        if ($energyLevel > 0.8 && $entropy < 0.25) {
            $hasWorldWill = SupremeEntity::where('universe_id', $universe->id)
                ->where('entity_type', 'world_will')
                ->where('status', 'active')
                ->exists();

            if (!$hasWorldWill && rand(1, 100) <= 5) { // 5% chance per tick if conditions met
                $this->spawnEntity($universe, $tick, [
                    'name' => 'Thiên Ý Nguyên Thủy',
                    'entity_type' => 'world_will',
                    'domain' => 'Trật Tự Tuyệt Đối',
                    'description' => 'Ý chí tập hợp của toàn bộ sinh linh và vạn vật trong vũ trụ, thức tỉnh để bảo vệ quy luật.',
                    'power_level' => 1.0,
                    'alignment' => ['spirituality' => 0.9, 'hardtech' => 0.1, 'entropy' => 0.0, 'energy_level' => 1.0]
                ]);
            }
        }

        // 2. Outer God (Tà Thần Ngoại Lai) -> Extremely High Entropy
        if ($entropy > 0.9) {
            $hasOuterGod = SupremeEntity::where('universe_id', $universe->id)
                ->where('entity_type', 'outer_god')
                ->where('status', 'active')
                ->exists();

            if (!$hasOuterGod && rand(1, 100) <= 10) { // 10% chance when entropy is critical
                $this->spawnEntity($universe, $tick, [
                    'name' => 'Thực Thể Viễn Cổ',
                    'entity_type' => 'outer_god',
                    'domain' => 'Hỗn Độn Vô Hạn',
                    'description' => 'Tà thần ngoại lai lợi dụng mộng cảnh rạn nứt của vũ trụ để xâm nhập.',
                    'power_level' => 1.5,
                    'alignment' => ['spirituality' => 0.5, 'hardtech' => 0.5, 'entropy' => 1.0, 'energy_level' => 0.9]
                ]);
            }
        }

        // 3. Primordial Beast (Dị Thú Thủy Tổ) -> High Entropy & High Energy
        if ($entropy > 0.7 && $energyLevel > 0.8) {
            if (rand(1, 100) <= 3) {
                $this->spawnEntity($universe, $tick, [
                    'name' => 'Hỗn Độn Cự Vĩ',
                    'entity_type' => 'primordial_beast',
                    'domain' => 'Hủy Diệt & Tái Khởi',
                    'description' => 'Một đầu cự thú sinh ra từ rác rưởi của điểm kỳ dị, mang sức mạnh phàm nhân không thể với tới.',
                    'power_level' => 0.8,
                    'alignment' => ['spirituality' => 0.8, 'hardtech' => 0.2, 'entropy' => 0.8, 'energy_level' => 0.8]
                ]);
            }
        }
    }

    private function evaluateAscendedHeroes(Universe $universe, UniverseSnapshot $snapshot): void
    {
        // Find heroic actors with influence > 85 (Legendary status)
        $candidates = \App\Models\Actor::where('universe_id', $universe->id)
            ->where('is_alive', true)
            ->whereRaw("CAST(metrics->>'influence' AS DECIMAL) > 85.0")
            ->get();

        foreach ($candidates as $actor) {
            // Check for specific trait thresholds for ascension
            $traits = $actor->traits ?? [];
            $hasAscensionQuality = false;

            // Dimension 1 (Ambition) or 8 (Curiosity) > 0.95
            if (($traits[1] ?? 0) > 0.95 || ($traits[8] ?? 0) > 0.95) {
                $hasAscensionQuality = true;
            }

            if ($hasAscensionQuality && rand(1, 100) <= 20) { // 20% chance to trigger ascension when criteria met
                $this->spawnEntity($universe, $snapshot->tick, [
                    'name' => "Thần Vương {$actor->name}",
                    'entity_type' => 'ascended_hero',
                    'domain' => 'Di sản Nhân quả: ' . ($actor->archetype ?? 'Hero'),
                    'description' => "Vị anh hùng huyền thoại {$actor->name} đã vượt qua giới hạn của xác thịt, thăng hoa thành bất tử để bảo hộ vĩnh hằng cho di sản của mình.",
                    'power_level' => 0.7, // Lower than primordial gods but growing
                    'alignment' => [
                        'spirituality' => ($traits[4] ?? 0.5), // Empathy based
                        'hardtech' => ($traits[7] ?? 0.5),    // Pragmatism based
                        'entropy' => 0.2, 
                        'energy_level' => 0.9
                    ]
                ], $actor);

                // Actor "dies" as a mortal, transcending
                $actor->update([
                    'is_alive' => false,
                    'biography' => $actor->biography . " [ĐÃ PHI THĂNG TẠI TICK {$snapshot->tick}]"
                ]);
            }
        }
    }

    private function applyWorldImpact(Universe $universe, UniverseSnapshot $snapshot, array &$metrics): void
    {
        $entities = SupremeEntity::where('universe_id', $universe->id)
            ->where('status', 'active')
            ->get();

        if ($entities->isEmpty()) {
            return;
        }

        $ethos = $metrics['ethos'] ?? [];
        $state = [
            'spirituality' => (float) ($ethos['spirituality'] ?? 0.5),
            'hardtech' => (float) ($ethos['openness'] ?? 0.5),
            'entropy' => (float) ($snapshot->entropy ?? 0.5),
            'energy_level' => (float) ($metrics['energy_level'] ?? 0.5),
        ];

        // Apply force from each entity
        foreach ($entities as $entity) {
            $alignment = $entity->alignment;
            if (!$alignment) continue;

            $power = $entity->power_level;
            $dt = 0.05 * $power; // The stronger the entity, the heavier the pull

            foreach (['spirituality', 'hardtech', 'entropy', 'energy_level'] as $dim) {
                if (isset($alignment[$dim])) {
                    $diff = $alignment[$dim] - $state[$dim];
                    $state[$dim] += $diff * $dt;
                }
            }
        }

        // Clamp values
        foreach (['spirituality', 'hardtech', 'entropy', 'energy_level'] as $dim) {
            $state[$dim] = max(0.0, min(1.0, $state[$dim]));
        }

        // Write back to metrics
        $ethos['spirituality'] = $state['spirituality'];
        $ethos['openness'] = $state['hardtech'];
        $metrics['ethos'] = $ethos;
        $metrics['energy_level'] = $state['energy_level'];
        
        $snapshot->entropy = $state['entropy'];
        $snapshot->metrics = $metrics;
        $snapshot->save();
    }

    private function spawnEntity(Universe $universe, int $tick, array $data, ?\App\Models\Actor $sourceActor = null): void
    {
        $entity = SupremeEntity::create(array_merge($data, [
            'universe_id' => $universe->id,
            'status' => 'active',
            'ascended_at_tick' => $tick,
        ]));

        $flavorText = $sourceActor 
            ? "PHI THĂNG ANH HÙNG: [{$sourceActor->name}] đã bứt phá xiềng xích phàm trần, trở thành [{$entity->name}]. Một ngôi sao mới đã rực sáng trên bầu trời thần thoại!"
            : "Biến cố cấp vũ trụ: Sự kiện Giáng Lâm Thực Thể! [{$entity->name}] - Danh hiệu: {$entity->domain} đã đản sinh. Lực vô hình từ thực thể này bắt đầu bóp méo quỹ đạo tiến hóa của thế giới.";

        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'to_tick' => $tick,
            'type' => 'supreme_emergence',
            'content' => $flavorText,
        ]);
        
        \App\Models\BranchEvent::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'event_type' => 'supreme_emergence',
            'payload' => array_merge($data, [
                'entity_id' => $entity->id,
                'source_actor_id' => $sourceActor?->id,
                'description' => $flavorText,
            ]),
        ]);
    }
}
