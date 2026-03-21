<?php

namespace App\Simulation\Engines\Social;

use App\Modules\Psychology\Dsl\BehaviorDslLoader;
use App\Modules\Psychology\Services\ConflictDetector;
use App\Modules\Psychology\Services\ConflictResolver;
use App\Modules\Psychology\Services\DecisionEngine;
use App\Modules\Psychology\Services\GoalGenerator;
use App\Modules\Psychology\Services\ImpulseGenerator;
use App\Modules\Psychology\Services\MeaningEngine;
use App\Modules\Psychology\Services\MemoryInfluenceAnalyzer;
use App\Modules\Psychology\Services\StateEvolutionService;
use App\Modules\Psychology\Services\SocialMemoryService;
use App\Modules\Psychology\Services\IdentityEvolutionService;
use App\Modules\Psychology\Services\JungianBehaviorAdapter;
use App\Modules\Psychology\Services\ReputationResolver;
use App\Modules\Psychology\Services\CulturePropagationService;
use App\Modules\Psychology\Services\MythGenerator;
use App\Modules\Psychology\Services\GoapPlanner;
use App\Modules\Psychology\ValueObjects\IdentityState;
use App\Modules\Psychology\ValueObjects\CultureTension;
use App\Modules\Psychology\ValueObjects\Myth;
use App\Modules\Psychology\ValueObjects\MemoryStream;
use App\Modules\Psychology\ValueObjects\PsychologicalState;
use App\Modules\Psychology\ValueObjects\TraitVector;
use App\Simulation\Concerns\DefaultSimulationEnginePhase;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Runtime\State\WorldState;

/**
 * PsychologyEngine – Full Psychology Layer Pipeline (Phase 1: macro-level)
 *
 * Operates at zone/civilization aggregate level (not per-actor yet).
 * Each tick produces a 'psychology_pulse' event with the aggregate behavior
 * outcome, enabling other engines to react to psychological state.
 *
 * Pipeline:
 *  WorldState metrics
 *    → MeaningEngine (subjective interpretation)
 *    → ImpulseGenerator (desire/fear/duty impulses)
 *    → ConflictDetector + ConflictResolver (internal conflict)
 *    → StateEvolutionService (CBT emotion update + memory)
 *    → GoalGenerator (Maslow needs → goals)
 *    → DecisionEngine (softmax + noise → behavior)
 *    → EngineResult (psychology_pulse event)
 */
final class PsychologyEngine implements SimulationEngine
{
    use DefaultSimulationEnginePhase;

    /**
     * Per-universe persistent state (in-memory for now; Phase 2 can persist to Redis/DB).
     * Indexed by universe_id.
     *
     * @var array<int, array{state: PsychologicalState, memory: MemoryStream, identity: IdentityState, relations: array, myths: array, culture: CultureTension}>
     */
    private static array $persistentState = [];

    public function __construct(
        private readonly MeaningEngine          $meaningEngine,
        private readonly ImpulseGenerator       $impulseGenerator,
        private readonly ConflictDetector       $conflictDetector,
        private readonly ConflictResolver       $conflictResolver,
        private readonly StateEvolutionService  $stateEvolution,
        private readonly MemoryInfluenceAnalyzer $memoryAnalyzer,
        private readonly GoalGenerator          $goalGenerator,
        private readonly DecisionEngine         $decisionEngine,
        // Phase 2 Services
        private readonly SocialMemoryService      $socialMemory,
        private readonly IdentityEvolutionService $identityEvolution,
        private readonly JungianBehaviorAdapter   $jungianAdapter,
        private readonly ReputationResolver       $reputationResolver,
        // Phase 3 Services
        private readonly CulturePropagationService $culturePropagation,
        private readonly MythGenerator            $mythGenerator,
        private readonly GoapPlanner              $goapPlanner,
    ) {}

    public function name(): string
    {
        return 'psychology';
    }

    public function priority(): int
    {
        return 23; // After basic social engines, before narrative
    }

