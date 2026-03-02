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
        protected ResidualInjector $residual
    ) {}

    /**
     * Build perceived context for narrative (flavor + event names + residual tail).
     */
    public function build(int $universeId, array $eventTypes, array $vector, ?int $tick = null): array
    {
        $flavorTexts = $this->flavor->mapMany($vector);
        
        // 1. Get Active Materials
        $materials = MaterialInstance::with('material')
            ->where('universe_id', $universeId)
            ->where('lifecycle', 'active')
            ->get()
            ->map(fn($m) => $m->material->name)
            ->toArray();

        // Fallback: Check state_vector for injected materials (Demo Scenario)
        if (empty($materials)) {
            // Check 'zones' structure
            if (isset($vector['zones'])) {
                foreach ($vector['zones'] as $z) {
                    if (!empty($z['state']['active_materials'])) {
                        foreach ($z['state']['active_materials'] as $am) {
                            $materials[] = $am['slug'];
                        }
                    }
                }
            } 
            // Check flat/mixed structure
            else {
                 foreach ($vector as $k => $v) {
                     if (is_array($v) && isset($v['state']['active_materials'])) {
                         foreach ($v['state']['active_materials'] as $am) {
                             $materials[] = $am['slug'];
                         }
                     }
                 }
            }
            $materials = array_unique($materials);
        }

        // 2. Get Recent Branch Events (last 50 ticks)
        $branchEvents = [];
        if ($tick) {
            $branchEvents = BranchEvent::where('universe_id', $universeId)
                ->whereBetween('from_tick', [$tick - 50, $tick])
                ->get()
                ->map(function($e) {
                    if ($e->event_type === 'micro_crisis') {
                        $p = is_array($e->payload) ? $e->payload : json_decode($e->payload, true);
                        $wName = $p['winner']['name'] ?? 'Unknown';
                        $wArch = $p['winner']['archetype'] ?? 'Unknown';
                        $act = $p['outcome'] ?? '';
                        return "A Micro Crisis occurred at tick {$e->from_tick}: The {$wArch} named {$wName} took control. Action taken: {$act}";
                    }
                    return "{$e->event_type} at tick {$e->from_tick}";
                })
                ->toArray();
        }

        // 3. Get Active Institutional Entities
        $institutions = \App\Models\InstitutionalEntity::where('universe_id', $universeId)
            ->whereNull('collapsed_at_tick')
            ->get()
            ->map(fn($e) => "{$e->name} ({$e->entity_type}, Capacity: " . round($e->org_capacity, 1) . ")")
            ->toArray();

        // 4. Calculate Average Culture
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
                    $avgCulture[$dim] = round($total / $count, 2);
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
            'metrics' => [
                'entropy' => $vector['entropy'] ?? 0,
                'stability' => $vector['stability_index'] ?? 0,
            ]
        ];
    }
}
