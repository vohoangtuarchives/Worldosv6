<?php

namespace App\Simulation\Engines;

use App\Simulation\Runtime\State\WorldState;
use App\Services\Simulation\RuleMutationService;
use Illuminate\Support\Facades\Log;

/**
 * Phase 74: Autopoietic Evolution Engine (Self-Modifying Logic) 🧬💻
 *
 * "Mã nguồn không còn là hằng số, nó là một thực thể sống."
 * Thực hiện đột biến thực sự vào các file DSL dựa trên áp lực thực tại.
 */
class AutopoieticEvolutionEngine
{
    public function __construct(
        protected RuleMutationService $mutationService
    ) {}

    /**
     * Evolve a specific DSL logic based on reality pressure.
     */
    public function evolveLogic(string $dslPath, WorldState $state): array
    {
        $entropy = (float) $state->get('entropy', 0.5);
        $density = (float) $state->get('meta.information_density', 0.0);
        $universeId = (int) $state->get('universe_id');

        // 1. Load existing mutated or original content
        $content = $this->mutationService->getMutatedContent($dslPath);
        if (!$content) {
            $fullPath = resource_path("worldos_rules/{$dslPath}");
            if (!str_ends_with($fullPath, '.dsl')) {
                $fullPath .= '.dsl';
            }
            $content = file_exists($fullPath) ? file_get_contents($fullPath) : null;
        }

        if (!$content) {
            return ['error' => "Source DSL not found: $dslPath", 'path' => $dslPath, 'changed' => false];
        }

        $original = $content;
        $mutationVector = null;

        // 2. Entropy Spike → inject stabilization guard
        if ($entropy > 0.85 && !str_contains($content, '# autopoiesis_stabilize')) {
            $content .= "\n# autopoiesis_stabilize (injected)\ndrift 'entropy' by -0.05 if entropy > 0.8";
            $mutationVector = 'Entropy Management';
        }

        // 3. Singularity pressure → halve physics drift increments
        if ($density > 0.9 && !str_contains($content, '# autopoiesis_optimize')) {
            $content = preg_replace(
                "/(drift '[\w.]+' by )([\d.]+)(?!\s*#\s*autopoiesis_optimize)/",
                '$1' . '$2 * 0.5 # autopoiesis_optimize',
                $content,
                5 // limit replacements
            );
            $mutationVector = ($mutationVector ?? '') . ' Complexity Optimization';
        }

        // 4. Stability collapse → reset observation load
        $stability = (float) $state->get('stability_index', 1.0);
        if ($stability < 0.25 && !str_contains($content, '# autopoiesis_reset_obs')) {
            $content .= "\n# autopoiesis_reset_obs\nset 'meta.observation_load' to 0.0";
            $mutationVector = ($mutationVector ?? '') . ' Observer Reset';
        }

        // 5. Persist only if changed
        if ($content !== $original && $mutationVector) {
            $this->mutationService->applyMutation($dslPath, $content, [
                'universe_id' => $universeId,
                'entropy' => $entropy,
                'density' => $density,
                'stability' => $stability,
                'vector' => trim($mutationVector),
            ]);

            Log::info("Autopoiesis: Evolved [{$dslPath}] | Vector: {$mutationVector}", compact('universeId', 'entropy', 'density'));

            return [
                'path' => $dslPath,
                'vector' => trim($mutationVector),
                'changed' => true,
                'timestamp' => now()->toIso8601String(),
            ];
        }

        return [
            'path' => $dslPath,
            'changed' => false,
        ];
    }

    /**
     * Run autopoietic check across all key DSL layers.
     * Call this from MetaCosmicStage or a dedicated AutopoiesisTick.
     */
    public function runWithState(WorldState $state, int $currentTick): void
    {
        $interval = (int) config('worldos.autopoiesis.tick_interval', 500);
        if ($interval <= 0 || $currentTick % $interval !== 0) {
            return;
        }

        $targets = [
            'simulation/physics',
            'simulation/integrity',
            'simulation/autopoiesis',
            'biology/biosphere',
            'simulation/consciousness',
        ];

        foreach ($targets as $dsl) {
            $result = $this->evolveLogic($dsl, $state);
            if ($result['changed'] ?? false) {
                event(new \App\Events\Simulation\SimulationEventOccurred(
                    (int) $state->get('universe_id'),
                    'AUTOPOIESIS_MUTATION',
                    $currentTick,
                    $result
                ));
            }
        }
    }
}
