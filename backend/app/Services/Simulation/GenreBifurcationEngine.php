<?php

namespace App\Services\Simulation;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Models\Chronicle;

class GenreBifurcationEngine
{
    /**
     * Evaluate the universe's current state against genre attractors
     * and trigger a phase transition if it falls into a new gravity well.
     */
    public function evaluateAndShift(Universe $universe, UniverseSnapshot $snapshot): void
    {
        $world = $universe->world;
        if (!$world) {
            return;
        }

        $basins = config('worldos_genre_dynamics.basins', []);

        // 1. Extract Current State Vector
        // We map existing metrics to the 4 attractor dimensions [0.0 - 1.0]
        $metrics = is_string($snapshot->metrics) ? json_decode($snapshot->metrics, true) : ($snapshot->metrics ?? []);
        $ethos = $metrics['ethos'] ?? [];

        $spirituality = (float) ($ethos['spirituality'] ?? 0.5);
        $hardtech = (float) ($ethos['openness'] ?? 0.5);
        $entropy = (float) ($snapshot->entropy ?? 0.5);
        $energyLevel = (float) ($metrics['energy_level'] ?? (min(1.0, ($snapshot->stability_index ?? 0.5) * 1.5)));

        $state = [
            'spirituality' => $spirituality,
            'hardtech' => $hardtech,
            'entropy' => $entropy,
            'energy_level' => $energyLevel,
        ];

        // 2. Calculate Forces & Weights across Potential Fields
        $weights = [];
        $netForce = [
            'spirituality' => 0.0,
            'hardtech' => 0.0,
            'entropy' => 0.0,
            'energy_level' => 0.0,
        ];

        $totalWeightSum = 0.0;

        foreach ($basins as $genre => $basin) {
            $center = $basin['center'];
            $radius = $basin['field_radius'] ?? 0.2;
            $elasticity = $basin['drift_elasticity'] ?? 0.5;

            $distance = $this->calculateEuclideanDistance($state, $center);

            // If within a meaningful gravity well (e.g., 2.5x radius)
            if ($distance < $radius * 2.5) {
                // Exponential decay of force based on distance
                $pullStrength = exp(-($distance * $distance) / ($radius * $radius)) * $elasticity;

                if ($pullStrength > 0.01) {
                    $weights[$genre] = $pullStrength;
                    $totalWeightSum += $pullStrength;

                    // Accumulate vector difference to apply gradient force
                    foreach (['spirituality', 'hardtech', 'entropy', 'energy_level'] as $dim) {
                        $diff = $center[$dim] - $state[$dim];
                        $netForce[$dim] += $diff * $pullStrength * 0.05; // 0.05 is the dt (drift rate per tick)
                    }
                }
            }
        }

        // 3. Update State via Gradient Flow (Pull the universe slightly)
        foreach (['spirituality', 'hardtech', 'entropy', 'energy_level'] as $dim) {
            $state[$dim] += $netForce[$dim];
            $state[$dim] = max(0.0, min(1.0, $state[$dim])); // Clamp to 0-1
        }

        // Save drifting state back to snapshot
        $ethos['spirituality'] = $state['spirituality'];
        $ethos['openness'] = $state['hardtech'];
        $metrics['ethos'] = $ethos;
        $metrics['energy_level'] = $state['energy_level'];
        
        $snapshot->entropy = $state['entropy'];
        $snapshot->metrics = $metrics;
        $snapshot->save();

        // 4. Normalize Weights for the Hybrid Record
        if ($totalWeightSum > 0) {
            foreach ($weights as $g => $w) {
                $weights[$g] = round($w / $totalWeightSum, 3);
            }
            arsort($weights);
        }

        // Determine the dominant basin
        $dominantGenre = !empty($weights) ? array_key_first($weights) : 'historical';
        $oldDominant = $world->current_genre;

        // Apply Hybrid Composition
        $world->active_genre_weights = $weights;
        $world->current_genre = $dominantGenre;
        $world->save();

        // 5. Phase Transition Check
        if ($oldDominant && $oldDominant !== $dominantGenre && ($weights[$dominantGenre] ?? 0) > 0.4) {
            $this->executePhaseTransition($universe, $oldDominant, $dominantGenre, $weights, $snapshot->tick);
        }
    }

    private function calculateEuclideanDistance(array $state, array $attractor): float
    {
        $sum = 0.0;
        foreach (['spirituality', 'hardtech', 'entropy', 'energy_level'] as $dim) {
            $diff = ($state[$dim] ?? 0.5) - ($attractor[$dim] ?? 0.5);
            $sum += $diff * $diff;
        }
        return sqrt($sum);
    }

    private function executePhaseTransition(Universe $universe, string $oldGenre, string $newGenre, array $weights, int $tick): void
    {
        $genresConfig = config('worldos_genres.genres', []);
        $oldName = $genresConfig[$oldGenre]['name'] ?? $oldGenre;
        $newName = $genresConfig[$newGenre]['name'] ?? $newGenre;

        // Build hybrid composition text
        $hybridText = collect($weights)->take(3)->map(function ($weight, $key) use ($genresConfig) {
            $name = $genresConfig[$key]['name'] ?? $key;
            $percent = round($weight * 100) . '%';
            return "{$name} ({$percent})";
        })->implode(', ');

        $flavorText = "Trọng lực thực tại sụp đổ và tái cấu trúc. Điểm kỳ dị mở ra một Phase Basin mới. Vũ trụ đã trượt từ rãnh [{$oldName}] sang [{$newName}]. Hình thái lai tạo hiện tại: {$hybridText}.";

        Chronicle::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'to_tick' => $tick,
            'type' => 'phase_transition',
            'raw_payload' => [
                'action' => 'legacy_event',
                'description' => $flavorText
            ],
        ]);
        
        \App\Models\BranchEvent::create([
            'universe_id' => $universe->id,
            'from_tick' => $tick,
            'event_type' => 'phase_transition',
            'payload' => [
                'old_genre' => $oldGenre,
                'new_genre' => $newGenre,
                'composition' => $weights,
                'description' => $flavorText,
            ],
        ]);
    }
}
