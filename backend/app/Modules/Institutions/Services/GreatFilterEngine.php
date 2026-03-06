<?php

namespace App\Modules\Institutions\Services;

use App\Models\Universe;
use App\Models\InstitutionalEntity as InstitutionalModel;
use App\Models\Actor;
use App\Models\Chronicle;
use App\Models\BranchEvent;
use App\Simulation\Support\SimulationRandom;
use Illuminate\Support\Facades\DB;

/**
 * Great Filter Engine: Monitors global stability and triggers systemic crises.
 * Based on WORLDOS_V6 macro-evolutionary specs.
 */
class GreatFilterEngine
{
    const CRISIS_SINGULARITY = 'singularity_collapse';
    const CRISIS_STAGNATION = 'institutional_stagnation';
    const CRISIS_VOID_BREACH = 'void_breach';
    const CRISIS_RESOURCE_WAR = 'total_resource_war';

    /**
     * Process global state to detect and handle Great Filter events.
     * When $rng is provided, randomness is deterministic (replayable).
     */
    public function process(Universe $universe, int $tick, array $stateVector, ?SimulationRandom $rng = null): array
    {
        $crises = [];

        // 1. Singularity Paradox: Innovation > 0.9 AND Trust < 0.3, or cosmic pressure
        $innovation = $stateVector['innovation'] ?? 0;
        $trust = $this->calculateAverageTrust($universe);
        $innovationPressure = (float) ($stateVector['pressures']['innovation'] ?? 0);
        if (($innovation > 0.9 && $trust < 0.3) || $innovationPressure > 0.85) {
            $crises[] = $this->triggerCrisis($universe, $tick, self::CRISIS_SINGULARITY, $rng);
        }

        // 2. Institutional Rigidity: Tradition > 0.8 AND Average Capacity < 5.0
        $tradition = $stateVector['tradition'] ?? 0;
        $avgCapacity = InstitutionalModel::where('universe_id', $universe->id)
            ->whereNull('collapsed_at_tick')
            ->avg('org_capacity') ?? 10.0;
        if ($tradition > 0.8 && $avgCapacity < 5.0) {
            $crises[] = $this->triggerCrisis($universe, $tick, self::CRISIS_STAGNATION, $rng);
        }

        // 3. Void Breach: Entropy > 0.95 or cosmic entropy pressure
        $entropy = $stateVector['entropy'] ?? 0;
        $entropyPressure = (float) ($stateVector['pressures']['entropy'] ?? 0);
        if ($entropy > 0.95 || $entropyPressure > 0.9) {
            $crises[] = $this->triggerCrisis($universe, $tick, self::CRISIS_VOID_BREACH, $rng);
        }

        return $crises;
    }

