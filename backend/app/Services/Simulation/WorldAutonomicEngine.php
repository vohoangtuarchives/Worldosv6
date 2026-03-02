<?php

namespace App\Services\Simulation;

use App\Models\World;
use App\Models\Universe;
use App\Actions\Simulation\WorldAxiomAction;
use Illuminate\Support\Facades\Log;

class WorldAutonomicEngine
{
    public function __construct(
        protected WorldAxiomAction $axiomAction
    ) {}

    /**
     * Kiểm tra và tự động điều chỉnh Axiom của World nếu cần thiết.
     */
    public function process(World $world): void
    {
        if (!$world->is_autonomic) {
            return;
        }

        $activeUniverses = $world->universes()->where('status', 'active')->get();
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

        // 2. Logic tự vận hành (Self-Regulating Logic)
        $newAxioms = [];

        // Nếu Entropy trung bình quá cao (> 0.8), tự động giảm entropy_rate để cứu vãn thế giới
        if ($avgEntropy > 0.8 && ($currentAxioms['entropy_rate'] ?? 1.0) > 0.5) {
            $newAxioms['entropy_rate'] = max(0.4, ($currentAxioms['entropy_rate'] ?? 1.0) * 0.9);
            Log::info("WorldAutonomicEngine: High Entropy detected ({$avgEntropy}). Reducing entropy_rate.");
        }

        // Nếu Tech trung bình quá thấp và bị kẹt, nới lỏng Tech Ceiling
        if ($avgTech < 0.2 && ($currentAxioms['tech_ceiling'] ?? 1.0) < 1.2) {
            $newAxioms['tech_ceiling'] = min(1.3, ($currentAxioms['tech_ceiling'] ?? 1.0) * 1.1);
            Log::info("WorldAutonomicEngine: Stagnation detected ({$avgTech}). Lifting Tech Ceiling.");
        }

        // Nếu có thay đổi, thực thi Axiom Shift
        if (!empty($newAxioms)) {
            $this->axiomAction->execute($world, $newAxioms);
            
            // Ghi nhận vào World Seed hoặc Chronicle đặc biệt
            \App\Models\Chronicle::create([
                'universe_id' => $activeUniverses->first()->id, // Ghi vào một nhánh bất kỳ để AI biết
                'from_tick' => $activeUniverses->first()->current_tick,
                'to_tick' => $activeUniverses->first()->current_tick,
                'type' => 'myth',
                'content' => 'Thiên Đạo tự vận hành. Các quy luật của thực tại đang được tự động điều chỉnh để duy trì sự cân bằng vĩnh cửu.'
            ]);
        }
    }
}
