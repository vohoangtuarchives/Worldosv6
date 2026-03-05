<?php

namespace App\Actions\Simulation;

use App\Contracts\Repositories\UniverseRepositoryInterface;
use App\Contracts\SimulationEngineClientInterface;
use App\Repositories\UniverseSnapshotRepository;
use App\Services\Material\MaterialLifecycleEngine;
use App\Services\Narrative\NarrativeAiService;
use App\Services\AI\FaithService;
use App\Services\AI\EtherealOmenService;
use App\Actions\Simulation\AutonomousAxiomMutationAction;

use App\Services\Simulation\CultureDiffusionService;
use App\Actions\Simulation\DecideUniverseAction;
use App\Actions\Simulation\ForkUniverseAction;
use App\Services\Simulation\GenreBifurcationEngine;
use App\Services\Simulation\ZoneConflictEngine;
use App\Modules\Institutions\Services\WorldEdictEngine;
use App\Services\Simulation\AscensionEngine;
use App\Actions\Simulation\DemiurgeAutonomousAction;
use App\Services\Simulation\ConvergenceEngine;
use App\Actions\Simulation\MergeUniversesAction;
use App\Actions\Simulation\EmpowerDemiurgesAction;
use App\Actions\Simulation\DivineMiracleAction;
use App\Services\Simulation\HeatDeathService;
use App\Services\Simulation\ResonanceAuditorService;
use App\Services\Simulation\TemporalSyncService;
use App\Actions\Simulation\AgentSovereigntyAction;
use App\Services\Simulation\CelestialAntibodyEngine;
use App\Services\Simulation\ChaosEngine;
use App\Services\Simulation\TransmigrationEngine;

class AdvanceSimulationAction
{
    public function __construct(
        protected UniverseRepositoryInterface $universeRepository,
        protected SimulationEngineClientInterface $engine,
        protected UniverseSnapshotRepository $snapshots,
        protected \App\Services\Simulation\MultiverseSovereigntyService $sovereignty,
        protected ArchetypeShiftAction $archetypeShift,
        protected DemiurgeAutonomousAction $demiurgeAction,
        protected ConvergenceEngine $convergence,
        protected MergeUniversesAction $mergeAction,
        protected FaithService $faithService,
        protected EmpowerDemiurgesAction $empowerDemiurges,
        protected DivineMiracleAction $miracleAction,
        protected HeatDeathService $heatDeath,
        protected ResonanceAuditorService $resonanceAuditor,
        protected EtherealOmenService $etherOmen,
        protected AutonomousAxiomMutationAction $axiomMutation,
        protected TemporalSyncService $temporalSync,
        protected AgentSovereigntyAction $agentSovereignty,
        protected CelestialAntibodyEngine $antibodyEngine,
        protected ChaosEngine $chaosEngine,
        protected TransmigrationEngine $transmigrationEngine
    ) {}

    public function execute(int $universeId, int $ticks): array
    {
        $universe = $this->universeRepository->find($universeId);

        if (!$universe || $universe->status === 'halted') {
            return ['ok' => false, 'error_message' => 'Universe not found or is halted'];
        }

        $stateInput = $this->prepareEngineStateInput($universe);
        $worldConfig = $this->prepareWorldConfig($universe);
        $response = $this->engine->advance($universeId, $ticks, $stateInput, $worldConfig);

        if (! ($response['ok'] ?? false)) {
            return $response;
        }

        $snapshotData = $response['snapshot'] ?? [];
        if (! empty($snapshotData)) {
            // Phase 96: Absolute Chronos (§V21)
            // Increment the world's master clock and sync the universe
            $this->temporalSync->advanceGlobalClock($universe->world, $ticks);
            $this->temporalSync->synchronize($universe);

            $interval = $universe->world->snapshot_interval ?? 1;
            $shouldSave = ($snapshotData['tick'] % $interval === 0) || ($snapshotData['tick'] == 0);
            
            $savedSnapshot = null;
            if ($shouldSave) {
                $savedSnapshot = $this->saveSnapshot($universe, $snapshotData);
            }

            // FIRE EVENT: Decoupled logic handled by Listeners
            // Note: If snapshot wasn't saved, we pass a mockup or the previous one, 
            // but GenerateNarrative needs current data. For now, we pass the raw data if savedSnapshot is null.
            event(new \App\Events\Simulation\UniverseSimulationPulsed(
                $universe, 
                $savedSnapshot ?? $universe->snapshots()->orderByDesc('tick')->first(), 
                $response
            ));

            // Update Universe latest tick
            $this->universeRepository->update($universe->id, ['current_tick' => $snapshotData['tick']]);

            // Phase 93: Internal Resonance (§V20)
            // The simulation now audits itself without Architect intervention
            $this->resonanceAuditor->audit($universe);
            $universe->refresh(); 

            // Phase 63: Total Sovereignty (§V10)
            $scars = $snapshotData['metrics']['scars'] ?? [];
            $this->sovereignty->orchestrate($universe, $scars);

            // Apply observer bonus to stability
            $universe->structural_coherence = min(1.0, $universe->structural_coherence + $universe->observer_bonus);
            $universe->save();

            // Phase 67: Agent Evolution (§V11)
            $this->archetypeShift->execute($universe);

            // Phase 81: Divine Alignment (§V16)
            $this->processAlignments($universe);

            // Phase 76 & 82 & 85: Autonomous Will, Empowerment & Miracles (§V14, §V16, §V17)
            if ($savedSnapshot && $savedSnapshot->tick % 5 === 0) {
                $this->empowerDemiurges->execute();
                $this->demiurgeAction->execute();
                $this->triggerRandomMiracles($universe);
            }

            // Phase 86 & 95: Cosmic Balance & Self-Evolving Axioms (§V17, §V20)
            if ($savedSnapshot && $savedSnapshot->tick % 50 === 0) {
                $this->heatDeath->monitor();
                $this->axiomMutation->execute($universe->world);
            }

            // Phase 101: Agent Sovereignty (§V22)
            // Allow transcendental agents to alter reality
            $this->agentSovereignty->execute($universe);

            // Phase 103: The Antibody Engine (§V23)
            // Purge any agents that have accumulated too much heresy
            $this->antibodyEngine->execute($universe);
            
            // Phase 108: Chaos Matrix (§V25)
            // Roll the dice for a reality-breaking anomaly in chaotic worlds
            $this->chaosEngine->destabilize($universe);

            // Phase 111-113: Transmigration / Isekai Triggers (§V26)
            // Tiny chance to trigger an Isekai event
            if (rand(0, 1000) < 5) { // 0.5% chance per tick per universe
                $this->transmigrationEngine->triggerIsekai($universe);
            }
        }

        return $response;
    }

