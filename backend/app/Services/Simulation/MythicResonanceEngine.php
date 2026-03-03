<?php

namespace App\Services\Simulation;

use App\Models\Universe;
use App\Models\Chronicle;
use App\Services\Simulation\WorldEdictEngine;
use Illuminate\Support\Facades\Log;

/**
 * MythicResonanceEngine: The bridge between Narrative and Physics (§V11).
 * Detects 'Epic' chronicles and converts them into physical pulses (Edicts).
 */
class MythicResonanceEngine
{
    public function __construct(
        protected WorldEdictEngine $edictEngine,
        protected TheDreamingService $dreaming
    ) {}

    /**
     * Process a new chronicle for mythic resonance.
     */
    public function process(Chronicle $chronicle): void
    {
        $content = $chronicle->content;
        $universe = $chronicle->universe;

        // Simple heuristic for "Epicness" - in production, this would be an AI scoring call
        $isEpic = strlen($content) > 200 && (
            str_contains($content, 'huyền thoại') || 
            str_contains($content, 'vĩnh cửu') || 
            str_contains($content, 'bi kịch') ||
            str_contains($content, 'thần thoại')
        );

        if ($isEpic) {
            $this->triggerMythicPulse($universe, $chronicle);
        }
    }

    protected function triggerMythicPulse(Universe $universe, Chronicle $chronicle): void
    {
        Log::info("MYTHOS: High Resonance detected in Chronicle #{$chronicle->id}. Triggering Mythic Pulse.");

        // Get snapshot to target zones with high Oneric Density
        $latest = $universe->snapshots()->orderByDesc('tick')->first();
        if (!$latest) return;

        $zones = $latest->state_vector['zones'] ?? [];
        foreach ($zones as $z) {
            $density = $this->dreaming->getOnericDensity($z['state'] ?? []);
            
            if ($density > 0.6) {
                // High density zone: Story becomes Reality
                $this->edictEngine->decree($universe, [
                    'type' => 'mythic_resonance',
                    'target' => 'zone',
                    'zone_id' => $z['id'],
                    'parameters' => [
                        'entropy_cooling' => 0.1,
                        'knowledge_spark' => 0.05,
                        'reason' => "Cộng hưởng từ câu chuyện: " . substr($chronicle->content, 0, 50) . "..."
                    ]
                ]);
            }
        }
    }
}
