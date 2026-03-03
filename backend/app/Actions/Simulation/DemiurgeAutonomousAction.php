<?php

namespace App\Actions\Simulation;

use App\Models\Demiurge;
use App\Models\Universe;
use App\Services\AI\DemiurgeRegistry;
use App\Actions\Simulation\CelestialEngineeringAction;
use App\Actions\Simulation\DivineInquisitionAction;
use Illuminate\Support\Facades\Log;

/**
 * DemiurgeAutonomousAction: The engine of cosmic rivalry (§V14).
 * Allows AI Demiurges to act upon the multiverse without Architect intervention.
 */
class DemiurgeAutonomousAction
{
    public function __construct(
        protected DemiurgeRegistry $registry,
        protected CelestialEngineeringAction $engineering,
        protected DivineInquisitionAction $inquisition
    ) {}

    /**
     * Execute autonomous decisions for all active Demiurges.
     */
    public function execute(): void
    {
        $rivals = $this->registry->getActiveRivals();

        if ($rivals->isEmpty()) {
            $this->registry->seedPantheon();
            $rivals = $this->registry->getActiveRivals();
        }

        $universes = Universe::where('status', 'active')->get();

        if ($universes->isEmpty()) return;

        foreach ($rivals as $demiurge) {
            $this->processDemiurgeWill($demiurge, $universes);
        }
    }

    protected function processDemiurgeWill(Demiurge $demiurge, $universes): void
    {
        // Pick a universe to inspect (could be random or targeted)
        $target = $universes->random();
        
        $config = $demiurge->config;
        $targetSci = $config['target_sci'] ?? 0.5;
        $targetEntropy = $config['target_entropy'] ?? 0.5;

        // Determine if intervention is needed
        $sciDiff = abs($target->structural_coherence - $targetSci);
        $entropyDiff = abs($target->entropy - $targetEntropy);

        if ($sciDiff > 0.2 || $entropyDiff > 0.2) {
            $this->issueAutonomousEdict($demiurge, $target, $sciDiff, $entropyDiff);
        }

        // Phase 104: The War in Heaven (§V23)
        // If a Demiurge has excess essence, they might trigger a purge to assert dominance
        if ($demiurge->essence_pool >= 50 && rand(1, 100) <= 20) {
            $this->inquisition->execute($target, $demiurge);
        }
    }

    protected function issueAutonomousEdict(Demiurge $demiurge, Universe $universe, float $sciDiff, float $entropyDiff): void
    {
        Log::info("MYTHOS: Demiurge [{$demiurge->name}] is acting upon Universe #{$universe->id}.");

        $sciImpact = ($demiurge->config['target_sci'] > $universe->structural_coherence) ? 0.05 : -0.05;
        $entropyImpact = ($demiurge->config['target_entropy'] > $universe->entropy) ? 0.05 : -0.05;

        $payload = [
            'name' => "Divine Will: " . $demiurge->name,
            'demiurge_id' => $demiurge->id,
            'sci_impact' => $sciImpact,
            'entropy_impact' => $entropyImpact,
        ];

        // Execute via existing engineering engine to respect ripple effects and chronicles
        $this->engineering->executeMacro(
            $universe->world_id,
            'macro_edict',
            $payload
        );
    }
}