    protected function processAlignments($universe): void
    {
        $legends = \App\Models\LegendaryAgent::where('universe_id', $universe->id)->get();
        foreach ($legends as $legend) {
            // Phase 91: Divine Favor Growth (§V19)
            $favored = is_array($legend->fate_tags) && in_array('divine_favor', $legend->fate_tags);
            $growthMod = $favored ? 1.5 : 1.0;

            // Simulate trait extraction from state_vector for the agent
            $traits = [
                'order' => (rand(0, 100) / 100) * $growthMod, 
                'entropy' => (rand(0, 100) / 100) * (1.0 / $growthMod)
            ];
            $this->faithService->updateAlignment($legend, $traits);
        }
    }

    protected function triggerRandomMiracles($universe): void
    {
        $rivals = \App\Models\Demiurge::where('is_active', true)->get();
        // Phase 94: Internal Omens (§V20)
        $omen = $this->etherOmen->generateInternalOmen($universe);
        
        foreach ($rivals as $demiurge) {
            // Probability of miracle increases with will_power and Omen modifier
            $chance = ($demiurge->will_power / 2000) + ($omen['sci_impact'] ?? 0); 
            
            if (rand(0, 1000) / 1000 < $chance && $chance > 0) {
                $types = ['absolute_order', 'void_eruption', 'legendary_ascension'];
                $this->miracleAction->execute($demiurge, $universe, $types[array_rand($types)]);
            }
        }
    }

    protected function handleConvergence(int $worldId): void
    {
        $candidates = $this->convergence->findMergeCandidates($worldId);
        foreach ($candidates as $pair) {
            $a = \App\Models\Universe::find($pair['a']);
            $b = \App\Models\Universe::find($pair['b']);
            if ($a && $b && $a->status === 'active' && $b->status === 'active') {
                $this->mergeAction->execute($a, $b);
            }
        }
    }

    private function saveSnapshot($universe, array $snapshot)
    {
         $stateVector = is_string($snapshot['state_vector'] ?? null)
            ? json_decode($snapshot['state_vector'], true) ?? []
            : ($snapshot['state_vector'] ?? []);
            
        $metrics = is_string($snapshot['metrics'] ?? null)
            ? json_decode($snapshot['metrics'], true) ?? []
            : ($snapshot['metrics'] ?? []);
            
        $metrics['sci'] = $snapshot['sci'] ?? null;
        $metrics['instability_gradient'] = $snapshot['instability_gradient'] ?? null;
            
        return $this->snapshots->save($universe, [
            'tick' => $snapshot['tick'],
            'state_vector' => $stateVector,
            'entropy' => $snapshot['entropy'] ?? null,
            'stability_index' => $snapshot['stability_index'] ?? null,
            'metrics' => $metrics,
        ]);
    }

    private function prepareEngineStateInput($universe): array
    {
        $vec = is_array($universe->state_vector) ? $universe->state_vector : [];
        $zones = [];
        $globalEntropy = $vec['entropy'] ?? 0.0;
        $knowledgeCore = $vec['knowledge_core'] ?? 0.0;
        $scars = $vec['scars'] ?? [];

        if (isset($vec['zones'])) {
            $zones = $vec['zones'];
            $globalEntropy = $vec['global_entropy'] ?? $globalEntropy;
        }

        $institutions = \App\Models\InstitutionalEntity::where('universe_id', $universe->id)
            ->whereNull('collapsed_at_tick')
            ->get();

        $stateObj = [
            'universe_id' => $universe->id,
            'tick' => (int)$universe->current_tick,
            'zones' => $zones,
            'global_entropy' => (float)$globalEntropy,
            'knowledge_core' => (float)$knowledgeCore,
            'scars' => $scars,
            'institutions' => $institutions->map(fn($e) => [
                'id' => $e->id,
                'type' => $e->entity_type,
                'capacity' => $e->org_capacity,
                'ideology' => $e->ideology_vector,
                'legitimacy' => $e->legitimacy,
                'influence' => $e->influence_map,
            ])->toArray(),
        ];

        return $stateObj;
    }

    private function prepareWorldConfig($universe): array
    {
        $world = $universe->world;
        return [
            'world_id' => (int) $world->id,
            'origin' => (string) $world->current_origin ?? 'generic',
            'axiom' => $world->evolution_genome ?? [],
            'world_seed' => $world->world_seed ?? [],
        ];
    }
}
