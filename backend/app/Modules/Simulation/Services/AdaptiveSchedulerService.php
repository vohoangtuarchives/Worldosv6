<?php

namespace App\Modules\Simulation\Services;

use App\Models\Universe;
use App\Models\UniverseSnapshot;

/**
 * Điều chỉnh tick rate cho các phân hệ / engine dựa trên Activity Signals.
 */
class AdaptiveSchedulerService
{
    /**
     * Xác định xem module có nên chạy ở tick hiện tại không.
     */
    public function shouldRun(string $module, Universe $universe, UniverseSnapshot $snapshot): bool
    {
        $tick = (int) $snapshot->tick;
        $state = $universe->state_vector ?? $snapshot->state_vector ?? [];
        $metrics = $snapshot->metrics ?? [];

        // Trích xuất Activity Signals
        $entropy = (float) ($snapshot->entropy ?? 0.5);
        $warActivity = (float) ($state['war_pressure'] ?? $metrics['war_activity'] ?? 0.0);
        // Có thể lấy gradient trực tiếp từ snapshot
        $chaosLevel = (float) ($snapshot->instability_gradient ?? $metrics['chaos_level'] ?? 0.0);
        $civKnowledge = (float) ($metrics['civ_fields']['knowledge'] ?? 0.5);

        $baseInterval = $this->getBaseInterval($module);

        if ($baseInterval <= 0) {
            return false;
        }

        if ($tick === 0 || $baseInterval === 1) {
            return true;
        }

        $effectiveInterval = $this->calculateEffectiveInterval(
            $module, 
            $baseInterval, 
            $entropy, 
            $warActivity, 
            $chaosLevel, 
            $civKnowledge
        );

        return $tick % $effectiveInterval === 0;
    }

    /**
     * Định nghĩa chu kỳ tick chuẩn cho từng module.
     */
    protected function getBaseInterval(string $module): int
    {
        return match ($module) {
            'zone_conflict' => (int) config('worldos.pulse.zone_conflict_interval', 1),
            'idea_diffusion' => (int) config('worldos.idea_diffusion.interval', 5),
            'institution_decay' => (int) config('worldos.institution.decay_interval', 10),
            'actor_decision' => (int) config('worldos.pulse.actor_decision_interval', 1),
            'ideology_evolution' => (int) config('worldos.pulse.ideology_interval', 20),
            'great_person' => (int) config('worldos.pulse.great_person_interval', 50),
            'era_detect' => (int) config('worldos.narrative.era_interval', 200),
            'religion_spread' => (int) config('worldos.narrative.religion_interval', 200),
            'prophecy' => (int) config('worldos.narrative.prophecy_interval', 500),
            'legend' => (int) config('worldos.narrative.legend_interval', 100),
            default => 10,
        };
    }

    /**
     * Tính toán chu kỳ hiệu chỉnh dựa trên trạng thái (Signals).
     */
    protected function calculateEffectiveInterval(
        string $module, 
        int $base, 
        float $entropy, 
        float $warActivity, 
        float $chaosLevel, 
        float $civKnowledge
    ): int {
        $modifier = 1.0;

        switch ($module) {
            case 'zone_conflict':
                if ($warActivity > 0.7 || $chaosLevel > 0.8) {
                    $modifier = 0.2; // Chiến tranh hoặc hỗn loạn cao -> Check va chạm liên tục
                } elseif ($warActivity > 0.4 || $chaosLevel > 0.5) {
                    $modifier = 0.5;
                }
                break;

            case 'idea_diffusion':
            case 'actor_decision':
                if ($civKnowledge > 0.8) {
                    $modifier = 0.5; // Xã hội tri thức thức tỉnh -> Ý tưởng lan truyền nhanh
                } elseif ($chaosLevel > 0.8) {
                    $modifier = 0.5; // Hỗn loạn -> Con người phản ứng và ra quyết định dồn dập
                }
                break;

            case 'institution_decay':
            case 'ideology_evolution':
                if ($entropy > 0.8 || $chaosLevel > 0.7) {
                    $modifier = 0.25; // Cấu trúc phân rã gia tốc nhanh khi hỗn loạn hệ thống
                }
                break;
                
            case 'great_person':
                if ($chaosLevel > 0.8 || $warActivity > 0.8) {
                    $modifier = 0.5; // Loạn thế thế xuất anh hùng
                }
                break;
        }

        return (int) max(1, round($base * $modifier));
    }
}
