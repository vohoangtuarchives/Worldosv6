<?php

namespace App\Modules\Institutions\Actions;

use App\Models\Universe;
use App\Models\Chronicle;
use App\Models\BranchEvent;
use App\Modules\Institutions\Contracts\SupremeEntityRepositoryInterface;
use App\Modules\Institutions\Entities\SupremeEntity;

class SpawnSupremeEntityAction
{
    public function __construct(
        private SupremeEntityRepositoryInterface $supremeEntityRepository
    ) {}

    public function handle(Universe $universe, int $tick, array $data, ?int $sourceActorId = null): SupremeEntity
    {
        $entity = new SupremeEntity(
            id: null,
            universeId: $universe->id,
            name: $data['name'],
            entityType: $data['entity_type'],
            domain: $data['domain'],
            description: $data['description'] ?? null,
            powerLevel: $data['power_level'] ?? 1.0,
            alignment: $data['alignment'] ?? [],
            karma: 0.5,
            status: 'active',
            ascendedAtTick: $tick
        );

        $this->supremeEntityRepository->save($entity);

        $flavorText = $sourceActorId 
            ? "PHI THĂNG ANH HÙNG: Một thực thể mới đã bứt phá giới hạn phàm trần, trở thành [{$entity->name}]. Ngôi sao mới rực sáng trên bầu trời thần thoại!"
            : "Biến cố cấp vũ trụ: Sự kiện Giáng Lâm Thực Thể! [{$entity->name}] - Danh hiệu: {$entity->domain} đã đản sinh.";

        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'to_tick' => $tick,
            'type' => 'supreme_emergence',
            'content' => $flavorText,
        ]);

        BranchEvent::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'event_type' => 'supreme_emergence',
            'payload' => array_merge($data, [
                'entity_id' => $entity->id,
                'source_actor_id' => $sourceActorId,
                'description' => $flavorText,
            ]),
        ]);

        return $entity;
    }
}
