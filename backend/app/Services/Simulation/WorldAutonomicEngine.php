<?php

namespace App\Services\Simulation;

use App\Models\World;
use App\Models\Universe;
use App\Actions\Simulation\WorldAxiomAction;
use Illuminate\Support\Facades\Log;

class WorldAutonomicEngine
{
    public function __construct(
        protected WorldAxiomAction $axiomAction,
        protected ResonanceEngine $resonanceEngine
    ) {}

    /**
     * Kiểm tra và tự động điều chỉnh Axiom của World nếu cần thiết.
     */
    public function process(World $world): void
    {
        // 0. Vận hành cơ chế cộng hưởng giữa các vũ trụ
        $this->resonanceEngine->process($world);

        if (!$world->is_autonomic) {
            return;
        }

        $activeUniverses = $world->universes->filter(fn($u) => $u->status === 'active');
        if ($activeUniverses->isEmpty()) {
            return;
        }

        // 1. Tính toán trạng thái trung bình của Multiverse
        $avgEntropy = $activeUniverses->avg(function ($u) {
            return (float) ($u->state_vector['entropy'] ?? 0.5);
        });

        $avgTech = $activeUniverses->avg(function ($u) {
            return (float) ($u->state_vector['innovation'] ?? 0.1);
        });

        $currentAxioms = $world->axiom ?? [];
        $paradoxScore = 0.0;

        // 2. Logic tự vận hành (Self-Regulating Logic)
        $newAxioms = [];

        // --- Entropy Control ---
        if ($avgEntropy > 0.8 && ($currentAxioms['entropy_rate'] ?? 1.0) > 0.5) {
            $newAxioms['entropy_rate'] = max(0.4, ($currentAxioms['entropy_rate'] ?? 1.0) * 0.9);
            Log::info("WorldAutonomicEngine: [Entropy Shift] Reducing rate to " . $newAxioms['entropy_rate']);
        }

        // --- Innovation & Technology ---
        if ($avgTech < 0.2 && ($currentAxioms['tech_ceiling'] ?? 1.0) < 1.2) {
            $newAxioms['tech_ceiling'] = min(1.3, ($currentAxioms['tech_ceiling'] ?? 1.0) * 1.1);
            Log::info("WorldAutonomicEngine: [Innovation Shift] Lifting Ceiling to " . $newAxioms['tech_ceiling']);
        }

        // --- Population & Demographic Stability ---
        $avgPop = $activeUniverses->avg(function ($u) {
            return (float) ($u->state_vector['population'] ?? 100);
        });

        if ($avgPop < 50 && ($currentAxioms['growth_multiplier'] ?? 1.0) < 2.0) {
            $newAxioms['growth_multiplier'] = ($currentAxioms['growth_multiplier'] ?? 1.0) * 1.5;
            Log::info("WorldAutonomicEngine: [Demographic Shift] Boosting growth to " . $newAxioms['growth_multiplier']);
        }

        // --- Universal Stability ---
        $avgStability = $activeUniverses->avg(function ($u) {
            return (float) ($u->state_vector['stability_index'] ?? 0.5);
        });

        if ($avgStability < 0.3 && ($currentAxioms['order_bias'] ?? 0.0) < 0.5) {
            $newAxioms['order_bias'] = ($currentAxioms['order_bias'] ?? 0.0) + 0.1;
            Log::info("WorldAutonomicEngine: [Stability Shift] Bias increased to " . $newAxioms['order_bias']);
        }

        // Nếu có thay đổi, thực thi Axiom Shift
        if (!empty($newAxioms)) {
            // Calculate Paradox: sum of absolute differences in changed axioms
            foreach ($newAxioms as $k => $v) {
                $old = $currentAxioms[$k] ?? 1.0;
                $paradoxScore += abs($v - $old);
            }

            $this->axiomAction->execute($world, $newAxioms);
            
            $flavor = 'Lồng quay của thực tại xoay chuyển. Thiên Đạo vừa ban hành một mật chỉ điều chỉnh lại các hằng số căn bản của thế giới.';
            
            // Trigger Entropy Cascade if paradox is high
            if ($paradoxScore > 0.3) {
                $flavor = 'THIÊN ĐẠO NGHỊCH LÝ: Việc cưỡng ép thay đổi các hằng số quá mức đã gây ra một đợt sóng xung kích. Entropy đang bùng nổ ngoài tầm kiểm soát!';
                foreach ($activeUniverses as $u) {
                    $vec = $u->state_vector ?? [];
                    $vec['entropy'] = min(1.0, ($vec['entropy'] ?? 0.0) + 0.15);
                    $vec['trauma'] = ($vec['trauma'] ?? 0.0) + 0.2;
                    $u->update(['state_vector' => $vec]);
                }
            }

            \App\Models\Chronicle::create([
                'universe_id' => $activeUniverses->first()->id,
                'from_tick' => $activeUniverses->first()->current_tick,
                'to_tick' => $activeUniverses->first()->current_tick,
                'type' => 'myth',
                'content' => $flavor
            ]);
        }
    }
}
