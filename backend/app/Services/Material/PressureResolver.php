<?php

namespace App\Services\Material;

use App\Models\MaterialInstance;

/**
 * Pressure Resolver: Δ = k · Output · pressure_* (per WORLDOS_V6 §8.3).
 * Returns deltas keyed by vector (entropy, order, innovation, growth, trauma...).
 */
class PressureResolver
{
    protected float $k_base = 0.003;

    public function __construct(
        protected \App\Services\Simulation\RuleVmService $ruleVm
    ) {
        $this->ruleVm = $ruleVm ?? \app(\App\Services\Simulation\RuleVmService::class);
    }

    public function apply(MaterialInstance $instance, array $context): array
    {
        $material = $instance->material;
        if (!$material) {
            return [];
        }
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
        $dsl = @file_get_contents(\resource_path('worldos_rules/material/lifecycle.dsl')) ?: '';
        
        $vmState = [
            'k' => $this->k_base,
            'output' => $output,
            'resonance' => $resonanceFactor,
            'coefficients' => $coefficients,
            'scars' => $scarTypes,
            'edicts' => $activeEdicts
        ];

        $result = $this->ruleVm->evaluateRawState($vmState, $dsl);
        $deltas = $result['state']['deltas'] ?? [];

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
