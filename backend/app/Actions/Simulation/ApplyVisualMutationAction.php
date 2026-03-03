<?php

namespace App\Actions\Simulation;

use App\Models\LegendaryAgent;
use App\Models\Universe;
use App\Models\VisualBranch;
use App\Services\AI\VisualDnaEngine;
use App\Services\Saga\SagaService;
use Illuminate\Support\Facades\Log;

/**
 * ApplyVisualMutationAction: Orchestrates the evolution of legendary identity (§V13).
 * Triggers Universal Bifurcation (Universe Fork) when identity drift is too high.
 */
class ApplyVisualMutationAction
{
    public function __construct(
        protected VisualDnaEngine $dnaEngine,
        protected SagaService $sagaService
    ) {}

    /**
     * Apply an identity mutation to a legend.
     */
    public function execute(LegendaryAgent $legend, string $type, int $severity, int $tick): void
    {
        // Get the active branch for this legend in this universe
        $activeBranch = $legend->universe->visualBranches()
            ->where('legendary_agent_id', $legend->id)
            ->latest()
            ->first();

        if (!$activeBranch) {
            $this->dnaEngine->getOrCreateRootDna($legend);
            $activeBranch = $legend->universe->visualBranches()->where('legendary_agent_id', $legend->id)->first();
        }

        $resultBranch = $this->dnaEngine->applyMutation($activeBranch, $type, $severity, $tick);

        // Check if a fork (Universal Bifurcation) occurred
        if ($resultBranch->id !== $activeBranch->id) {
            $this->handleBifurcation($legend->universe, $resultBranch, $tick);
        }
    }

    protected function handleBifurcation(Universe $universe, VisualBranch $newBranch, int $tick): void
    {
        Log::warning("UNIVERSAL BIFURCATION: Forking Universe #{$universe->id} due to legend identity drift.");

        // Phase 74: Universal Bifurcation (§V13)
        // Fork the entire universe state
        $childUniverse = $this->sagaService->spawnUniverse(
            $universe->world,
            $universe->id,
            $universe->saga_id
        );

        // Link the new branch to the new universe if necessary
        // In this architecture, visual_branches are attached to a universe conceptually or stored per-universe.
        // Let's ensure the child universe knows about this new identity path.
        
        $newBranch->update([
             'fork_reason' => $newBranch->fork_reason . " -> Universe [{$childUniverse->id}] born."
        ]);

        Log::info("Cosmogenesis: Universe #{$childUniverse->id} created from identity fork.");
    }
}
