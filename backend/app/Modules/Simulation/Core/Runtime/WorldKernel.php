<?php

declare(strict_types=1);

namespace App\Modules\Simulation\Core\Runtime;

use App\Modules\Simulation\Core\Runtime\Causality\ImpactReport;
use App\Modules\Simulation\Core\Runtime\Kernel\AgentBatchProcessor;
use App\Modules\Simulation\Core\Runtime\Kernel\PhaseExecutor;
use App\Modules\Simulation\Core\Runtime\Kernel\TickFinalizer;
use App\Modules\Simulation\Core\Runtime\State\StateManager;
use App\Modules\Simulation\Core\Runtime\State\WorldState;
use Illuminate\Support\Facades\Log;

/**
 * WorldKernel – The core of WorldOS simulation (§World-Kernel).
 *
 * "Laravel backend chỉ đóng vai orchestrator"
 * Orchestrates all 15 Primitive Rules across 5 Reality Phases.
 *
 * Delegates to:
 * - AgentBatchProcessor: Agent actions & gRPC processing
 * - PhaseExecutor: 5-phase reality execution
 * - TickFinalizer: Causal impacts, domain events, finalization
 */
class WorldKernel
{
    // --- 5 PHASES OF REALITY ---
    public const PHASE_ENVIRONMENT = 'environment';
    public const PHASE_LIFE        = 'life';
    public const PHASE_MIND        = 'mind';
    public const PHASE_SOCIAL      = 'social';
    public const PHASE_META        = 'meta';

    // --- 15 PRIMITIVE RULE CATEGORIES ---
    public const RULE_METABOLISM   = 'metabolism';
    public const RULE_EXTRACTION   = 'extraction';
    public const RULE_INNOVATION   = 'innovation';
    public const RULE_DIFFUSION    = 'diffusion';
    public const RULE_COHESION     = 'cohesion';
    public const RULE_ENTROPY      = 'entropy';
    public const RULE_CONFLICT     = 'conflict';
    public const RULE_PROPAGATION  = 'propagation';
    public const RULE_RECURSION    = 'recursion';
    public const RULE_ASCENSION    = 'ascension';
    public const RULE_CORRECTION   = 'correction';
    public const RULE_OBSERVATION  = 'observation';
    public const RULE_BRIDGE       = 'bridge';
    public const RULE_NARRATIVE    = 'narrative';
    public const RULE_CYCLE        = 'cycle';
    public const RULE_ATTRACTION   = 'attraction';

    /** @var array<string, array<string, object[]>> */
    protected array $orchestrationMap = [];

    /** @var ImpactReport[] */
    protected array $tickImpacts = [];

    protected AgentBatchProcessor $agentProcessor;
    protected PhaseExecutor $phaseExecutor;
    protected TickFinalizer $tickFinalizer;

    public function __construct(
        protected StateManager $stateManager
    ) {
        $this->initOrchestrationMap();
        $this->agentProcessor = new AgentBatchProcessor();
        $this->phaseExecutor = new PhaseExecutor();
        $this->tickFinalizer = new TickFinalizer();
    }

    protected function initOrchestrationMap(): void
    {
        foreach ([self::PHASE_ENVIRONMENT, self::PHASE_LIFE, self::PHASE_MIND, self::PHASE_SOCIAL, self::PHASE_META] as $phase) {
            $this->orchestrationMap[$phase] = [];
        }
    }

    public function registerSystem(string $phase, string $category, object $system): void
    {
        $this->orchestrationMap[$phase][$category][] = $system;
    }

    /**
     * Run the full simulation orchestration for a single tick.
     */
    public function execute(WorldState $state, int $tick): void
    {
        $startTime = microtime(true);
        Log::debug("WorldKernel: Starting Orchestration Tick $tick");
        $this->tickImpacts = [];

        // 1. PHASE 0: Agents Act First (§V8 Realignment)
        // V9: Ensure zones are prepopulated with agents from the single source of truth
        $state->syncAgentsToZones();

        // Before world environment updates, agents must decide and act.
        $this->agentProcessor->executeAgentActions($state, $tick);

        // V9: Resync after actions (to reflect movement/changes before systems run)
        $state->syncAgentsToZones();

        // 2. PHASE 1-5: Sequential Reality Phases
        foreach ($this->orchestrationMap as $phase => $categories) {
            $phaseStart = microtime(true);
            $this->phaseExecutor->executePhase($phase, $categories, $state, $tick, $this->tickImpacts);
            $phaseMs = round((microtime(true) - $phaseStart) * 1000, 2);
            Log::debug("WorldKernel: Phase [{$phase}] completed in {$phaseMs}ms");
        }

        // 3. Process Global Emergence: State Transition Engine (ISTE)
        $iste = app(\App\Modules\Simulation\Core\Runtime\Engines\StateTransitionEngine::class);
        $iste->run($state, $this->tickImpacts, $tick);

        // 4. Narrative-Driven: Cleanup & Feedback
        $this->tickFinalizer->processCausalImpacts($state, $tick, $this->tickImpacts);
        $this->tickFinalizer->finalizeTick($state, $tick);

        $totalMs = round((microtime(true) - $startTime) * 1000, 2);
        Log::debug("WorldKernel: Orchestration Tick $tick Completed in {$totalMs}ms");
    }
}
