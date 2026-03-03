<?php

namespace App\Services\Narrative;

use App\Models\UniverseSnapshot;
use App\Models\MaterialInstance;
use App\Models\BranchEvent;

/**
 * Perceived Archive: data layer that AI is allowed to see (filtered by Epistemic Instability).
 * Does NOT expose canonical state; only "foggy" or summarized view.
 */
class PerceivedArchiveBuilder
{
    public function __construct(
        protected FlavorTextMapper $flavor,
        protected EventTriggerMapper $events,
        protected ResidualInjector $residual,
        protected TraitMapper $traitMapper,
        protected \App\Services\AI\EpistemicService $epistemic
    ) {}

    /**
     * Build perceived context for narrative (flavor + event names + residual tail).
     */
    public function build(int $universeId, array $eventTypes, array $vector, ?int $tick = null): array
    {
        // V6: Determine Existence State via EpistemicService
        $instability = $vector['instability_gradient'] ?? ($vector['epistemic_instability'] ?? 0);
        $existence = $this->epistemic->getExistenceState($instability);
        
        $flavorTexts = $this->flavor->mapMany($vector);
        
        // 1. Get Active Materials (Filtered by visibility in Tier IV: Void Echo)
        $materialsQuery = MaterialInstance::with('material')
            ->where('universe_id', $universeId)
            ->where('lifecycle', 'active');
            
        if ($existence['tier'] === 'IV') {
             $materialsQuery->limit(2); // AI only sees "echoes" of material reality
        }

        $materials = $materialsQuery->get()
            ->map(function($m) {
                $base = $m->material->name;
                $p = is_array($m->payload) ? $m->payload : json_decode($m->payload, true);
                if (isset($p['recursive_core'])) {
                    $layer = $p['recursive_core']['layer'] ?? 1;
                    return "{$base} [Recursive Layer {$layer}]";
                }
                return $base;
            })
            ->toArray();

        // 2. Get Recent Events
        $recentTicks = 50;
        $branchEvents = [];
        if ($tick) {
            $branchEvents = BranchEvent::where('universe_id', $universeId)
                ->whereBetween('from_tick', [max(0, $tick - $recentTicks), $tick])
                ->orderByDesc('from_tick')
                ->get()
                ->map(function($e) use ($existence) {
                    if ($existence['tier'] === 'III' || $existence['tier'] === 'IV') {
                        return "Dấu vết mờ nhạt của một sự biến tại tick {$e->from_tick}";
                    }
                    if ($e->event_type === 'micro_crisis') {
                        $p = is_array($e->payload) ? $e->payload : json_decode($e->payload, true);
                        $wName = $p['winner']['name'] ?? 'Unknown';
                        $wArch = $p['winner']['archetype'] ?? 'Unknown';
                        $act = $p['outcome'] ?? '';
                        return "Khủng hoảng vi mô tại tick {$e->from_tick}: {$wName} ({$wArch}) nắm quyền. Hành động: {$act}";
                    }
                    return "Sự kiện {$e->event_type} tại tick {$e->from_tick}";
                })
                ->toArray();
        }

        // 3. Get Active Institutional Entities (Foggy in Tier II and above)
        $institutions = \App\Models\InstitutionalEntity::where('universe_id', $universeId)
            ->whereNull('collapsed_at_tick')
            ->get()
            ->map(function($e) use ($existence) {
                $cap = round($e->org_capacity, 1);
                if (in_array($existence['tier'], ['II', 'III', 'IV'])) {
                    return "Phái đoàn bí ẩn: {$e->name}";
                }
                return "{$e->name} ({$e->entity_type}, Năng lực: {$cap})";
            })
            ->toArray();

        // 4. Calculate Average Culture (With noise if instability is high)
        $avgCulture = [];
        if (isset($vector['zones'])) {
            $count = count($vector['zones']);
            if ($count > 0) {
                foreach ($vector['zones'] as $z) {
                    if (isset($z['culture'])) {
                        foreach ($z['culture'] as $dim => $val) {
                            $avgCulture[$dim] = ($avgCulture[$dim] ?? 0) + $val;
                        }
                    }
                }
                foreach ($avgCulture as $dim => $total) {
                    $val = $total / $count;
                    if ($instability > 0.5) {
                        $val += (mt_rand(-10, 10) / 100); // Add epistemic noise
                    }
                    $avgCulture[$dim] = round(max(0, min(1, $val)), 2);
                }
            }
        }

        // 5. V6: Agent Reflexivity (§51)
        $agentReflections = [];
        $zones = $vector['zones'] ?? [];
        foreach ($zones as $z) {
            $agents = $z['state']['agents'] ?? [];
            foreach ($agents as $agent) {
                // Focus on high-ambition or high-risk agents for narrative drama
                $traits = $agent['trait_vector'] ?? array_fill(0, 17, 0);
                if ($traits[1] > 0.8 || $traits[10] > 0.8 || $traits[13] > 0.8) {
                    $agentReflections[] = [
                        'name' => $agent['name'] ?? 'Ẩn danh',
                        'archetype' => $agent['archetype'] ?? 'Commoner',
                        'description' => $this->traitMapper->mapToDescription($traits),
                        'thinking' => $this->traitMapper->generateMonologueSeed($traits, $agent['archetype'] ?? 'Commoner')
                    ];
                }
            }
        }

        // 5. Map Event Triggers
        $eventNames = [];
        foreach ($eventTypes as $type) {
            $name = $this->events->getEventName($type, $vector);
            if ($name) $eventNames[$type] = $name;
        }

        $residualTail = $this->residual->buildPromptTail($universeId, $tick);

        return [
            'flavor' => $flavorTexts,
            'events' => $eventNames,
            'materials' => $materials,
            'institutions' => $institutions,
            'culture' => $avgCulture,
            'branch_events' => $branchEvents,
            'residual_prompt_tail' => $residualTail,
            'agent_reflections' => array_slice($agentReflections, 0, 3), // AI only reflexive monologues for top 3 agents
            'existence' => $existence,
            'metrics' => [
                'entropy' => round($vector['entropy'] ?? 0, 3),
                'stability' => round($vector['stability_index'] ?? 0, 3),
                'instability' => round($instability, 3),
                'sci' => round($vector['sci'] ?? 1.0, 3),
                'reality_stability' => round($this->epistemic->calculateStability($this->getUniverseModel($universeId)), 3),
            ]
        ];
    }

    protected function getUniverseModel(int $id): \App\Models\Universe
    {
        return \App\Models\Universe::find($id);
    }
}
