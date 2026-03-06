<?php

namespace App\Services\Narrative;

use App\Models\UniverseSnapshot;
use App\Models\MaterialInstance;
use App\Models\BranchEvent;
use App\Models\MythScar;

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
        protected \App\Services\AI\EpistemicService $epistemic,
        protected \App\Services\Simulation\TheDreamingService $dreaming
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

        // Scars: state_vector + MythScar for narrative context
        $scarsContext = $this->buildScarsContext($universeId, $vector);

        // Entropy trend: from pressures or optional previous snapshot
        $entropyTrend = $this->inferEntropyTrend($vector);

        // Event prompt templates for Crisis, GoldenAge, Fork (narrative prompts)
        $eventTemplates = $this->buildEventTemplates($eventTypes, $vector);

        return [
            'flavor' => $flavorTexts,
            'events' => $eventNames,
            'materials' => $materials,
            'institutions' => $institutions,
            'culture' => $avgCulture,
            'branch_events' => $branchEvents,
            'residual_prompt_tail' => $residualTail,
            'agent_reflections' => array_slice($agentReflections, 0, 3),
            'whispers' => $this->dreaming->generateWhispers($this->getUniverseModel($universeId)),
            'existence' => $existence,
            'scars' => $scarsContext,
            'entropy_trend' => $entropyTrend,
            'event_prompt_templates' => $eventTemplates,
            'metrics' => [
                'entropy' => round($vector['entropy'] ?? 0, 3),
                'stability' => round($vector['stability_index'] ?? 0, 3),
                'instability' => round($instability, 3),
                'sci' => round($vector['sci'] ?? 1.0, 3),
                'reality_stability' => round($this->epistemic->calculateStability($this->getUniverseModel($universeId)), 3),
            ]
        ];
    }

    /**
     * Build scars context for narrative: state_vector scars + MythScar records.
     */
    protected function buildScarsContext(int $universeId, array $vector): array
    {
        $out = [];
        $vecScars = $vector['scars'] ?? [];
        if (is_array($vecScars)) {
            foreach ($vecScars as $s) {
                $out[] = is_string($s) ? $s : ($s['description'] ?? $s['name'] ?? json_encode($s));
            }
        }
        $dbScars = MythScar::where('universe_id', $universeId)
            ->whereNull('resolved_at_tick')
            ->get();
        foreach ($dbScars as $scar) {
            $out[] = $scar->description ?: $scar->name;
        }
        return array_values(array_unique(array_filter($out)));
    }

    /**
     * Infer entropy trend from pressures or metrics (rising / falling / stable).
     */
    protected function inferEntropyTrend(array $vector): string
    {
        $pressures = $vector['pressures'] ?? [];
        $collapse = (float) ($pressures['collapse_pressure'] ?? 0);
        $ascension = (float) ($pressures['ascension_pressure'] ?? 0);
        $entropy = (float) ($vector['entropy'] ?? $vector['metrics']['entropy'] ?? 0.5);
        if ($collapse > 0.7 || $entropy > 0.8) {
            return 'rising';
        }
        if ($ascension > 0.7 && $entropy < 0.3) {
            return 'falling';
        }
        return 'stable';
    }

    /**
     * Build prompt fragments for Crisis, GoldenAge, Fork for use in narrative generation.
     */
    protected function buildEventTemplates(array $eventTypes, array $vector): array
    {
        $templates = [
            'crisis' => 'Thế giới đang trong khủng hoảng: áp lực tích tụ, định chế rạn nứt. Hãy phản ánh sự bất ổn và khả năng sụp đổ.',
            'golden_age' => 'Thời kỳ hoàng kim: trật tự và năng lượng đạt đỉnh, văn minh thịnh vượng. Hãy phản ánh sự hưng thịnh và hy vọng.',
            'fork' => 'Khoảnh khắc phân nhánh: vũ trụ đứng trước ngã ba, một quyết định có thể tách thành nhiều thực tại.',
        ];
        foreach (['crisis', 'golden_age', 'fork'] as $key) {
            if (in_array($key, $eventTypes)) {
                $fragment = $this->events->getPromptFragment($key, $vector);
                if ($fragment !== '') {
                    $templates[$key] = $fragment;
                }
            }
        }
        return $templates;
    }

    protected function getUniverseModel(int $id): \App\Models\Universe
    {
        return \App\Models\Universe::find($id);
    }
}