    public function tickRate(): int
    {
        return 1;
    }

    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        $universeId = $ctx->getUniverseId();
        $tick       = $ctx->getTick();

        // ── Restore or init persistent psychological state ──
        [$psychState, $memory, $identity, $relations, $myths, $culture] = $this->loadState($universeId);

        // ── Extract zone metrics from WorldState ──
        $zoneMetrics = $this->extractZoneMetrics($state);
        // Phase 3: Simulated narrative events
        $zoneNarrativeEvents = ['dragon_attack', 'drought'];

        // ── Phase 2: Inject Archetype Biases ──
        // (For aggregate simulation, we assume a 'VillageElder' archetype dominating the culture)
        $dominantArchetype = 'VillageElder';
        $zoneMetrics = $this->jungianAdapter->injectArchetypeBiases($zoneMetrics, $dominantArchetype);

        // ── Step 1: Meaning (subjective interpretation of zone conditions) ──
        $traits  = TraitVector::neutral(); // Macro-level: neutral trait profile
        $meaning = $this->meaningEngine->interpretFromZoneMetrics($zoneMetrics, $traits);

        // ── Step 2: Generate impulses from meaning ──
        $impulses = $this->impulseGenerator->generate($meaning, $traits);

        // ── Step 3: Detect and resolve conflicts ──
        $conflicts = $this->conflictDetector->detect($impulses);
        $resolved  = $this->conflictResolver->resolve($impulses, $conflicts);
        $impulses  = $resolved['impulses'];
        $stressDelta = $resolved['stress_delta'];

        // ── Step 4: Evolve psychological state (CBT loop) ──
        $this->stateEvolution->evolve($psychState, $meaning, $memory, $stressDelta, $tick);

        // ── Step 4b: Also evolve from zone environmental pressures ──
        $this->stateEvolution->evolveFromZoneMetrics($psychState, $zoneMetrics);

        // ── Step 5: Decay all memories and social relations this tick ──
        $memory->decayAll();
        $relations = $this->socialMemory->decayAll($relations, $tick);

        // ── Step 6: Analyze memory influence context ──
        $memoryContext = $this->memoryAnalyzer->analyze($memory);

        // ── Step 7: Generate goals from current state (Maslow) ──
        $goals = $this->goalGenerator->generate($psychState);

        // ── Step 8: Decide behavior (softmax + noise) ──
        $extraContext = array_merge($zoneMetrics, $memoryContext);
        $behavior = $this->decisionEngine->decide($psychState, $goals, $impulses, $extraContext);

        // ── Step 8b: Phase 3 Culture Peer Pressure & Contagion ──
        $peerPressureStress = $this->culturePropagation->calculatePeerPressureStress($culture, $behavior);
        if ($peerPressureStress > 0) {
            $this->stateEvolution->evolve($psychState, $meaning, $memory, $peerPressureStress, $tick);
        }
        $psychState = $this->culturePropagation->applyContagion(
            $psychState, $traits, $zoneMetrics['fear'] ?? 0, 0.0, 0.0
        );

        // ── Step 8c: Phase 3 Myth Generation ──
        $newMyth = $this->mythGenerator->evaluateFromZoneMetrics($zoneMetrics, $zoneNarrativeEvents, $tick);
        if ($newMyth && count($myths) < 10) {
            $myths[] = $newMyth;
        }

        // ── Step 8d: Phase 3 GOAP Planning ──
        // Generate a sequence instead of just 1 behavior
        $topGoal = reset($goals) ?: ['type' => 'unknown'];
        $actionSequence = $this->goapPlanner->planSequence($psychState, $topGoal);

        // ── Step 9: Phase 2 Identity Evolution ──
        // Update identity based on whether the chosen behavior conflicts with the Archetype
        $identity = $this->identityEvolution->evaluateBehavior($identity, $behavior, $extraContext, $dominantArchetype);

        // ── Step 10: Phase 2 Reputation calculation (Aggregate view) ──
        // Simulating 1 interaction: The zone interacts with its own dominant archetype
        $relations = $this->socialMemory->recordInteraction($relations, 1, 0.1, 0.0, 0.05, 0.01, $tick);
        $reputation = $this->reputationResolver->resolveReputation([0 => $relations], 1);