    protected function triggerCrisis(Universe $universe, int $tick, string $type, ?SimulationRandom $rng = null): array
    {
        // Prevent immediate re-triggering (cooldown or status check)
        $vec = $universe->state_vector ?? [];
        if (isset($vec['active_crises'][$type])) {
            return ['type' => $type, 'status' => 'active'];
        }

        $content = match($type) {
            self::CRISIS_SINGULARITY => "NGHỊCH LÝ ĐIỂM KỲ DỊ: Công nghệ đột phá vượt xa tầm kiểm soát của đạo đức và niềm tin xã hội. Cấu trúc thực tại bắt đầu rạn nứt.",
            self::CRISIS_STAGNATION => "SỰ ĐÌNH TRỆ ĐẠI HỆ THỐNG: Truyền thống hủ lậu và bộ máy cồng kềnh đã bóp nghẹt mọi mầm mống đổi mới. Nền văn minh đang tự thối rữa từ bên trong.",
            self::CRISIS_VOID_BREACH => "CÁNH CỬA HƯ VÔ: Entropy đạt mức cực hạn. Ranh giới giữa hiện hữu và hư vô đang tan biến. Hư âm vang lên từ vực thẳm.",
            default => "BỘ LỌC VĨ ĐẠI: Một thử thách vĩ mô đang đe dọa sự tồn vong của toàn bộ vũ trụ.",
        };

        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'to_tick' => $tick,
            'type' => 'great_filter_event',
            'raw_payload' => [
                'action' => 'legacy_event',
                'description' => "CẢNH BÁO BỘ LỌC VĨ ĐẠI: {$content}"
            ],
        ]);

        // Broadcast as Anomaly
        event(new \App\Events\Simulation\AnomalyDetected($universe, [
            'title' => "BỘ LỌC VĨ ĐẠI: " . strtoupper(str_replace('_', ' ', $type)),
            'description' => $content,
            'severity' => 'CRITICAL'
        ]));

        // Apply immediate effects
        $this->applyCrisisEffects($universe, $type, $tick, $rng);

        // Record in state_vector
        $vec = $universe->fresh()->state_vector; // Get fresh state
        $activeCrises = $vec['active_crises'] ?? [];
        $activeCrises[$type] = [
            'started_at' => $tick,
            'intensity' => 1.0
        ];
        $vec['active_crises'] = $activeCrises;
        $universe->update(['state_vector' => $vec]);

        return ['type' => $type, 'status' => 'triggered'];
    }

    protected function applyCrisisEffects(Universe $universe, string $type, int $tick, ?SimulationRandom $rng = null): void
    {
        switch ($type) {
            case self::CRISIS_SINGULARITY:
                // Kill 30% of actors randomly (digital soul fragmentation)
                $count = Actor::where('universe_id', $universe->id)->where('is_alive', true)->count();
                Actor::where('universe_id', $universe->id)
                    ->where('is_alive', true)
                    ->inRandomOrder()
                    ->limit((int)($count * 0.3))
                    ->update(['is_alive' => false]);
                
                // Damage civilization capacity due to technological chaos
                InstitutionalModel::where('universe_id', $universe->id)
                    ->where('entity_type', 'CIVILIZATION')
                    ->whereNull('collapsed_at_tick')
                    ->update([
                        'org_capacity' => DB::raw('GREATEST(0.1, org_capacity - 0.2)'),
                        'legitimacy' => DB::raw('GREATEST(0.0, legitimacy - 0.15)')
                    ]);
                break;

            case self::CRISIS_STAGNATION:
                // Drastic reduction in institutional memory/capacity
                InstitutionalModel::where('universe_id', $universe->id)
                    ->whereNull('collapsed_at_tick')
                    ->update([
                        'org_capacity' => DB::raw('org_capacity * 0.4'),
                        'institutional_memory' => DB::raw('institutional_memory * 0.6'),
                        'legitimacy' => DB::raw('GREATEST(0.0, legitimacy - 0.3)')
                    ]);
                break;

            case self::CRISIS_VOID_BREACH:
                // Increase trauma across all zones and cause mass civilization fragmentation
                $vec = $universe->state_vector;
                $vec['trauma'] = ($vec['trauma'] ?? 0) + 0.6;
                $universe->update(['state_vector' => $vec]);

                // Fragment civilizations: 50% chance to lose random zones from influence_map
                $civs = InstitutionalModel::where('universe_id', $universe->id)
                    ->where('entity_type', 'CIVILIZATION')
                    ->whereNull('collapsed_at_tick')
                    ->get();

                foreach ($civs as $civ) {
                    $map = $civ->influence_map ?? [];
                    if (count($map) > 1) {
                        $pct = $rng ? $rng->int(20, 40) : rand(20, 40);
                        $removeCount = (int)(count($map) * $pct / 100);
                        if ($rng) {
                            $withKeys = [];
                            foreach ($map as $i => $v) {
                                $withKeys[] = ['v' => $v, 'r' => $rng->nextFloat()];
                            }
                            usort($withKeys, fn ($a, $b) => $a['r'] <=> $b['r']);
                            $remaining = array_slice(array_column($withKeys, 'v'), $removeCount);
                        } else {
                            shuffle($map);
                            $remaining = array_slice($map, $removeCount);
                        }
                        $civ->update(['influence_map' => $remaining]);
                    }
                }
                break;
        }
    }

    protected function calculateAverageTrust(Universe $universe): float
    {
        $actors = Actor::where('universe_id', $universe->id)
            ->where('is_alive', true)
            ->select('traits')
            ->get();

        if ($actors->isEmpty()) {
            return 0.5;
        }

        $totalTrust = 0.0;
        foreach ($actors as $actor) {
            // Trust is index 7 of 17D vector
            $totalTrust += (float) ($actor->traits[7] ?? 0.5);
        }

        return $totalTrust / $actors->count();
    }
}
