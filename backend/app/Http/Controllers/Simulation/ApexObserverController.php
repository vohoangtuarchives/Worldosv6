<?php

namespace App\Http\Controllers\Simulation;

use App\Http\Controllers\Controller;
use App\Simulation\Runtime\State\StateManager;
use App\Modules\Simulation\Services\ZenithMetricsService;
use App\Services\Narrative\MeaningSeedService;
use App\Modules\Simulation\Services\RuleMutationService;
use App\Models\UniverseSnapshot;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

/**
 * Phase 77: Apex Observer API — Demiurge Vision 👁️✨
 *
 * "Con mắt của Đấng Tạo Hóa nhìn thấu ngàn vũ trụ cùng lúc."
 * Provides privileged read/write access to the simulation's deepest state layers.
 */
class ApexObserverController extends Controller
{
    public function __construct(
        protected StateManager $stateManager,
        protected ZenithMetricsService $zenithMetrics,
        protected MeaningSeedService $seedService,
        protected RuleMutationService $mutationService,
    ) {}

    /**
     * GET /api/apex/wavefunction/{universeId}
     * Project the full causal wavefunction of a universe.
     */
    public function projectWavefunction(int $universeId): JsonResponse
    {
        $state = $this->stateManager->get();

        if (!$state || (int) $state->get('universe_id') !== $universeId) {
            return response()->json([
                'error' => 'Universe state not loaded',
                'universe_id' => $universeId,
            ], 404);
        }

        $fields = $state->getFields();
        $pressures = $state->getPressures();
        $entropy = $state->getEntropy();
        $attractor = $state->getActiveAttractor();
        $stability = (float) $state->get('stability_index', 1.0);
        $density = (float) $state->get('meta.information_density', 0.0);
        $tick = (int) $state->get('tick', 0);

        // Wavefunction Collapse Probability
        $collapseProbability = max(0.0, min(1.0, $entropy * (1 - $stability) * (1 + $density)));

        return response()->json([
            'universe_id' => $universeId,
            'tick' => $tick,
            'wavefunction' => [
                'entropy' => $entropy,
                'stability_index' => $stability,
                'information_density' => $density,
                'active_attractor' => $attractor,
                'collapse_probability' => round($collapseProbability, 4),
                'fields' => $fields,
                'pressures' => $pressures,
            ],
            'causal_topology' => [
                'ancestor_ids' => (array) $state->get('meta.ancestor_universe_ids', []),
                'residual_seeds' => $state->get('meta.residual_seeds', []),
                'inherited_attractor' => $state->get('meta.inherited_attractor', 'none'),
            ],
            'autopoiesis' => [
                'mutation_history_size' => count(
                    Storage::disk('local')->directories('simulation/mutated_rules')
                ),
                'last_mutation_vector' => $state->get('meta.last_autopoiesis_vector', null),
            ],
        ]);
    }

    /**
     * GET /api/apex/informational-mass/{universeId}
     * Return the informational mass — the "weight" of meaning in the universe.
     */
    public function getInformationalMass(int $universeId): JsonResponse
    {
        $state = $this->stateManager->get();

        if (!$state || (int) $state->get('universe_id') !== $universeId) {
            return response()->json(['error' => 'State not loaded'], 404);
        }

        $density = (float) $state->get('meta.information_density', 0.0);
        $entropy = $state->getEntropy();
        $fields = $state->getFields();
        $tick = (int) $state->get('tick', 0);

        // Informational Mass = Σ(field contribution × (1 - field entropy weight))
        $fieldMass = array_sum(array_map(fn($v) => max(0, $v * (1 - $entropy)), $fields));
        $totalMass = $fieldMass * (1 + $density);

        return response()->json([
            'universe_id' => $universeId,
            'tick' => $tick,
            'informational_mass' => round($totalMass, 4),
            'information_density' => $density,
            'field_contributions' => array_map(
                fn($k, $v) => ['field' => $k, 'mass' => round(max(0, $v * (1 - $entropy)), 4)],
                array_keys($fields),
                array_values($fields)
            ),
            'singularity_risk' => $density > 0.95 ? 'CRITICAL' : ($density > 0.8 ? 'HIGH' : 'NORMAL'),
        ]);
    }

    /**
     * GET /api/apex/mutation-chronicle/{universeId}
     * List all autopoietic mutations applied to the active DSL layers.
     */
    public function getMutationChronicle(): JsonResponse
    {
        $dirs = Storage::disk('local')->directories('simulation/mutated_rules');
        $chronicle = [];

        foreach ($dirs as $dir) {
            $hash = basename($dir);
            $currentFile = "{$dir}/current.dsl";
            $versions = collect(Storage::disk('local')->files($dir))
                ->filter(fn($f) => str_starts_with(basename($f), 'v'))
                ->count();

            $chronicle[] = [
                'dsl_hash' => $hash,
                'version_count' => $versions,
                'has_current' => Storage::disk('local')->exists($currentFile),
            ];
        }

        return response()->json([
            'total_mutations' => count($chronicle),
            'chronicle' => $chronicle,
        ]);
    }

