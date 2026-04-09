<?php

declare(strict_types=1);

namespace App\Modules\Simulation\Actions;

use App\Modules\Simulation\Core\Runtime\State\StateManager;
use App\Modules\Simulation\Core\Runtime\State\WorldState;
use Illuminate\Support\Facades\Storage;

/**
 * Phase 77: Apex Observer — Dashboard Data Aggregation
 *
 * Extracts state-based dashboard projection logic from ApexObserverController.
 * Handles: wavefunction, informational mass, topology, consciousness, ascension filters.
 */
class QueryObserverDashboardAction
{
    public function __construct(
        protected StateManager $stateManager,
    ) {}

    /**
     * Project the full causal wavefunction of a universe.
     */
    public function projectWavefunction(int $universeId): ?array
    {
        $state = $this->ensureStateLoaded($universeId);

        if (!$state) {
            return null;
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

        return [
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
                'enabled' => (bool) config('worldos.autopoiesis.enabled', true),
                'entropy_threshold' => (float) config('worldos.autopoiesis.entropy_threshold', 0.70),
                'mutation_history_size' => count(
                    Storage::disk('local')->directories('simulation/mutated_rules')
                ),
                'last_mutation_vector' => $state->get('meta.last_autopoiesis_vector', null),
            ],
        ];
    }

    /**
     * Return the informational mass — the "weight" of meaning in the universe.
     */
    public function getInformationalMass(int $universeId): ?array
    {
        $state = $this->ensureStateLoaded($universeId);

        if (!$state) {
            return null;
        }

        $density = (float) $state->get('meta.information_density', 0.0);
        $entropy = $state->getEntropy();
        $fields = $state->getFields();
        $tick = (int) $state->get('tick', 0);

        // Informational Mass = Σ(field contribution × (1 - field entropy weight))
        $fieldMass = array_sum(array_map(fn($v) => max(0, $v * (1 - $entropy)), $fields));
        $totalMass = $fieldMass * (1 + $density);

        return [
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
        ];
    }

    /**
     * Causal Topology Graph Data.
     */
    public function getTopology(int $universeId): ?array
    {
        $state = $this->ensureStateLoaded($universeId);
        if (!$state) {
            return null;
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

        return [
            'universe_id' => $universeId,
            'tick' => (int)$state->get('tick'),
            'topology' => [
                'nodes' => $nodes,
                'edges' => $edges
            ]
        ];
    }

    /**
     * Consciousness Heatmap Data.
     */
    public function getConsciousnessField(int $universeId): ?array
    {
        $state = $this->ensureStateLoaded($universeId);
        if (!$state) {
            return null;
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

        return [
            'universe_id' => $universeId,
            'global_resonance' => $resonance,
            'primary_dimension' => array_search(max($fields), $fields) ?: 'none',
            'heatmap' => $heatmap
        ];
    }

    /**
     * Great Filter Radar Data.
     */
    public function getAscensionStatus(int $universeId): ?array
    {
        $state = $this->ensureStateLoaded($universeId);
        if (!$state) {
            return null;
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

        return [
            'universe_id' => $universeId,
            'singularity_probability' => round(($fields['knowledge'] ?? 0.1) * (1 - ($pressures['stability'] ?? 0.5)), 4),
            'filters' => $filters
        ];
    }

    /**
     * Internal helper to ensure the state for a specific universe is loaded.
     */
    protected function ensureStateLoaded(int $universeId): ?WorldState
    {
        $state = $this->stateManager->get();

        if (!$state || (int) $state->get('universe_id') !== $universeId) {
            $universe = \App\Models\Universe::find($universeId);
            if (!$universe) {
                return null;
            }
            $state = $this->stateManager->load($universe);
        }

        return $state;
    }
}
