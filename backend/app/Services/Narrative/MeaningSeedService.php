<?php

namespace App\Services\Narrative;

use App\Simulation\Runtime\State\WorldState;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Phase 75: Meaning Seed Service 🕸️💎
 *
 * "Linh hồn đa vũ trụ" - When a universe collapses, its deepest meaning
 * is distilled into a "Seed" that persists across the void.
 *
 * Seeds are inherited by successor universes to ensure causal continuity.
 */
class MeaningSeedService
{
    protected string $storagePath = 'simulation/meaning_seeds';

    /**
     * Extract a Meaning Seed from a dying universe.
     * Call this during universe collapse handling (e.g., in AscensionEngine or CollapseEngine).
     */
    public function extractSeed(int $universeId, WorldState $state, int $tick): array
    {
        $civilizationData = $state->getCivilization();
        $ecosystemData    = $state->getEcosystem();
        $fields           = $state->getFields();
        $pressures        = $state->getPressures();
        $scars            = $state->getScars();
        $attractor        = $state->getActiveAttractor();
        $entropy          = $state->getEntropy();

        // Core Meaning: distill the 3 most dominant ideological fields
        $beliefFields = array_filter($fields, fn($v) => $v > 0.5, ARRAY_FILTER_USE_BOTH);
        arsort($beliefFields);
        $dominantBeliefs = array_slice(array_keys($beliefFields), 0, 3);

        // Deep Scars: only carry forward the most impactful ones
        $deepScars = array_slice(array_filter($scars, fn($s) => (float)($s['severity'] ?? 0) > 0.7), 0, 5);

        $seed = [
            'source_universe' => $universeId,
            'collapsed_at_tick' => $tick,
            'attractor' => $attractor,
            'entropy_at_collapse' => $entropy,
            'dominant_beliefs' => $dominantBeliefs,
            'deep_scars' => array_values($deepScars),
            'population_peak' => (float)($civilizationData['population_peak'] ?? $civilizationData['population'] ?? 0),
            'biodiversity_echo' => (float)($ecosystemData['biodiversity'] ?? 0.5),
            'fate_pressure' => (float)($pressures['fate_pressure'] ?? 0.0),
            'created_at' => now()->toIso8601String(),
        ];

        $this->persistSeed($universeId, $seed);

        Log::info("MeaningSeedService: Seed extracted from Universe {$universeId} at tick {$tick}", compact('attractor', 'dominantBeliefs'));

        return $seed;
    }

    /**
     * Inject seeds from past universes into a new universe's WorldState.
     * Call this during universe initialization (seeding phase).
     */
    public function injectSeeds(int $newUniverseId, WorldState $state, array $ancestorIds = []): void
    {
        $seeds = $this->loadSeeds($ancestorIds);
        if (empty($seeds)) {
            return;
        }

        $aggregated = $this->aggregateSeeds($seeds);

        // Apply seed to WorldState
        $state->set('meta.residual_seeds', $seeds);
        $state->set('meta.inherited_attractor', $aggregated['dominant_attractor'] ?? 'none');
        $state->set('pressures.fate_pressure', min(0.5, $aggregated['avg_fate_pressure']));
        $state->set('meta.deep_scars_legacy', $aggregated['legacy_scars']);

        // Boost fields that match inherited beliefs
        $fields = $state->getFields();
        foreach ($aggregated['dominant_beliefs'] as $belief) {
            if (isset($fields[$belief])) {
                $fields[$belief] = min(1.0, $fields[$belief] + 0.1);
            }
        }
        $state->setFields($fields);

        Log::info("MeaningSeedService: Injected {count($seeds)} seeds into Universe {$newUniverseId}");
    }

    private function persistSeed(int $universeId, array $seed): void
    {
        $path = "{$this->storagePath}/universe_{$universeId}.json";
        Storage::disk('local')->put($path, json_encode($seed, JSON_PRETTY_PRINT));
    }

    private function loadSeeds(array $ancestorIds): array
    {
        $seeds = [];
        foreach ($ancestorIds as $id) {
            $path = "{$this->storagePath}/universe_{$id}.json";
            if (Storage::disk('local')->exists($path)) {
                $data = json_decode(Storage::disk('local')->get($path), true);
                if ($data) {
                    $seeds[] = $data;
                }
            }
        }
        return $seeds;
    }

    private function aggregateSeeds(array $seeds): array
    {
        $attractors = array_column($seeds, 'attractor');
        $attractorCounts = array_count_values($attractors);
        arsort($attractorCounts);

        $allBeliefs = [];
        $allScars = [];
        $totalFate = 0.0;
        foreach ($seeds as $seed) {
            foreach ($seed['dominant_beliefs'] as $b) {
                $allBeliefs[$b] = ($allBeliefs[$b] ?? 0) + 1;
            }
            foreach ($seed['deep_scars'] as $scar) {
                $allScars[] = $scar;
            }
            $totalFate += (float)($seed['fate_pressure'] ?? 0);
        }

        arsort($allBeliefs);

        return [
            'dominant_attractor' => array_key_first($attractorCounts),
            'dominant_beliefs'   => array_slice(array_keys($allBeliefs), 0, 3),
            'legacy_scars'       => array_slice($allScars, 0, 5),
            'avg_fate_pressure'  => $totalFate / max(1, count($seeds)),
        ];
    }
}
