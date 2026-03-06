<?php

namespace App\Modules\Simulation\Services;

use App\Models\Universe;
use App\Models\UniverseInteraction;
use App\Models\Chronicle;
use App\Actions\Simulation\MergeUniverseAction;

/**
 * Convergence Engine: Orchestrates the merging of multiverse timelines.
 * Driven by alignment resonance and stability thresholds.
 */
class ConvergenceEngine
{
    public function __construct(
        protected ?MergeUniverseAction $mergeAction = null
    ) {}

    /**
     * Process a universe to check for convergence opportunities.
     */
    public function process(Universe $universe, int $tick): void
    {
        $multiverseId = $universe->multiverse_id;
        if (!$multiverseId) return;

        // 1. Identify high-resonance partners
        // Criteria: Same World, status active, and high resonance recorded in interactions
        $partners = UniverseInteraction::where('interaction_type', 'resonance')
            ->where(function($q) use ($universe) {
                $q->where('universe_a_id', $universe->id)
                  ->orWhere('universe_b_id', $universe->id);
            })
            ->where('created_at', '>=', now()->subHours(24))
            ->get()
            ->map(function($interaction) use ($universe) {
                return $interaction->universe_a_id === $universe->id 
                    ? $interaction->universe_b_id 
                    : $interaction->universe_a_id;
            })->unique();

        foreach ($partners as $partnerId) {
            $partner = Universe::find($partnerId);
            if (!$partner || $partner->status !== 'active') continue;

            if ($this->shouldConverge($universe, $partner)) {
                $this->triggerConvergence($universe, $partner, $tick);
            }
        }

        // 2. Check for Omega Point (Global Multiverse Collapse)
        $this->checkOmegaPoint($universe, $tick);
    }

    /**
     * Convergence occurs if two universes have very similar alignments and high IP scores.
     */
    protected function shouldConverge(Universe $a, Universe $b): bool
    {
        // Fetch latest snapshots for metrics
        $snapA = $a->snapshots()->orderByDesc('tick')->first();
        $snapB = $b->snapshots()->orderByDesc('tick')->first();

        if (!$snapA || !$snapB) return false;

        $alignA = ($snapA->metrics ?? [])['alignment'] ?? null;
        $alignB = ($snapB->metrics ?? [])['alignment'] ?? null;

        if (!$alignA || !$alignB || !is_array($alignA) || !is_array($alignB)) return false;

        // Similarity check: Difference in all 3 axes < 0.05
        $diff = abs($alignA['spirituality'] - $alignB['spirituality']) +
                abs($alignA['hardtech'] - $alignB['hardtech']) +
                abs($alignA['entropy'] - $alignB['entropy']);

        return $diff < 0.15; // Threshold for convergence
    }

    protected function triggerConvergence(Universe $a, Universe $b, int $tick): void
    {
        if (!$this->mergeAction) return;

        // Only trigger if no pending merges exist
        $exists = UniverseInteraction::where('interaction_type', 'convergence_initiated')
            ->where(function($q) use ($a, $b) {
                $q->where('universe_a_id', $a->id)->where('universe_b_id', $b->id);
            })->exists();

        if ($exists) return;

        UniverseInteraction::create([
            'universe_a_id' => $a->id,
            'universe_b_id' => $b->id,
            'interaction_type' => 'convergence_initiated',
            'payload' => ['tick' => $tick]
        ]);

        Chronicle::create([
            'universe_id' => $a->id,
            'from_tick' => $tick,
            'to_tick' => $tick,
            'type' => 'convergence_event',
            'raw_payload' => [
                'action' => 'legacy_event',
                'description' => "SỰ HỘI TỤ ĐA VŨ TRỤ: Ranh giới giữa thế giới này và {$b->id} đang sụp đổ. Hai dòng thời gian bắt đầu giao thoa để tìm về một thực tại thống nhất."
            ],
        ]);

        // Execute merge (this will create a new Prime Universe)
        $this->mergeAction->execute($a, $b, $tick);
    }

    protected function checkOmegaPoint(Universe $universe, int $tick): void
    {
        $vec = $universe->state_vector ?? [];
        $entropy = (float)($vec['entropy'] ?? 0.0);

        if ($entropy > 0.99) {
            Chronicle::create([
                'universe_id' => $universe->id,
                'from_tick' => $tick,
                'to_tick' => $tick,
                'type' => 'omega_point',
                'raw_payload' => [
                'action' => 'legacy_event',
                'description' => "ĐIỂM OMEGA: Vũ trụ đã chạm tới giới hạn tuyệt đối của sự tồn tại. Mọi cấu trúc vật chất và ý thức dần tan biến vào Hư vô vĩnh hằng."
            ],
            ]);
            
            $universe->update(['status' => 'archived']);
        }
    }
}