    /**
     * GET /api/apex/meaning-seeds
     * List all extracted meaning seeds from collapsed universes.
     */
    public function getMeaningSeeds(): JsonResponse
    {
        $files = Storage::disk('local')->files('simulation/meaning_seeds');
        $seeds = [];

        foreach ($files as $file) {
            $data = json_decode(Storage::disk('local')->get($file), true);
            if ($data) {
                $seeds[] = [
                    'source_universe' => $data['source_universe'],
                    'collapsed_at_tick' => $data['collapsed_at_tick'],
                    'attractor' => $data['attractor'],
                    'dominant_beliefs' => $data['dominant_beliefs'],
                    'entropy_at_collapse' => $data['entropy_at_collapse'],
                    'created_at' => $data['created_at'],
                ];
            }
        }

        return response()->json([
            'total_seeds' => count($seeds),
            'seeds' => $seeds,
        ]);
    }
    /**
     * GET /api/apex/v10/universes/{universeId}/state-at/{tick}
     * Vector 4: Time-Travel — wavefunction at a specific historical tick.
     */
    public function stateAtTick(int $universeId, int $tick): JsonResponse
    {
        $snapshot = UniverseSnapshot::where('universe_id', $universeId)
            ->where('tick', '<=', $tick)
            ->orderByDesc('tick')
            ->first();

        if (!$snapshot) {
            return response()->json(['error' => 'No snapshot at or before tick ' . $tick], 404);
        }

        $sv = is_string($snapshot->state_vector) ? json_decode($snapshot->state_vector, true) : ($snapshot->state_vector ?? []);
        $entropy   = (float) ($sv['entropy']        ?? $snapshot->entropy        ?? 0);
        $stability = (float) ($sv['stability_index'] ?? $snapshot->stability_index ?? 0);

        return response()->json([
            'universe_id'    => $universeId,
            'requested_tick' => $tick,
            'actual_tick'    => $snapshot->tick,
            'snapshot_id'    => $snapshot->id,
            'wavefunction'   => [
                'entropy'              => $entropy,
                'stability_index'      => $stability,
                'information_density'  => (float) ($sv['meta']['information_density'] ?? 0.0),
                'active_attractor'     => $sv['active_attractor'] ?? 'unknown',
                'collapse_probability' => round(max(0, min(1, $entropy * (1 - $stability))), 4),
            ],
            'metrics' => $snapshot->metrics ?? [],
        ]);
    }

    /**
     * GET /api/apex/v10/universes/{universeId}/delta?from={tick}&to={tick}
     * Vector 4: Delta comparison between two historic ticks.
     */
    public function compareDelta(int $universeId): JsonResponse
    {
        $fromTick = (int) request()->query('from', 0);
        $toTick   = (int) request()->query('to', PHP_INT_MAX);

        $snapA = UniverseSnapshot::where('universe_id', $universeId)
            ->where('tick', '<=', $fromTick)->orderByDesc('tick')->first();
        $snapB = UniverseSnapshot::where('universe_id', $universeId)
            ->where('tick', '<=', $toTick)->orderByDesc('tick')->first();

        if (!$snapA || !$snapB) {
            return response()->json(['error' => 'Snapshots not found for both ticks'], 404);
        }

        $mA = $snapA->metrics ?? [];
        $mB = $snapB->metrics ?? [];
        $metricDeltas = [];
        foreach (array_unique(array_merge(array_keys($mA), array_keys($mB))) as $k) {
            if (is_numeric($mA[$k] ?? null) && is_numeric($mB[$k] ?? null)) {
                $metricDeltas[$k] = round((float)$mB[$k] - (float)$mA[$k], 4);
            }
        }

        return response()->json([
            'universe_id'      => $universeId,
            'from_tick'        => $snapA->tick,
            'to_tick'          => $snapB->tick,
            'entropy_delta'    => round(($snapB->entropy ?? 0) - ($snapA->entropy ?? 0), 4),
            'stability_delta'  => round(($snapB->stability_index ?? 0) - ($snapA->stability_index ?? 0), 4),
            'tick_span'        => $snapB->tick - $snapA->tick,
            'metric_deltas'    => $metricDeltas,
        ]);
    }

