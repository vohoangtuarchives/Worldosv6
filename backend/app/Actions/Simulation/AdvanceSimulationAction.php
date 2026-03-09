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
use App\Simulation\SimulationKernel;
use App\Simulation\Support\SnapshotLoader;
use App\Simulation\Support\SimulationRandom;
use Illuminate\Support\Facades\Log;

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
        protected TransmigrationEngine $transmigrationEngine,
        protected SimulationKernel $simulationKernel,
        protected SnapshotLoader $snapshotLoader,
        protected \App\Services\Simulation\ActorCognitiveService $cognitiveService,
        protected \App\Services\Simulation\CivilizationCollapseEngine $collapseEngine,
        protected \App\Modules\Intelligence\Actions\ProcessActorSurvivalAction $processActorSurvival
    ) {}

    public function execute(int $universeId, int $ticks): array
    {
        Log::info("Simulation: advance requested", ['universe_id' => $universeId, 'ticks' => $ticks]);

        $universe = $this->universeRepository->find($universeId);

        if (!$universe || $universe->status === 'halted' || $universe->status === 'restarting') {
            Log::warning("Simulation: advance rejected (universe not found or halted)", ['universe_id' => $universeId]);
            return ['ok' => false, 'error_message' => 'Universe not found, is halted, or is restarting'];
        }
        if (!$universe->world) {
            Log::warning("Simulation: advance rejected (universe has no world)", ['universe_id' => $universeId]);
            return ['ok' => false, 'error_message' => 'Universe has no world'];
        }

        $stateInput = $this->prepareEngineStateInput($universe);
        $worldConfig = $this->prepareWorldConfig($universe);
        $response = $this->engine->advance($universeId, $ticks, $stateInput, $worldConfig);

        if (! ($response['ok'] ?? false)) {
            return $response;
        }

        $snapshotData = $response['snapshot'] ?? [];
        if (! empty($snapshotData)) {
            // Có drift (tick > 0) thì entropy không thể là 0 — sàn khi engine/stub trả 0
            $this->ensureEntropyFloor($snapshotData);
            // Bootstrap zones nếu engine không trả về: stub/engine có thể không tạo zones → topology và map trống.
            $this->ensureStateVectorHasZones($snapshotData);

            // Phase 96: Absolute Chronos (§V21)
            $this->temporalSync->advanceGlobalClock($universe->world, $ticks);
            $this->temporalSync->synchronize($universe);

            $interval = $universe->world->snapshot_interval ?? 1;
            $shouldSave = ($snapshotData['tick'] % $interval === 0) || ($snapshotData['tick'] == 0);

            // Luôn đồng bộ state từ engine về universe mỗi tick, để lần advance tiếp theo
            // gửi state mới (entropy/stability thay đổi). Nếu không sync khi !shouldSave,
            // engine sẽ nhận mãi state cũ → entropy không đổi.
            $this->syncUniverseFromSnapshotData($universe, $snapshotData);

            $savedSnapshot = null;
            if ($shouldSave) {
                $savedSnapshot = $this->saveSnapshot($universe, $snapshotData);
                // Optional: run Simulation Kernel and overwrite snapshot (deterministic, effect-based)
                if ($savedSnapshot && config('worldos.simulation_kernel_post_tick')) {
                    $state = $this->snapshotLoader->fromSnapshot($universe, $savedSnapshot);
                    $rng = new SimulationRandom((int) ($universe->seed ?? 0), (int) $savedSnapshot->tick, 0);
                    $newState = $this->simulationKernel->runTick($state, $rng);
                    $savedSnapshot = $this->snapshots->save($universe, [
                        'tick' => $newState->getTick(),
                        'state_vector' => $newState->getStateVector(),
                        'entropy' => $newState->getEntropy(),
                        'stability_index' => $newState->getStateVectorKey('stability_index') ?? $newState->getMetric('stability_index'),
                        'metrics' => $newState->getMetrics(),
                    ]);
                }
            } else {
                // Snapshot không được lưu (tick % interval !== 0): tạo virtual snapshot từ snapshotData
                // để listener nhận đúng tick/entropy/stability hiện tại, tránh dùng snapshot cũ từ DB.
                $savedSnapshot = $this->makeVirtualSnapshot($universe, $snapshotData);
            }

            // FIRE EVENT: Luôn dùng snapshot đúng tick (saved hoặc virtual). Truyền thêm _ticks để listener tính fromTick.
            event(new \App\Events\Simulation\UniverseSimulationPulsed(
                $universe,
                $savedSnapshot,
                array_merge($response, ['_ticks' => $ticks])
            ));

            // Survival chạy ngay trong process advance để chắc chắn có deaths được lưu (không phụ thuộc listener/queue)
            $this->processActorSurvival->handle($universe, array_merge($response, ['_ticks' => $ticks]));

            Log::info("Simulation: advance completed", [
                'universe_id' => $universeId,
                'ticks' => $ticks,
                'tick' => $snapshotData['tick'],
                'entropy' => $snapshotData['entropy'] ?? null,
            ]);

            // Update Universe latest tick (state_vector đã được sync trong syncUniverseFromSnapshotData)
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
            
            // Phase 130: Darwinian Fitness Evaluation (§V35)
            if ($snapshotData['tick'] % 10 === 0) {
                $universe->fitness_score = app(\App\Services\Simulation\KernelMutationService::class)->calculateFitness($universe);
            }
            
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

            if (rand(0, 1000) < 5) { // 0.5% chance per tick per universe
                $this->transmigrationEngine->triggerIsekai($universe);
            }

            // ==========================================
            // LEVEL 7: CIVILIZATION ATTRACTOR FIELD ENGINE (chỉ khi đã lưu snapshot)
            // ==========================================

            if ($shouldSave && $savedSnapshot && $savedSnapshot->exists) {
                // Phase 1 refactor: field/diffusion computed in Rust; we only persist from snapshot (syncUniverseFromSnapshotData already set state_vector['fields'] and zone_fields).

                // Phase 123: Actor Cognitive Bifurcation (§V32)
                // Update cognitive variables (Destiny, Curiosity, Anomaly)
                $this->cognitiveService->computeAndStore($universe, $savedSnapshot);

                // Phase 125: Civilization Collapse (§V33)
                // Check if internal stress (entropy) causes a fragmentation event (uses entropy/stability from snapshot)
                $this->collapseEngine->evaluate($universe, $savedSnapshot);
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

    /**
     * Tạo snapshot ảo (không lưu DB) từ snapshotData khi tick % interval !== 0.
     * Listener nhận đúng tick/entropy/stability hiện tại.
     */
    private function makeVirtualSnapshot($universe, array $snapshotData): \App\Models\UniverseSnapshot
    {
        $stateVector = is_string($snapshotData['state_vector'] ?? null)
            ? json_decode($snapshotData['state_vector'], true) ?? []
            : ($snapshotData['state_vector'] ?? []);
        $metrics = is_string($snapshotData['metrics'] ?? null)
            ? json_decode($snapshotData['metrics'], true) ?? []
            : ($snapshotData['metrics'] ?? []);
        $metrics['sci'] = $snapshotData['sci'] ?? null;
        $metrics['instability_gradient'] = $snapshotData['instability_gradient'] ?? null;

        $snap = new \App\Models\UniverseSnapshot([
            'universe_id' => $universe->id,
            'tick' => $snapshotData['tick'],
            'state_vector' => $stateVector,
            'entropy' => $snapshotData['entropy'] ?? null,
            'stability_index' => $snapshotData['stability_index'] ?? null,
            'metrics' => $metrics,
        ]);
        $snap->setRelation('universe', $universe);
        return $snap;
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

    /**
     * Đồng bộ state từ engine về universe mỗi tick (không tạo snapshot row).
     * Đảm bảo lần advance() tiếp theo engine nhận state mới → entropy/stability có thể thay đổi.
     */
    private function syncUniverseFromSnapshotData($universe, array $snapshotData): void
    {
        $stateVector = is_string($snapshotData['state_vector'] ?? null)
            ? json_decode($snapshotData['state_vector'], true) ?? []
            : ($snapshotData['state_vector'] ?? []);

        // Rust engine returns full UniverseState as state_vector (zones, tick, global_entropy, …).
        // Preserve zones (and full structure) so prepareEngineStateInput sends them on the next advance.
        if (!isset($stateVector['zones']) && isset($stateVector[0]['state'])) {
            $stateVector = ['zones' => $stateVector];
        }

        // Restore universe metrics back into state_vector so prepareEngineStateInput finds them on the next tick
        $stateVector['entropy'] = (float)($snapshotData['entropy'] ?? 0.0);
        $stateVector['global_entropy'] = (float)($snapshotData['entropy'] ?? 0.0);
        $stateVector['sci'] = (float)($snapshotData['sci'] ?? 1.0);
        $stateVector['instability_gradient'] = (float)($snapshotData['instability_gradient'] ?? 0.0);
        
        $metrics = is_string($snapshotData['metrics'] ?? null)
            ? json_decode($snapshotData['metrics'], true) ?? []
            : ($snapshotData['metrics'] ?? []);
            
        $stateVector['knowledge_core'] = (float) ($stateVector['knowledge_core'] ?? ($metrics['knowledge_core'] ?? 0.0));
        $stateVector['scars'] = $metrics['scars'] ?? ($stateVector['scars'] ?? []);
        $stateVector['attractors'] = is_array($stateVector['attractors'] ?? null) ? $stateVector['attractors'] : [];
        $stateVector['dark_attractors'] = is_array($stateVector['dark_attractors'] ?? null) ? $stateVector['dark_attractors'] : [];

        // Phase 1 refactor: fields come from Rust engine (global_fields or metrics.civ_fields)
        $fields = null;
        if (!empty($snapshotData['global_fields'])) {
            $fields = is_string($snapshotData['global_fields'])
                ? json_decode($snapshotData['global_fields'], true)
                : $snapshotData['global_fields'];
        }
        if ($fields === null && !empty($metrics['civ_fields'])) {
            $fields = $metrics['civ_fields'];
        }
        if (is_array($fields)) {
            $stateVector['fields'] = $fields;
        }

        // Per-zone fields from Rust state (zones[].state.civ_fields) for listeners that expect zone_fields
        if (!empty($stateVector['zones']) && is_array($stateVector['zones'])) {
            $zoneFields = [];
            foreach ($stateVector['zones'] as $idx => $zone) {
                $cf = $zone['state']['civ_fields'] ?? null;
                if (is_array($cf)) {
                    $zoneFields[$idx] = $cf;
                }
            }
            if ($zoneFields !== []) {
                $stateVector['zone_fields'] = $zoneFields;
            }
        }

        $this->universeRepository->update($universe->id, [
            'current_tick' => $snapshotData['tick'],
            'state_vector' => $stateVector,
            'entropy' => $stateVector['entropy']
        ]);
        $universe->refresh();
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

            // Ensure structured_mass exists for Rust parser
            foreach ($zones as &$zone) {
                if (!isset($zone['state']['structured_mass'])) {
                    $zone['state']['structured_mass'] = 50.0;
                }
            }
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
            'attractors' => is_array($vec['attractors'] ?? null) ? $vec['attractors'] : [],
            'dark_attractors' => is_array($vec['dark_attractors'] ?? null) ? $vec['dark_attractors'] : [],
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
            'world_id' => $world->id,
            'origin' => $world->origin ?? 'generic',
            'axiom' => $world->axiom,
            'world_seed' => $world->world_seed,
            'genome' => empty($universe->kernel_genome) ? null : $universe->kernel_genome,
        ];
    }

    /** Có drift (tick > 0) thì entropy không thể là 0 — sàn tối thiểu khi engine/stub trả 0. */
    private function ensureEntropyFloor(array &$snapshotData): void
    {
        $tick = (int) ($snapshotData['tick'] ?? 0);
        if ($tick <= 0) {
            return;
        }
        $entropy = $snapshotData['entropy'] ?? 0;
        if ($entropy === null || $entropy === 0 || (is_float($entropy) && $entropy < 0.003)) {
            $snapshotData['entropy'] = 0.003;
        }
    }

    private function ensureStateVectorHasZones(array &$snapshotData): void
    {
        $raw = $snapshotData['state_vector'] ?? null;
        $stateVector = is_string($raw) ? (json_decode($raw, true) ?? []) : (is_array($raw) ? $raw : []);
        
        // If it's already properly formatted
        if (isset($stateVector['zones']) && is_array($stateVector['zones']) && count($stateVector['zones']) > 0) {
            return;
        }

        // If Rust returned a flat array of zones (e.g. index 0 has 'state')
        if (isset($stateVector[0]['state'])) {
            // Wrap it correctly inside 'zones'
            $snapshotData['state_vector'] = ['zones' => $stateVector];
            return;
        }

        // Otherwise, it is completely empty. We bootstrap a default zone.
        $tick = (int) ($snapshotData['tick'] ?? 0);
        $entropy = (float) ($snapshotData['entropy'] ?? 0.3);
        $order = 1.0 - $entropy * 0.5;
        
        $stateVector['zones'] = [
            [
                'id' => 0,
                'state' => [
                    'entropy' => $entropy > 0.0 ? $entropy : 0.5,
                    'order' => max(0, min(1, $order)),
                    'base_mass' => 100.0,
                    'structured_mass' => 50.0,
                    'active_materials' => [],
                    'civ_fields' => [],
                    'cultural' => []
                ],
                'neighbors' => [],
            ],
        ];
        
        $snapshotData['state_vector'] = $stateVector;
    }
}
