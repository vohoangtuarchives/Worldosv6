<?php

namespace App\Actions\Simulation;

use App\Models\World;
use App\Models\Universe;
use Illuminate\Support\Facades\Log;

class CorrectionAction
{
    public function __construct(
        protected WorldAxiomAction $axiomAction
    ) {}

    /**
     * Tiêm một cú sốc vào Axiom để phá vỡ trạng thái bế tắc (Stagnation).
     */
    public function execute(Universe $universe, string $reason = 'inertia'): void
    {
        $world = $universe->world;
        if (!$world) return;

        $currentAxioms = $world->axiom ?? [];
        $shocks = [];

        Log::warning("CorrectionAction: Breaking stagnation for Universe {$universe->id} (Reason: {$reason})");

        switch ($reason) {
            case 'inertia':
                // Phá vỡ sự quan trọng hóa: Tăng đột biến entropy_rate hoặc giảm tech_ceiling
                $shocks['entropy_rate'] = ($currentAxioms['entropy_rate'] ?? 1.0) * 1.5;
                $shocks['volatility'] = ($currentAxioms['volatility'] ?? 0.1) + 0.2;
                $message = "Thiên Đạo rúng động: Một làn sóng hỗn mang được tiêm vào thực tại để phá vỡ sự trì trệ.";
                break;
            
            case 'low_population':
                $shocks['growth_multiplier'] = ($currentAxioms['growth_multiplier'] ?? 1.0) * 2.0;
                $message = "Phước lành từ hư không: Tốc độ sinh trưởng của các nền văn minh tăng đột biến.";
                break;

            default:
                $shocks['luck_factor'] = mt_rand(0, 100) / 100;
                $message = "Sự can thiệp không xác định từ cõi Linh Cơ.";
                break;
        }

        $this->axiomAction->execute($world, $shocks);

        // Ghi lại vào biên niên sử
        \App\Models\Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $universe->current_tick,
            'to_tick' => $universe->current_tick,
            'type' => 'myth',
            'raw_payload' => [
            'action' => 'legacy_event',
            'description' => $message
        ]
        ]);
    }
}