    /**
     * GET /api/apex/v10/universes/{universeId}/topology
     * V8 Representative: Causal Topology Graph Data.
     */
    public function getTopology(int $universeId): JsonResponse
    {
        $state = $this->stateManager->get();
        if (!$state || (int) $state->get('universe_id') !== $universeId) {
            return response()->json(['error' => 'State not loaded'], 404);
        }

        $zones = $state->getZones();
        $neighbors = $state->getNeighboringRealities();
        
        $nodes = [];
        $edges = [];

        // Main nodes (Zones)
        foreach ($zones as $idx => $zone) {
            $nodes[] = [
                'id' => "zone_{$idx}",
                'type' => 'zone',
                'label' => $zone['name'] ?? "Vùng {$idx}",
                'metrics' => [
                    'population' => $zone['state']['population_proxy'] ?? 0.5,
                    'stability' => $zone['state']['stability'] ?? 1.0,
                ]
            ];
        }

        // Neighbor nodes (Multiverse)
        foreach ($neighbors as $n) {
            $nodes[] = [
                'id' => "uni_{$n['id']}",
                'type' => 'universe',
                'label' => $n['name'],
                'metrics' => [
                    'entropy' => $n['entropy'] ?? 0.5,
                    'similarity' => $n['similarity'] ?? 1.0,
                ]
            ];
            
            $edges[] = [
                'id' => "e_trade_{$universeId}_{$n['id']}",
                'source' => "uni_{$universeId}", // Current (virtual)
                'target' => "uni_{$n['id']}",
                'type' => 'quantum_trade',
                'label' => 'Quantum Trade Route',
                'intensity' => $n['similarity'] ?? 0.8
            ];
        }

        return response()->json([
            'universe_id' => $universeId,
            'tick' => (int)$state->get('tick'),
            'topology' => [
                'nodes' => $nodes,
                'edges' => $edges
            ]
        ]);
    }

    /**
     * GET /api/apex/v10/universes/{universeId}/consciousness
     * V10 Representative: Consciousness Heatmap Data.
     */
    public function getConsciousnessField(int $universeId): JsonResponse
    {
        $state = $this->stateManager->get();
        if (!$state || (int) $state->get('universe_id') !== $universeId) {
            return response()->json(['error' => 'State not loaded'], 404);
        }

        $zones = $state->getZones();
        $resonance = (float)$state->get('resonance_field', 0.0);
        $fields = $state->getFields();

        $heatmap = [];
        foreach ($zones as $idx => $zone) {
            // Mix global resonance with local zone metrics for heatmap
            $localBias = (float)($zone['state']['religious_pressure'] ?? 0.0) * 0.4 + 
                         (float)($zone['state']['innovation_pressure'] ?? 0.0) * 0.3;
            
            $heatmap[] = [
                'zone_id' => $idx,
                'x' => $zone['x'] ?? ($idx % 5),
                'y' => $zone['y'] ?? floor($idx / 5),
                'intensity' => round(min(1.0, $resonance * 0.6 + $localBias), 4),
                'phase' => $resonance > 0.8 ? 'APOTHEOSIS' : ($resonance > 0.4 ? 'AWAKENING' : 'DORMANT')
            ];
        }

        return response()->json([
            'universe_id' => $universeId,
            'global_resonance' => $resonance,
            'primary_dimension' => array_search(max($fields), $fields) ?: 'none',
            'heatmap' => $heatmap
        ]);
    }

    /**
     * GET /api/apex/v10/universes/{universeId}/ascension-filters
     * V9 Representative: Great Filter Radar Data.
     */
    public function getAscensionStatus(int $universeId): JsonResponse
    {
        $state = $this->stateManager->get();
        if (!$state || (int) $state->get('universe_id') !== $universeId) {
            return response()->json(['error' => 'State not loaded'], 404);
        }

        $fields = $state->getFields();
        $entropy = $state->getEntropy();
        $pressures = $state->getPressures();

        // Map internal state to 12 Great Filters (Phân tích ngẫu hứng nhưng có căn cứ)
        $filters = [
            ['id' => 'bio_entropy', 'name' => 'Entropy Sinh Học', 'status' => $entropy < 0.3 ? 'PASSED' : 'ACTIVE', 'progress' => min(1.0, 1.0 - $entropy)],
            ['id' => 'tech_singularity', 'name' => 'Kỳ Dị Công Nghệ', 'status' => ($fields['knowledge'] ?? 0) > 0.9 ? 'DANGER' : 'ACTIVE', 'progress' => $fields['knowledge'] ?? 0],
            ['id' => 'meaning_void', 'name' => 'Hư Vô Ý Nghĩa', 'status' => ($fields['meaning'] ?? 0) < 0.2 ? 'FAILED' : 'ACTIVE', 'progress' => $fields['meaning'] ?? 0.5],
            ['id' => 'causal_debt', 'name' => 'Nợ Nhân Quả', 'status' => ($pressures['collapse_pressure'] ?? 0) > 0.7 ? 'WARNING' : 'ACTIVE', 'progress' => 1.0 - ($pressures['collapse_pressure'] ?? 0)],
            ['id' => 'ascension_threshold', 'name' => 'Ngưỡng Cửa Thăng Hoa', 'status' => ($pressures['ascension_pressure'] ?? 0) > 0.8 ? 'OPEN' : 'LOCKED', 'progress' => $pressures['ascension_pressure'] ?? 0],
        ];

        return response()->json([
            'universe_id' => $universeId,
            'singularity_probability' => round(($fields['knowledge'] ?? 0.1) * (1 - ($pressures['stability'] ?? 0.5)), 4),
            'filters' => $filters
        ]);
    }
}

