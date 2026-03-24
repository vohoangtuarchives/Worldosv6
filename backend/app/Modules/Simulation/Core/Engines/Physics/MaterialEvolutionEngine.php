<?php
namespace App\Modules\Simulation\Core\Engines\Physics;

use App\Modules\Simulation\Core\Concerns\DefaultSimulationEnginePhase;
use App\Modules\Simulation\Core\Engines\EngineInterface;
use App\Modules\Simulation\Core\Engines\EngineResult;
use App\Modules\Simulation\Core\Domain\TickContext;
use App\Modules\Simulation\Core\Runtime\State\WorldState;
use Illuminate\Support\Facades\Log;

/**
 * MaterialEvolutionEngine — Vật liệu tiến hóa theo tech_level.
 *
 * Chuyển đổi raw minerals thành processed materials dựa trên tech_level.
 * Output: zone.state.available_materials, zone.state.material_richness
 */
class MaterialEvolutionEngine implements EngineInterface
{
    use DefaultSimulationEnginePhase;

    public function name(): string { return 'material_evolution'; }
    public function phase(): string { return 'physics'; }
    public function priority(): int { return 4; }
    public function tickRate(): int { return 1; }
    public function isParallelSafe(): bool { return true; }

    /** Material tiers: mỗi tier cần tech_level tối thiểu để unlock. */
    private const MATERIAL_TIERS = [
        ['name' => 'stone',    'tech_min' => 0.0, 'mineral_factor' => 0.3],
        ['name' => 'copper',   'tech_min' => 0.1, 'mineral_factor' => 0.5],
        ['name' => 'bronze',   'tech_min' => 0.2, 'mineral_factor' => 0.6],
        ['name' => 'iron',     'tech_min' => 0.3, 'mineral_factor' => 0.7],
        ['name' => 'steel',    'tech_min' => 0.5, 'mineral_factor' => 0.8],
        ['name' => 'alloy',    'tech_min' => 0.7, 'mineral_factor' => 0.9],
        ['name' => 'advanced', 'tech_min' => 0.9, 'mineral_factor' => 1.0],
    ];

    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        $tick = $ctx->getTick();

        // Chạy mỗi 100 tick để giảm tải
        if ($tick % 100 !== 0) {
            return EngineResult::empty();
        }

        $zones     = $state->getZones();
        $techLevel = (float) $state->get('tech_level', 0.1);

        $updatedZones = [];
        $hasChanged = false;

        Log::info("MaterialEvolutionEngine: Tick {$tick}, TechLevel: {$techLevel}");

        foreach ($zones as $idx => $zone) {
            $zoneState  = $zone['state'] ?? [];
            $minerals   = (float) ($zoneState['minerals'] ?? 0.5);
            $materials  = $zoneState['active_materials'] ?? [];

            foreach (self::MATERIAL_TIERS as $tier) {
                if ($techLevel >= $tier['tech_min']) {
                    $amount = $minerals * $tier['mineral_factor'] * 10.0;
                    $materials[$tier['name']] = round($amount, 2);
                }
            }

            if (($zoneState['active_materials'] ?? null) !== $materials) {
                $zoneState['active_materials'] = $materials;
                $zone['state'] = $zoneState;
                $updatedZones[$idx] = $zone;
                $hasChanged = true;
            } else {
                $updatedZones[$idx] = $zone;
            }
        }

        if ($hasChanged) {
            Log::info("MaterialEvolutionEngine: Updated " . count($updatedZones) . " zones");
            $state->set('zones', $updatedZones);
            return new EngineResult(['zones' => $updatedZones]);
        }

        return EngineResult::empty();
    }
}
