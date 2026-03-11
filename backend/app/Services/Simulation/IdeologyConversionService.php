<?php

namespace App\Services\Simulation;

use App\Models\Universe;

/**
 * Doc §10: Conversion probability (ideology A → B) from legitimacy and coherence.
 * Used by IdeologyEvolutionEngine to store conversion_rate_per_tick in state.
 */
final class IdeologyConversionService
{
    private const IDEOLOGY_KEYS = ['tradition', 'innovation', 'trust', 'violence', 'respect', 'myth'];

    /**
     * Compute probability per tick that population/institutions shift toward target ideology.
     * Higher legitimacy_aggregate and cultural_coherence increase conversion rate.
     */
    public function conversionProbability(Universe $universe, array $fromIdeology, array $toIdeology): float
    {
        $state = $this->getStateVector($universe);
        $legitimacy = (float) ($state['civilization']['politics']['legitimacy_aggregate'] ?? $state['civilization']['politics']['legitimacy'] ?? 0.5);
        $coherence = (float) ($state['cultural_coherence'] ?? 0.4);

        $distance = 0.0;
        $n = 0;
        foreach (self::IDEOLOGY_KEYS as $k) {
            $a = (float) ($fromIdeology[$k] ?? 0.5);
            $b = (float) ($toIdeology[$k] ?? 0.5);
            $distance += abs($b - $a);
            $n++;
        }
        $distance = $n > 0 ? $distance / $n : 0;

        $baseRate = (float) config('worldos.ideology_evolution.conversion_base_rate', 0.01);
        $legitimacyFactor = 0.5 + 0.5 * $legitimacy;
        $coherenceFactor = 0.5 + 0.5 * $coherence;
        $distanceFactor = min(1.0, $distance * 2);

        $rate = $baseRate * $legitimacyFactor * $coherenceFactor * $distanceFactor;
        return round(max(0.0, min(0.1, $rate)), 6);
    }

    /**
     * Compute and return conversion rate from current dominant to previous (for drift tracking).
     */
    public function conversionRateToPrevious(Universe $universe): float
    {
        $state = $this->getStateVector($universe);
        $current = $state['dominant_ideology'] ?? null;
        $previous = $state['previous_dominant_ideology'] ?? null;
        if (! is_array($current) || ! is_array($previous)) {
            return 0.0;
        }
        return $this->conversionProbability($universe, $previous, $current);
    }

    private function getStateVector(Universe $universe): array
    {
        $sv = $universe->state_vector;
        if (is_string($sv)) {
            $sv = json_decode($sv, true) ?? [];
        }
        return is_array($sv) ? $sv : [];
    }
}
