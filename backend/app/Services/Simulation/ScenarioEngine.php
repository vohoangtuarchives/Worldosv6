<?php

namespace App\Services\Simulation;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Models\Chronicle;
use App\Models\BranchEvent;
use App\Services\Material\MaterialLifecycleEngine;
use App\Services\Narrative\NarrativeAiService;

/**
 * Scenario Engine: Orchestrates complex multi-layer interventions 
 * while feeding the "Blind Historian" (Narrative AI).
 */
class ScenarioEngine
{
    protected array $scenarios = [
        'great_flood' => [
            'name' => 'Đại Hồng Thủy',
            'description' => 'Một thảm họa nhấn chìm thế giới, thanh tẩy các định chế cũ.',
            'edict' => 'heavenly_tribulation',
            'material_spawn' => 'hydro_essence', // Hypothetical water material
            'narrative_focus' => 'Sự thanh tẩy và lụi tàn của các nền văn minh ven biển.',
        ],
        'golden_age' => [
            'name' => 'Kỷ Nguyên Vàng',
            'description' => 'Linh khí hồi sinh, trí tuệ bùng nổ.',
            'edict' => 'reiki_revival',
            'material_spawn' => 'aether_shard',
            'narrative_focus' => 'Sự trỗi dậy của các anh hào và những định chế vượt bậc.',
        ],
        'age_of_chaos' => [
            'name' => 'Kỷ Nguyên Hỗn Độn',
            'description' => 'Ma thần thức tỉnh, trật tự sụp đổ.',
            'edict' => 'age_of_chaos',
            'material_spawn' => 'void_dust',
            'narrative_focus' => 'Nỗi sợ hãi bao trùm và sự phản bội giữa các đồng minh.',
        ]
    ];

    public function __construct(
        protected WorldEdictEngine $edictEngine,
        protected NarrativeAiService $narrativeAi
    ) {}

    public function launch(Universe $universe, string $scenarioId): array
    {
        if (!isset($this->scenarios[$scenarioId])) {
            return ['ok' => false, 'error' => 'Scenario not found'];
        }

        $scenario = $this->scenarios[$scenarioId];
        $snapshot = $universe->snapshots()->orderByDesc('tick')->first();
        if (!$snapshot) return ['ok' => false, 'error' => 'No snapshot'];

        $metrics = is_string($snapshot->metrics) ? json_decode($snapshot->metrics, true) : ($snapshot->metrics ?? []);
        $tick = $snapshot->tick;

        // 1. Activate Edict (Macro Law)
        if (isset($scenario['edict'])) {
            $this->edictEngine->activateEdict($universe, $tick, $metrics, $scenario['edict'], 'Định Mệnh');
        }

        // 2. Spawn Material (Numerical Footprint)
        if (isset($scenario['material_spawn'])) {
            $material = \App\Models\Material::where('slug', str_replace('_', '-', $scenario['material_spawn']))->first();
            if ($material) {
                \App\Models\MaterialInstance::create([
                    'universe_id' => $universe->id,
                    'material_id' => $material->id,
                    'lifecycle' => 'active',
                    'activated_at_tick' => $tick,
                    'context' => ['scenario_launch' => $scenarioId]
                ]);
            }
        }

        // 3. Guide the Blind Historian (Narrative injection)
        $this->injectNarrativeSignal($universe, $tick, $scenario);

        // Save state
        $snapshot->metrics = $metrics;
        $snapshot->save();

        return [
            'ok' => true,
            'message' => "Scenario '{$scenario['name']}' launched with numerical material injection.",
            'details' => $scenario
        ];
    }

    protected function injectNarrativeSignal(Universe $universe, int $tick, array $scenario): void
    {
        // We create a special Chronicle entry that serves as a seed for the "Blind Historian"
        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'to_tick' => $tick,
            'type' => 'scenario_init',
            'content' => "KHỞI ĐẦU KỊCH BẢN: {$scenario['name']}. {$scenario['narrative_focus']}",
        ]);

        BranchEvent::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'event_type' => 'scenario_launched',
            'payload' => [
                'scenario_id' => $scenario['name'],
                'impact' => $scenario['description']
            ],
        ]);
    }

    public function getScenarioList(): array
    {
        return $this->scenarios;
    }
}
