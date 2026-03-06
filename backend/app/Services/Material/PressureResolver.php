<?php

namespace App\Services\Material;

use App\Models\MaterialInstance;

/**
 * Pressure Resolver: Δ = k · Output · pressure_* (per WORLDOS_V6 §8.3).
 * Returns deltas keyed by vector (entropy, order, innovation, growth, trauma...).
 */
class PressureResolver
{
    protected float $k = 0.01;

    public function apply(MaterialInstance $instance, array $context): array
    {
        $material = $instance->material;
        $coefficients = $material->pressure_coefficients ?? [];
        if (empty($coefficients)) {
            $material->load('pressures');
            $coefficients = $this->fromPressuresRelation($material);
        }

        // Calculate Base Output
        $output = 0.0;
        $outputs = $material->outputs ?? [];
        if (!empty($outputs)) {
            foreach ($outputs as $key => $weight) {
                $output += ($context[$key] ?? 0) * (is_numeric($weight) ? $weight : 1);
            }
            $output = max(0.01, $output);
        } else {
            $output = 1.0;
        }

        // Apply Resonance (Non-linear amplification if multiple instances of same ontology exist)
        $resonanceFactor = 1.0;
        if (isset($context['ontology_counts'][$material->ontology])) {
            $count = $context['ontology_counts'][$material->ontology];
            if ($count > 1) {
                // Resonance: output increases logarithmically with count
                $resonanceFactor = 1.0 + (log($count) * 0.2); 
            }
        }

        // Apply Scars (World Scars dampen or amplify certain pressures)
        $scars = $context['scars'] ?? [];
        $activeEdicts = $context['active_edicts'] ?? [];

        $scarTypes = array_map(function($s) {
            return is_array($s) ? ($s['type'] ?? '') : (is_string($s) ? $s : ($s->type ?? ''));
        }, $scars);

        $deltas = [];
        foreach ($coefficients as $vectorKey => $coef) {
            $val = $this->k * $output * (is_numeric($coef) ? $coef : 0) * $resonanceFactor;

            // Apply specific scar effects
            if ($vectorKey === 'order' && in_array('civil_war_scar', $scarTypes)) {
                $val *= 0.5; // Order is harder to build after civil war
            }
            if ($vectorKey === 'entropy' && in_array('nuclear_fallout', $scarTypes)) {
                $val *= 1.5; // Entropy increases faster
            }

            // Apply Supreme Edicts
            foreach ($activeEdicts as $edict) {
                if ($edict['target'] === $vectorKey) {
                    $val *= (float) $edict['multiplier'];
                }
            }

            $deltas[$vectorKey] = $val;
        }

        return $deltas;
    }

    protected function fromPressuresRelation($material): array
    {
        $out = [];
        foreach ($material->pressures as $p) {
            $out[$p->vector_key] = (float) $p->coefficient;
        }
        return $out;
    }
}
