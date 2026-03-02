<?php

namespace App\Actions\Simulation;

use App\Models\Universe;
use App\Models\InstitutionalEntity;
use App\Models\SupremeEntity;
use App\Models\Chronicle;
use App\Services\Simulation\WorldWillEngine;

/**
 * Ascension Action: Triggers the ascension of high-tier entities to Supreme status.
 */
class AscensionAction
{
    public function __construct(protected WorldWillEngine $willEngine) {}

    /**
     * Scan candidate institutions and actors for ascension.
     */
    public function execute(Universe $universe, int $tick): void
    {
        // 1. Institutional Ascension
        // Threshold: Legitimacy > 0.9, Capacity > 100
        $candidates = InstitutionalEntity::where('universe_id', $universe->id)
            ->whereNull('collapsed_at_tick')
            ->where('legitimacy', '>', 0.9)
            ->where('org_capacity', '>', 100)
            ->get();

        foreach ($candidates as $inst) {
            $this->ascendInstitution($inst, $tick);
        }

        // 2. Heroic Actor Ascension (Demi-gods)
        // Check for specific actors with very high influence (>100)
        // (Assuming influence is stored in metrics or similar)
        // This is a placeholder for future Heroic logic.
    }

    protected function ascendInstitution(InstitutionalEntity $inst, int $tick): void
    {
        // Prevent duplicate ascension
        $exists = SupremeEntity::where('universe_id', $inst->universe_id)
            ->where('name', $inst->name)
            ->exists();
        if ($exists) return;

        $alignment = $this->willEngine->calculateAlignment($inst->universe);
        $dominant = $this->willEngine->getDominantAlignment($alignment);

        $supreme = SupremeEntity::create([
            'universe_id' => $inst->universe_id,
            'name' => "Archon {$inst->name}",
            'entity_type' => 'ascended_institution',
            'domain' => $this->mapDomain($inst->entity_type, $dominant),
            'description' => "Thực thể tối cao thăng hoa từ định chế {$inst->name}. Người bảo hộ của {$dominant}.",
            'power_level' => 1.0,
            'alignment' => $alignment,
            'status' => 'active',
            'ascended_at_tick' => $tick,
        ]);

        Chronicle::create([
            'universe_id' => $inst->universe_id,
            'from_tick' => $tick,
            'to_tick' => $tick,
            'type' => 'ascension_event',
            'content' => "SỰ THĂNG HOA TỐI CAO: Định chế {$inst->name} đã vượt ngưỡng phàm trần, trở thành {$supreme->name} cai quản cõi {$supreme->domain}.",
        ]);

        // Consume origin institution? Or mark as "Divine Presence"
        // Let's keep the institution but boost its capacity as a "temple/base"
        $inst->update([
            'org_capacity' => $inst->org_capacity + 500,
            'legitimacy' => 1.0
        ]);
    }

    protected function mapDomain(string $instType, string $alignment): string
    {
        return match($alignment) {
            'spirituality' => 'Cõi Vĩnh Hằng (Eternal)',
            'hardtech' => 'Cơ Giới Đỉnh Cao (Singularity)',
            'entropy' => 'Vực Thẳm Hư Vô (The Void)',
            default => 'Hư thực chi giới',
        };
    }
}
