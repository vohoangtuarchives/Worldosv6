<?php

namespace App\Services\Simulation;

use App\Models\Universe;
use App\Models\UniverseInteraction;
use App\Models\Chronicle;

class MultiverseInteractionService
{
    /**
     * Check for resonance between universes in the same multiverse.
     * Resonance occurs when universes share similar origins or high-level states.
     */
    public function detectResonance(Universe $universe): void
    {
        $multiverseId = $universe->multiverse_id;
        if (!$multiverseId) return;

        // Find other universes in the same multiverse
        $others = Universe::where('multiverse_id', $multiverseId)
            ->where('id', '!=', $universe->id)
            ->where('status', 'active')
            ->get();

        foreach ($others as $other) {
            if ($this->isResonant($universe, $other)) {
                $this->triggerResonance($universe, $other);
            }
        }
    }

    protected function isResonant(Universe $a, Universe $b): bool
    {
        // V6 Spec: Resonance if same World Origin and similar entropy levels
        if ($a->world->origin !== $b->world->origin) return false;

        $avgA = $a->snapshots()->orderByDesc('tick')->limit(5)->avg('entropy') ?? 0;
        $avgB = $b->snapshots()->orderByDesc('tick')->limit(5)->avg('entropy') ?? 0;

        // If entropy levels are within 0.1 range, they resonance
        return abs($avgA - $avgB) < 0.1;
    }

    protected function triggerResonance(Universe $a, Universe $b): void
    {
        // Check if resonance interaction already recorded recently to avoid spam
        $exists = UniverseInteraction::where('interaction_type', 'resonance')
            ->where(function($q) use ($a, $b) {
                $q->where('universe_a_id', $a->id)->where('universe_b_id', $b->id);
            })
            ->where('created_at', '>=', now()->subHours(1))
            ->exists();

        if ($exists) return;

        UniverseInteraction::create([
            'universe_a_id' => $a->id,
            'universe_b_id' => $b->id,
            'interaction_type' => 'resonance',
            'payload' => [
                'strength' => rand(70, 95) / 100,
                'note' => 'Cộng hưởng tri thức qua không gian đa chiều.'
            ]
        ]);

        $content = "CỘNG HƯỞNG ĐA VŨ TRỤ: Cảm ứng được sự tồn tại của một thế giới song hành ({$b->id}), tri thức bắt đầu rò rỉ qua vết nứt không gian.";
        
        Chronicle::create([
            'universe_id' => $a->id,
            'from_tick' => $a->current_tick,
            'to_tick' => $a->current_tick,
            'type' => 'multiverse_resonance',
            'content' => $content,
        ]);
    }
}