        // ── Persist updated state ──
        $this->saveState($universeId, $psychState, $memory, $identity, $relations, $myths, $culture);

        // ── Write psychological summary back into WorldState ──
        $stateSnapshot = $psychState->toArray();
        $state->set('psychology.state',    $stateSnapshot);
        $state->set('psychology.behavior', $behavior);
        $state->set('psychology.sequence', $actionSequence);
        $state->set('psychology.goals',    array_column($goals, 'type'));
        $state->set('psychology.stress',   $psychState->stress);

        // ── Build result event ──
        $result = new EngineResult();
        $result->addEvent([
            'type'    => 'psychology_pulse',
            'tick'    => $tick,
            'payload' => [
                'behavior'         => $behavior,
                'state_snapshot'   => $stateSnapshot,
                'active_goals'     => $goals,
                'conflict_count'   => count($conflicts),
                'stress_level'     => $psychState->stress,
                'memory_trauma'    => $memoryContext['trauma'] ?? 0.0,
                'identity_conflict'=> $identity->roleConflict,
                'identity_worth'   => $identity->selfWorth,
                'reputation_label' => $reputation['label'] ?? 'Unknown',
                'action_sequence'  => $actionSequence,
                'new_myth'         => $newMyth ? $newMyth->toArray() : null,
            ],
        ]);

        $result->metrics['psychology'] = [
            'behavior'         => $behavior,
            'fear'             => $psychState->fear,
            'stress'           => $psychState->stress,
            'trust'            => $psychState->trust,
            'conflict_count'   => count($conflicts),
            'goal_count'       => count($goals),
            'identity_conflict'=> $identity->roleConflict,
            'myths_count'      => count($myths),
        ];

        return $result;
    }

    // ─────────────────── Private ───────────────────

    /**
     * Extract zone-level psychological metrics from WorldState.
     *
     * @return array<string, float>
     */
    private function extractZoneMetrics(WorldState $state): array
    {
        $fields = $state->getFields();

        return [
            'entropy'    => (float) ($fields['entropy']    ?? $state->getEntropy()),
            'fear'       => (float) ($fields['fear']       ?? 0.0),
            'trauma'     => (float) ($fields['trauma']     ?? 0.0),
            'inequality' => (float) ($fields['inequality'] ?? 0.0),
            'danger'     => (float) ($fields['survival']   ?? 0.0),
            'stability'  => (float) ($state->getStabilityIndex()),
        ];
    }

    /**
     * Load persistent state for a universe (init if first tick).
     *
     * @return array{0: PsychologicalState, 1: MemoryStream, 2: IdentityState, 3: array, 4: array, 5: CultureTension}
     */
    private function loadState(int $universeId): array
    {
        if (!isset(self::$persistentState[$universeId])) {
            self::$persistentState[$universeId] = [
                'state'     => PsychologicalState::baseline(),
                'memory'    => MemoryStream::empty(),
                'identity'  => IdentityState::baseline(),
                'relations' => [],
                'myths'     => [],
                'culture'   => CultureTension::neutral(),
            ];
        }
        return [
            self::$persistentState[$universeId]['state'],
            self::$persistentState[$universeId]['memory'],
            self::$persistentState[$universeId]['identity'],
            self::$persistentState[$universeId]['relations'],
            self::$persistentState[$universeId]['myths'],
            self::$persistentState[$universeId]['culture'],
        ];
    }

    private function saveState(
        int $universeId, 
        PsychologicalState $state, 
        MemoryStream $memory, 
        IdentityState $identity, 
        array $relations,
        array $myths,
        CultureTension $culture
    ): void {
        self::$persistentState[$universeId] = [
            'state'     => $state,
            'memory'    => $memory,
            'identity'  => $identity,
            'relations' => $relations,
            'myths'     => $myths,
            'culture'   => $culture,
        ];
    }
}
