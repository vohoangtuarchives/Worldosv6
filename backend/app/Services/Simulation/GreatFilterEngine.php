<?php

namespace App\Services\Simulation;

use App\Models\Universe;
use App\Models\InstitutionalEntity;
use App\Models\Actor;
use App\Models\Chronicle;
use App\Models\BranchEvent;

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
     */
    public function process(Universe $universe, int $tick, array $stateVector): array
    {
        $crises = [];

        // 1. Singularity Paradox: Innovation > 0.9 AND Trust < 0.3
        $innovation = $stateVector['innovation'] ?? 0;
        $trust = $this->calculateAverageTrust($universe);
        if ($innovation > 0.9 && $trust < 0.3) {
            $crises[] = $this->triggerCrisis($universe, $tick, self::CRISIS_SINGULARITY);
        }

        // 2. Institutional Rigidity: Tradition > 0.8 AND Average Capacity < 5.0
        $tradition = $stateVector['tradition'] ?? 0;
        $avgCapacity = InstitutionalEntity::where('universe_id', $universe->id)
            ->whereNull('collapsed_at_tick')
            ->avg('org_capacity') ?? 10.0;
        if ($tradition > 0.8 && $avgCapacity < 5.0) {
            $crises[] = $this->triggerCrisis($universe, $tick, self::CRISIS_STAGNATION);
        }

        // 3. Void Breach: Entropy > 0.95
        $entropy = $stateVector['entropy'] ?? 0;
        if ($entropy > 0.95) {
            $crises[] = $this->triggerCrisis($universe, $tick, self::CRISIS_VOID_BREACH);
        }

        return $crises;
    }

    protected function triggerCrisis(Universe $universe, int $tick, string $type): array
    {
        // Prevent immediate re-triggering (cooldown or status check)
        $vec = $universe->state_vector ?? [];
        if (isset($vec['active_crises'][$type])) {
            return ['type' => $type, 'status' => 'active'];
        }

        $content = match($type) {
            self::CRISIS_SINGULARITY => "THẢM HỌA ĐIỂM KỲ DỊ: Công nghệ đột phá vượt xa niềm tin xã hội, cấu trúc hiện thực bắt đầu tan rã.",
            self::CRISIS_STAGNATION => "SỰ TRÌ TRỆ ĐẠI HỆ THỐNG: Truyền thống hủ lậu và bộ máy cồng kềnh đã làm cạn kiệt sức sống của nền văn minh.",
            self::CRISIS_VOID_BREACH => "CÁNH CỬA HƯ VÔ: Entropy đạt mức cực hạn, ranh giới giữa tồn tại và hư vô trở nên mỏng manh.",
            default => "KHỦNG HOẢNG VĨ MÔ: Một bộ lọc vĩ đại đang thử thách sự sinh tồn của vũ trụ.",
        };

        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'to_tick' => $tick,
            'type' => 'great_filter_event',
            'content' => "BỘ LỌC VĨ ĐẠI: {$content}",
        ]);

        // Apply immediate effects
        $this->applyCrisisEffects($universe, $type, $tick);

        // Record in state_vector
        $vec['active_crises'][$type] = [
            'started_at' => $tick,
            'intensity' => 1.0
        ];
        $universe->update(['state_vector' => $vec]);

        return ['type' => $type, 'status' => 'triggered'];
    }

    protected function applyCrisisEffects(Universe $universe, string $type, int $tick): void
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
                break;

            case self::CRISIS_STAGNATION:
                // Drastic reduction in institutional memory/capacity
                InstitutionalEntity::where('universe_id', $universe->id)
                    ->whereNull('collapsed_at_tick')
                    ->update([
                        'org_capacity' => \DB::raw('org_capacity * 0.5'),
                        'institutional_memory' => \DB::raw('institutional_memory * 0.7')
                    ]);
                break;

            case self::CRISIS_VOID_BREACH:
                // Increase trauma across all zones
                $vec = $universe->state_vector;
                $vec['trauma'] = ($vec['trauma'] ?? 0) + 0.5;
                $universe->update(['state_vector' => $vec]);
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
