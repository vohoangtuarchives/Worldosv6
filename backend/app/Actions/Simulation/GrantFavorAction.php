<?php

namespace App\Actions\Simulation;

use App\Models\LegendaryAgent;
use App\Models\Chronicle;
use Illuminate\Support\Facades\Log;

/**
 * GrantFavorAction: The Architect's specific focus (§V19).
 * Grants divine protection and accelerated growth to a Legend.
 */
class GrantFavorAction
{
    /**
     * Grant divine favor to a legendary agent.
     */
    public function execute(int $legendId, bool $status = true): void
    {
        $legend = LegendaryAgent::findOrFail($legendId);
        
        // Use flag in metadata or new column. For simplicity, we use fate_tags
        $tags = $legend->fate_tags ?? [];
        
        if ($status) {
            if (!in_array('divine_favor', $tags)) {
                $tags[] = 'divine_favor';
                Log::warning("FAVOR: The Architect has focused their gaze on [{$legend->name}].");
                
                Chronicle::create([
                    'universe_id' => $legend->universe_id,
                    'from_tick' => $legend->universe->current_tick,
                    'to_tick' => $legend->universe->current_tick,
                    'type' => 'divine_favor',
                    'raw_payload' => [
                'action' => 'legacy_event',
                'description' => "ÂN ĐIỂN THIÊN THỂ: Legend [{$legend->name}] đã nhận được Sự Ưu Ái của Kiến trúc sư. Một hào quang rực rỡ bao phủ lấy họ."
            ],
                ]);
            }
        } else {
            $tags = array_diff($tags, ['divine_favor']);
            Log::info("FAVOR: The Architect's gaze has turned away from [{$legend->name}].");
        }

        $legend->update(['fate_tags' => $tags]);
    }
}
