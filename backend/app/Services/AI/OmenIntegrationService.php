<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * OmenIntegrationService: Bridges the gap between reality and simulation (§V18).
 * Fetches external data to influence the multiverse state.
 */
class OmenIntegrationService
{
    /**
     * Get the current 'Cosmic Omen' based on external factors.
     * For demonstration, we simulate fetching news sentiment.
     */
    public function getCurrentOmen(): array
    {
        // In a real production environment, this would call NewsAPI, RSS, or Twitter API.
        // We'll simulate a 'Reality Leak' here.
        
        $sentiments = ['positive', 'negative', 'neutral', 'volatile'];
        $chosen = $sentiments[array_rand($sentiments)];

        $omens = [
            'positive' => [
                'type' => 'Golden Era',
                'sci_modifier' => 0.05,
                'entropy_modifier' => -0.05,
                'description' => "Một kỷ nguyên vàng của sự sáng tạo đang rò rỉ từ Cõi Ngoài."
            ],
            'negative' => [
                'type' => 'Shadow Leak',
                'sci_modifier' => -0.05,
                'entropy_modifier' => 0.1,
                'description' => "Xung đột và bất ổn từ Thế giới Thực đang thấm vào các thực tại."
            ],
            'volatile' => [
                'type' => 'Cosmic Storm',
                'sci_modifier' => -0.1,
                'entropy_modifier' => 0.2,
                'description' => "Những biến động dữ dội từ Cõi Ngoài đang phá vỡ sự ổn định."
            ],
            'neutral' => [
                'type' => 'Steady Flow',
                'sci_modifier' => 0.0,
                'entropy_modifier' => 0.0,
                'description' => "Dòng chảy giữa các thế giới đang ở trạng thái cân bằng."
            ]
        ];

        return $omens[$chosen];
    }

    /**
     * Apply the current Omen to a World state.
     */
    public function applyOmenToEdict(array &$edictPayload): void
    {
        $omen = $this->getCurrentOmen();
        
        $edictPayload['sci_impact'] = ($edictPayload['sci_impact'] ?? 0) + $omen['sci_modifier'];
        $edictPayload['entropy_impact'] = ($edictPayload['entropy_impact'] ?? 0) + $omen['entropy_modifier'];
        $edictPayload['omen_type'] = $omen['type'];
        $edictPayload['omen_description'] = $omen['description'];

        Log::info("OMEN: Applied '{$omen['type']}' to divine action.");
    }
}
