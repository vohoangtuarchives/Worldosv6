<?php

namespace App\Services\Simulation;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Models\SupremeEntity;
use App\Models\Chronicle;
use App\Models\BranchEvent;

class WorldEdictEngine
{
    /**
     * Define the dictionary of possible Edicts and their multipliers.
     * key: Edict ID, value: ['target' => string, 'multiplier' => float, 'name' => string, 'flavor' => string]
     */
    protected array $edictDictionary = [
        'heavenly_tribulation' => [
            'target' => 'entropy',
            'multiplier' => 2.0,
            'name' => 'Thiên Kiếp Lôi Đình',
            'flavor' => 'Tà thần rống giận, Thiên Kiếp giáng xuống. Vạn vật phân rã nhanh gấp đôi thường ngày.'
        ],
        'reiki_revival' => [
            'target' => 'order',
            'multiplier' => 3.0,
            'name' => 'Linh Khí Phục Tô',
            'flavor' => 'Thiên Đạo ban ân, cấm chế bị phá vỡ. Linh khí dồi dào khiến thế giới thăng hoa mạnh mẽ.'
        ],
        'age_of_chaos' => [
            'target' => 'trauma',
            'multiplier' => 2.5,
            'name' => 'Kỷ Nguyên Hỗn Độn',
            'flavor' => 'Thần ma loạn vũ, Dị Thú trỗi dậy. Mọi mất mát và tổn thương trên thế giới đều bị khuếch đại sâu sắc.'
        ],
        'divine_inspiration' => [
            'target' => 'innovation',
            'multiplier' => 2.0,
            'name' => 'Thần Khải',
            'flavor' => 'Trí huệ từ cõi trên rót vào nhân loại, kỷ nguyên bùng nổ ý tưởng bắt đầu.'
        ]
    ];

    /**
     * Process active edicts and inject them into the metrics for PressureResolver.
     */
    public function decree(Universe $universe, UniverseSnapshot $snapshot): void
    {
        $metrics = is_string($snapshot->metrics) ? json_decode($snapshot->metrics, true) : ($snapshot->metrics ?? []);
        
        // 1. Evaluate current Supreme Entities to see if they decree a new Law
        $this->evaluateNewDecrees($universe, $snapshot->tick, $metrics);

        // 2. Check Expiry
        $this->processExpiry($snapshot->tick, $metrics);

        // Save back
        $snapshot->metrics = $metrics;
        $snapshot->save();
    }

    public function activateEdict(Universe $universe, int $tick, array &$metrics, string $edictId, string $decreedBy): bool
    {
        if (!isset($this->edictDictionary[$edictId])) return false;

        $activeEdicts = $metrics['active_edicts'] ?? [];
        if (isset($activeEdicts[$edictId])) return false;

        $edictDef = $this->edictDictionary[$edictId];
        
        $activeEdicts[$edictId] = [
            'id' => $edictId,
            'decreed_by' => $decreedBy,
            'name' => $edictDef['name'],
            'target' => $edictDef['target'],
            'multiplier' => $edictDef['multiplier'],
            'expires_at' => $tick + 10 
        ];

        $metrics['active_edicts'] = $activeEdicts;

        $flavor = "ĐẠO LUẬT BAN HÀNH: {$decreedBy} đã giáng hạ thần ấn. {$edictDef['flavor']}";

        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'to_tick' => $tick,
            'type' => 'edict_decree',
            'content' => $flavor,
        ]);

        BranchEvent::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'event_type' => 'edict_decree',
            'payload' => [
                'entity' => $decreedBy,
                'edict' => $edictId,
                'description' => $flavor,
            ],
        ]);

        return true;
    }

    public function getEdictDictionary(): array
    {
        return $this->edictDictionary;
    }

    private function evaluateNewDecrees(Universe $universe, int $tick, array &$metrics): void
    {
        $entities = SupremeEntity::where('universe_id', $universe->id)
            ->where('status', 'active')
            ->get();

        foreach ($entities as $entity) {
            // High power entities have a chance to decree laws
            if ($entity->power_level > 0.8 && mt_rand(1, 100) <= 2) { 
                $chosenEdictId = $this->chooseEdictForEntity($entity);
                if ($chosenEdictId) {
                    $this->activateEdict($universe, $tick, $metrics, $chosenEdictId, $entity->name);
                }
            }
        }
    }

    private function processExpiry(int $tick, array &$metrics): void
    {
        $edicts = $metrics['active_edicts'] ?? [];
        foreach ($edicts as $id => $data) {
            if ($tick >= ($data['expires_at'] ?? 0)) {
                unset($edicts[$id]); // Expire the law
            }
        }
        $metrics['active_edicts'] = $edicts;
    }

    private function chooseEdictForEntity(SupremeEntity $entity): ?string
    {
        if ($entity->entity_type === 'world_will') {
            return mt_rand(0, 1) ? 'reiki_revival' : 'divine_inspiration';
        }
        if ($entity->entity_type === 'outer_god') {
            return mt_rand(0, 1) ? 'heavenly_tribulation' : 'age_of_chaos';
        }
        if ($entity->entity_type === 'primordial_beast') {
            return 'age_of_chaos';
        }
        // Deities
        return array_rand($this->edictDictionary); // random domain
    }
}
