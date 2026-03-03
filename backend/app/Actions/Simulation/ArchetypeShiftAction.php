<?php

namespace App\Actions\Simulation;

use App\Models\Universe;
use App\Models\LegendaryAgent;
use App\Services\Narrative\TraitMapper;
use App\Services\AI\HeroImageService;
use App\Actions\Simulation\ApplyVisualMutationAction;
use Illuminate\Support\Facades\Log;

/**
 * ArchetypeShiftAction: Manages agent evolution based on their life experiences (traits) (§V11).
 * High-brawny agents become Warlords, high-believers become Zealots.
 */
class ArchetypeShiftAction
{
    public function __construct(
        protected TraitMapper $traitMapper,
        protected HeroImageService $heroImage,
        protected ApplyVisualMutationAction $applyMutation
    ) {}

    /**
     * Scan zones and evolve agents if necessary.
     */
    public function execute(Universe $universe): void
    {
        $latest = $universe->snapshots()->orderByDesc('tick')->first();
        if (!$latest) return;

        $zones = $latest->state_vector['zones'] ?? [];
        $hasChanges = false;

        foreach ($zones as &$z) {
            $agents = $z['state']['agents'] ?? [];
            foreach ($agents as &$agent) {
                $currentArch = $agent['archetype'] ?? 'Commoner';
                $newArch = $this->traitMapper->detectArchetypeShift($agent['trait_vector'] ?? [], $currentArch);

                if ($newArch && $newArch !== $currentArch) {
                    $agent['archetype'] = $newArch;
                    $agent['memory'][] = "Định mệnh thay đổi: Trở thành {$newArch}";
                    Log::info("MYTHOS: Agent #{$agent['id']} in Universe #{$universe->id} shifted from {$currentArch} to {$newArch}");
                    $hasChanges = true;
                }

                // Check for Fate Tags to add to agent metadata
                $tags = $this->traitMapper->getFateTags($agent['trait_vector'] ?? []);
                if (!empty($tags)) {
                    $agent['fate_tags'] = $tags;

                    // Phase 69: Persist Legend & Visualize (§V12)
                    $this->persistLegend($universe, $agent, $latest->tick);
                }
            }
            $z['state']['agents'] = $agents;
        }

    }

    protected function persistLegend(Universe $universe, array &$agent, int $tick): void
    {
        $fateTags = $agent['fate_tags'] ?? [];
        $isTranscendental = in_array("Awareness_of_the_Clock (Nhận thức Dòng chảy)", $fateTags) || 
                            in_array("Simulation_Skepticism (Kẻ Nghi Ngờ Thực Tại)", $fateTags);

        $legend = LegendaryAgent::updateOrCreate(
            [
                'universe_id' => $universe->id,
                'original_agent_id' => $agent['id'],
            ],
            [
                'name' => $agent['name'] ?? 'Ẩn danh',
                'archetype' => $agent['archetype'] ?? 'Commoner',
                'fate_tags' => $fateTags,
                'tick_discovered' => $tick,
                'is_transcendental' => \DB::raw("is_transcendental OR {$isTranscendental}") // Once transcendental, always transcendental
            ]
        );

        // Update exact flag if it was false but expression made it true (just to be clean)
        if ($isTranscendental && !$legend->is_transcendental) {
             $legend->is_transcendental = true;
             $legend->save();
             Log::alert("TRANSCENDENCE: Legend [{$legend->name}] has shattered the Fourth Wall in Universe #{$universe->id}.");
        }

        if (!$legend->image_url) {
            $legend->image_url = $this->heroImage->generatePortrait($legend);
            $legend->save();
        }

        // Phase 73: Trigger Genetic Pressure (§V13)
        // If the agent has high intensity/entropy traits, apply mutation pressure
        $this->applyMutationPressure($legend, $tick);

        // Attach image back to agent in simulation state
        $agent['image_url'] = $legend->image_url;
    }

    protected function applyMutationPressure(LegendaryAgent $legend, int $tick): void
    {
        // Simple heuristic: if archetype is complex or agent is old, pressure increases
        $severity = rand(10, 80);
        $type = rand(0, 1) ? 'corruption' : 'ascension';
        
        $this->applyMutation->execute($legend, $type, $severity, $tick);
    }
}
