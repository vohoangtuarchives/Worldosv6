<?php

namespace App\Modules\Intelligence\Actions;

use App\Models\Universe;
use App\Modules\Intelligence\Domain\Rng\SimulationRng;
use App\Modules\Intelligence\Domain\Entropy\EntropyBudget;
use App\Modules\Intelligence\Domain\Society\SocialFieldCalculator;
use App\Modules\Intelligence\Domain\Society\SocietyMetricsCalculator;
use App\Modules\Intelligence\Domain\Phase\PhaseDetector;
use App\Modules\Intelligence\Services\CognitiveDynamicsEngine;
use App\Modules\Intelligence\Services\ActorTransitionSystem;
use App\Modules\Intelligence\Services\ReplicatorDistributionUpdater;
use App\Modules\Intelligence\Services\MacroStateEvolution;
use App\Modules\Intelligence\Services\SocietyAnalyzer;
use Illuminate\Support\Facades\Log;

class RunMicroCycleAction
{
    public function __construct(
        private SocialFieldCalculator $socialFieldCalculator,
        private CognitiveDynamicsEngine $cognitiveDynamicsEngine,
        private ActorTransitionSystem $transitionSystem,
        private UpdateArchetypeAction $updateArchetypeAction,
        private ReplicatorDistributionUpdater $replicatorUpdater,
        private SocietyMetricsCalculator $metricsCalculator,
        private PhaseDetector $phaseDetector,
        private MacroStateEvolution $macroEvolution,
        private SocietyAnalyzer $societyAnalyzer
    ) {}

    /**
     * Entry point for running 1 full meta-cycle as defined in Phase 6 Orchestration.
     * Note: In a true 100k scale, this would be delegated to Rust via gRPC. 
     * This is the PHP canonical reference implementation.
     */
    public function handle(Universe $universe, int $tick, array $actorStates, array $worldAxiom): array
    {
        $globalEntropy = $universe->entropy ?? 0.5;
        $seed = $universe->seed ?? 0;
        
        $budget = new EntropyBudget($globalEntropy, count($actorStates));
        
        // 1. Calculate Social Field
        $socialField = $this->socialFieldCalculator->calculate($actorStates);

        // Compute Ratios up front for use in Archetype updating
        $ratios = $this->replicatorUpdater->computeRatios($actorStates);
        
        // Compute Phase early so it can be passed to Archetype update (landscape multipliers)
        // Note: Standard delay expects Macro to read N-1 snapshot, so we pass current universe state.
        $metricsResult = $this->computeMetricsAndPhase($universe, $actorStates, $ratios, $tick);
        $phaseScore = $metricsResult['phase'];

        // Iterate over actors applying pure transitions
        $nextActorStates = [];
        foreach ($actorStates as $actor) {
            $rng = new SimulationRng($seed, $tick, $actor->id ?? 0);
            
            // Step 1: Cognitive Dynamics
            $actor = $this->cognitiveDynamicsEngine->update($actor, $socialField, $rng, $budget);
            
            // Step 2: Traits evolution (Actions mapping is skipped in pure cycle unless injected, 
            // so we rely on drift & cognitive engine for trait updates normally.
            
            // Survival check
            $actor = $this->transitionSystem->processSurvival($actor, $globalEntropy, $rng);

            // Step 3: Drift & Update Archetype 
            // We pass in phaseScore for fitness landscape calculation
            $actor = $this->updateArchetypeAction->handle($actor, $worldAxiom, $globalEntropy, $ratios, $phaseScore);
            
            $nextActorStates[] = $actor;
        }

        // Step 4: Recompute new ratios post-drift
        $newRatios = $this->replicatorUpdater->computeRatios($nextActorStates);

        // Step 5: Factions Detection (Phase 7 Emergent Factions)
        $fragmentedScore = $phaseScore->fragmented;
        $factionsToSpawn = $this->societyAnalyzer->detectEmergentFactions($newRatios, $fragmentedScore);
        $this->societyAnalyzer->storeFactions($universe, $factionsToSpawn, $tick);

        // Step 6: Macro State Evolution
        $macroRng = new SimulationRng($seed, $tick, 999999);
        $rngNoise = ($macroRng->nextFloat() * 2 - 1); 
        
        $universe = $this->macroEvolution->evolve(
            $universe, 
            $newRatios, 
            $metricsResult['polarization'], 
            $rngNoise
        );

        // Step 7: Verify Determinism Hash
        $hash = $this->canonicalizeAndHash($nextActorStates, $universe);
        
        return [
            'universe' => $universe,
            'actors' => $nextActorStates,
            'metrics' => [
                'entropy' => $universe->entropy,
                'polarization_index' => $metricsResult['polarization'],
                'social_cohesion' => $metricsResult['cohesion'],
                'cultural_momentum' => $metricsResult['momentum'],
                'phase_score' => $phaseScore->toArray(),
                'archetype_distribution' => $newRatios,
                'snapshot_hash' => $hash
            ]
        ];
    }

    private function computeMetricsAndPhase(Universe $universe, array $actorStates, array $ratios, int $tick): array
    {
        $polarization = $this->metricsCalculator->calculatePolarization($actorStates);
        $cohesion = $this->metricsCalculator->calculateSocialCohesion($actorStates, $polarization);
        $phase = $this->phaseDetector->detect($universe->entropy ?? 0.5, $polarization, $universe->level ?? 1);
        
        $historicalPhaseScores = $universe->state_vector['historical_phase_scores'] ?? [];
        $historicalPhaseScores[] = $phase->toArray();
        if (count($historicalPhaseScores) > 5) {
            array_shift($historicalPhaseScores); // Keep window of 5
        }
        
        $momentum = $this->metricsCalculator->calculateCulturalMomentum($historicalPhaseScores);

        // Store back updated array temporarily (will be saved in main universe loop usually)
        $sv = $universe->state_vector ?? [];
        $sv['historical_phase_scores'] = $historicalPhaseScores;
        $universe->state_vector = $sv;

        return [
            'polarization' => $polarization,
            'cohesion' => $cohesion,
            'phase' => $phase,
            'momentum' => $momentum
        ];
    }

    /**
     * Determinism validation requirement
     */
    private function canonicalizeAndHash(array $actorStates, Universe $universe): string
    {
        $payload = [
            'u' => [
                'entropy' => $universe->entropy,
                'level' => $universe->level,
                'coherence' => $universe->structural_coherence
            ],
            'a' => array_map(fn($a) => [
                'id' => $a->id,
                'traits' => $a->traits,
                'metrics' => $a->metrics,
                'arch' => $a->archetype,
                'alive' => $a->isAlive
            ], $actorStates)
        ];

        // Ensure predictable ordering
        usort($payload['a'], fn($a, $b) => $a['id'] <=> $b['id']);
        ksort($payload['u']);
        ksort($payload['a']);

        return hash('sha256', json_encode($payload, JSON_UNESCAPED_UNICODE));
    }
}
