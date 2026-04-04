<?php

namespace App\Modules\Simulation\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Route;
use App\Modules\Simulation\Contracts\RelicRepositoryInterface;
use App\Modules\Simulation\Repositories\RelicEloquentRepository;
use App\Modules\Simulation\Contracts\TrajectoryRepositoryInterface;
use App\Modules\Simulation\Repositories\TrajectoryEloquentRepository;

use App\Modules\Simulation\Contracts\UniverseRepositoryInterface;
use App\Modules\Simulation\Repositories\UniverseEloquentRepository;
use App\Modules\Simulation\Vocation\Contracts\VocationRepositoryInterface;
use App\Modules\Simulation\Vocation\Repositories\VocationEloquentRepository;
use App\Modules\Simulation\Vocation\Contracts\SkillRepositoryInterface;
use App\Modules\Simulation\Vocation\Repositories\SkillEloquentRepository;
use App\Modules\Simulation\Vocation\Contracts\ActorMasteryRepositoryInterface;
use App\Modules\Simulation\Vocation\Repositories\ActorMasteryEloquentRepository;

class SimulationServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->register(SimulationConfigServiceProvider::class);
        $this->app->register(\App\Modules\Narrative\Providers\NarrativeServiceProvider::class);

        // Bindings for repositories
        $this->app->bind(RelicRepositoryInterface::class, RelicEloquentRepository::class);
        $this->app->bind(TrajectoryRepositoryInterface::class, TrajectoryEloquentRepository::class);
        $this->app->bind(UniverseRepositoryInterface::class, UniverseEloquentRepository::class);
        $this->app->bind(\App\Modules\Simulation\Contracts\WorldRepositoryInterface::class, \App\Modules\Simulation\Repositories\WorldEloquentRepository::class);
        $this->app->bind(\App\Modules\Simulation\Contracts\SnapshotRepositoryInterface::class, \App\Modules\Simulation\Repositories\SnapshotEloquentRepository::class);
        $this->app->bind(\App\Modules\Simulation\Contracts\BranchEventRepositoryInterface::class, \App\Modules\Simulation\Repositories\BranchEventRepository::class);
        $this->app->bind(\App\Contracts\Repositories\BranchEventRepositoryInterface::class, \App\Modules\Simulation\Repositories\BranchEventRepository::class);

        // Vocation V1 Repository Bindings
        $this->app->bind(VocationRepositoryInterface::class, VocationEloquentRepository::class);
        $this->app->bind(SkillRepositoryInterface::class, SkillEloquentRepository::class);
        $this->app->bind(ActorMasteryRepositoryInterface::class, ActorMasteryEloquentRepository::class);

        $this->app->singleton(\App\Modules\Simulation\Core\Domain\Pipelines\SpawnPipeline::class, function ($app) {
            return new \App\Modules\Simulation\Core\Domain\Pipelines\SpawnPipeline([
                $app->make(\App\Modules\Simulation\Core\Domain\Pipelines\Steps\InheritStateStep::class),
                $app->make(\App\Modules\Simulation\Core\Domain\Pipelines\Steps\MutateGenomeStep::class),
                $app->make(\App\Modules\Simulation\Core\Domain\Pipelines\Steps\PreCreateInjectionStep::class),
                $app->make(\App\Modules\Simulation\Core\Domain\Pipelines\Steps\CreateUniverseStep::class),
                $app->make(\App\Modules\Simulation\Core\Domain\Pipelines\Steps\InheritAxiomsStep::class),
                $app->make(\App\Modules\Simulation\Core\Domain\Pipelines\Steps\FinalizeSpawnStep::class),
            ]);
        });

        $this->app->singleton(\App\Modules\Simulation\Services\Meta\ConvergenceEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Culture\ResonanceEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Core\CausalCorrectionEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Ecology\PressureCalculator::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Cosmology\CosmicPhaseDetector::class);
        $this->app->singleton(\App\Modules\Simulation\Services\ScenarioEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Meta\MultiverseInteractionService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Meta\WorldRegulatorEngine::class);

        $this->app->singleton(\App\Modules\Simulation\Services\Society\AutonomicEvolutionEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Meta\MultiverseSchedulerEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Meta\TimelineSelectionEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Narrative\NarrativeExtractionEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Narrative\CivilizationMemoryEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Culture\MythologyGeneratorEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Culture\IdeologyEvolutionEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Core\GreatPersonEngine::class);
        $this->app->bind(
            \App\Contracts\UniverseSimilarityServiceInterface::class,
            \App\Modules\Simulation\Services\Core\StateVectorUniverseSimilarityService::class
        );
        $this->app->bind(\App\Contracts\CausalityGraphServiceInterface::class, function ($app) {
            return \config('worldos.causality.driver', 'null') === 'redis'
                ? $app->make(\App\Modules\Simulation\Services\Core\RedisCausalityGraphService::class)
                : $app->make(\App\Modules\Simulation\Services\Core\NullCausalityGraphService::class);
        });
        $this->app->bind(
            \App\Contracts\UniverseEvaluatorInterface::class,
            \App\Modules\Simulation\Services\Society\AutonomicEvolutionEngine::class
        );

        // State Management (Phase 37)
        $this->app->singleton(\App\Modules\Simulation\Core\Runtime\State\StateManager::class);

        // Simulation Kernel (effect-based, deterministic tick) + Event Bus (Tier 3, Phase 5 Track A)
        $this->app->singleton(\App\Modules\Simulation\Core\SimulationEventBus::class);
        $this->app->bind(\App\Modules\Simulation\Core\Contracts\WorldEventBusBackendInterface::class, function ($app) {
            $driver = \config('worldos.event_bus.driver', 'database');
            return $driver === 'redis_stream'
                ? new \App\Modules\Simulation\Core\EventBus\RedisStreamWorldEventBusBackend(true, \config('worldos.event_bus.stream_key'))
                : $app->make(\App\Modules\Simulation\Core\EventBus\DatabaseWorldEventBusBackend::class);
        });
        $this->app->singleton(\App\Modules\Simulation\Core\Contracts\WorldEventBusInterface::class, \App\Modules\Simulation\Core\WorldEventBus::class);
        $this->app->singleton(\App\Modules\Simulation\Core\WorldEventBus::class);
        $this->app->bind(\App\Contracts\SimulationEventStreamProducerInterface::class, function ($app) {
            if (! \config('worldos.event_stream.kafka_enabled', false)) {
                return $app->make(\App\Modules\Simulation\Services\EventStream\NullSimulationEventStreamProducer::class);
            }
            return new \App\Modules\Simulation\Services\EventStream\KafkaRestSimulationEventStreamProducer(
                \config('worldos.event_stream.rest_proxy_url'),
                \config('worldos.event_stream.topic_simulation_advanced'),
                \config('worldos.event_stream.topic_events'),
            );
        });
        $this->app->bind(\App\Modules\Simulation\Core\Contracts\WorldOsGraphServiceInterface::class, function ($app) {
            $enabled = \config('worldos.graph.enabled', false);
            $uri = \config('worldos.graph.uri', '');
            if (! $enabled || $uri === '') {
                return $app->make(\App\Modules\Simulation\Core\Graph\NullWorldOsGraphService::class);
            }
            return new \App\Modules\Simulation\Core\Graph\Neo4jWorldOsGraphService(
                $uri,
                \config('worldos.graph.username'),
                \config('worldos.graph.password')
            );
        });
        $this->app->singleton(\App\Modules\Simulation\Core\EffectResolver::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Support\SnapshotLoader::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Services\ZonePressureCalculator::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Services\TopologyResolver::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Services\CosmicSignalCollector::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Services\PhasePressureCalculator::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Physics\PotentialFieldEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Physics\StructuralDecayEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Physics\MetabolicEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Meta\LawEvolutionEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Meta\CausalityEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Social\AgricultureEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Social\PopulationEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Social\DiseaseEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Social\CivilizationFieldTheoryEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Biological\EcologicalCollapseEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Biological\EcologicalPhaseTransitionEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Biological\AutopoieticEvolutionEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Biological\CelestialAntibodyEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Meta\MultiverseOsmosisEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Meta\MetaAttractorEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Meta\CausalHistoryEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Meta\OmegaConvergenceEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Meta\CausalBridgeEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Meta\PostApotheosisEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Core\ObserverSpectrumService::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Meta\ResonanceBleedingEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Meta\DynamicLawEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Meta\DeepTimeMemoryEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Meta\HigherDimensionalEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Meta\InfiniteRecursionEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Runtime\EventDrivenScheduler::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Meta\IdealismEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Meta\SingularityEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Biological\AutopoieticEvolutionEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Meta\InformationDensityEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Physics\MetabolicEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Meta\IdeologyEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Meta\CulturalInfluenceEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Core\CausalCacheService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Core\RuleMutationService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Core\StructuralHashService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Core\HolographicCompressionService::class);

        // Batch 1: Physics & Metaphysics
        $this->app->singleton(\App\Modules\Simulation\Services\Cosmology\HeatDeathService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Cosmology\RealityCalibrationService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Cosmology\CosmicEnergyPoolService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Cosmology\SamsaraService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Society\SoulAnchorService::class);

        // Batch 2: Social & Civilization
        $this->app->singleton(\App\Modules\Simulation\Services\Politics\CivilizationDiscoveryService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Society\DemographicRatesService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Society\SocialGraphService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Society\LegitimacyEliteService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Ecology\UrbanStressAgricultureService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Ecology\DemographicStages::class);

        // Batch 3: Narrative & Cognition
        $this->app->singleton(\App\Modules\Simulation\Services\Society\ActorCognitiveService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Narrative\CivilizationNarrativeInterpreter::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Narrative\GrandNarrativeService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Core\HeroLifecycleService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Culture\IdeologyConversionService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Core\KnowledgeGraphService::class);

        // Batch 4: Technical & Infrastructure
        $this->app->singleton(\App\Modules\Simulation\Services\Cosmology\SimulationClock::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Ecology\SimulationPRNG::class);

        // Batch 5: Intelligence & Emergence
        $this->app->singleton(\App\Modules\Simulation\Services\Ecology\AnomalyGeneratorService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Ecology\EvolutionarySparkService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Core\SelfImprovingSimulationService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Society\TheDreamingService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Ecology\ZenithMetricsService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Core\ReasoningService::class);

        // Batch 6: Rule & DSL Engines
        $this->app->singleton(\App\Modules\Simulation\Core\Runtime\RuleVM\EffectExecutor::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Runtime\RuleVM\RuleVmService::class);
        
        $this->app->singleton(\App\Modules\Simulation\Services\RuleEngine\FfiRuleEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Runtime\RuleVM\RuleGraphService::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Runtime\RuleVM\DeployRuleProposalService::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Runtime\RuleVM\EventTriggerProcessor::class);

        // Batch 7: Infrastructure & Support
        $this->app->singleton(\App\Modules\Simulation\Services\Core\SimulationMetricsExporter::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Core\SimulationMetricsLogger::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Core\SimulationTracer::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Core\MetricsExtractor::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Meta\WorldSimulationStatusService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Core\StateVectorUniverseSimilarityService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Core\NullUniverseSimilarityService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Meta\UniverseRuntimeService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Core\CheatGranterService::class);

        // Batch 8: Multiverse-Level Logic
        $this->app->singleton(\App\Modules\Simulation\Services\Meta\MultiverseSovereigntyService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Meta\MultiverseSynthesisService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Cosmology\CosmogenesisService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Meta\TemporalSyncService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Meta\ParadoxResolver::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Culture\ResonanceAuditorService::class);

        // Batch 9: Emergent Physics & Social
        $this->app->singleton(\App\Modules\Simulation\Services\Core\FieldDiffusionEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Ecology\GeographyResourceService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Core\GreatPersonLegacyService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Core\InnovationRateService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Society\InstitutionDecayService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Ecology\KernelMutationService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Core\MacroAgentSpawnService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Core\MetaEdictService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Ecology\SurvivalPruningService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Cosmology\VaultService::class);

        // Batch 10: FFI & Clients
        $this->app->singleton(\App\Modules\Simulation\Services\Cosmology\AxiomRegistry::class);
        
        // Vocation V1 Engine Services
        $this->app->singleton(\App\Modules\Simulation\Vocation\DSL\ExpressionEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Vocation\Services\ElementInteractionService::class);
        $this->app->singleton(\App\Modules\Simulation\Vocation\Services\VocationEvolutionService::class);
        $this->app->singleton(\App\Modules\Simulation\Vocation\Services\VocationEngine::class);

        $this->app->singleton(\App\Modules\Simulation\Services\Core\HttpSimulationEngineClient::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Core\StubSimulationEngineClient::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Core\FfiActorEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\FeatureExtractionService::class);

        // Phase 100: Power System Transition (Decoupling Era from Power System)
        $this->app->singleton(\App\Modules\Simulation\Services\Transition\Transformers\EntropyTransformer::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Transition\Transformers\StabilityBinder::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Transition\Transformers\CausalityRewriter::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Transition\Transformers\RealityStrainSimulator::class);

        $this->app->singleton(\App\Modules\Simulation\Services\Transition\Guards\EnergyInvariantGuard::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Transition\Guards\CausalityInvariantGuard::class);

        $this->app->singleton(\App\Modules\Simulation\Services\Transition\TransitionProcessor::class, function ($app) {
            $transformers = [
                $app->make(\App\Modules\Simulation\Services\Transition\Transformers\EntropyTransformer::class),
                $app->make(\App\Modules\Simulation\Services\Transition\Transformers\StabilityBinder::class),
                $app->make(\App\Modules\Simulation\Services\Transition\Transformers\CausalityRewriter::class),
                $app->make(\App\Modules\Simulation\Services\Transition\Transformers\RealityStrainSimulator::class),
            ];
            
            $guards = [
                $app->make(\App\Modules\Simulation\Services\Transition\Guards\EnergyInvariantGuard::class),
                $app->make(\App\Modules\Simulation\Services\Transition\Guards\CausalityInvariantGuard::class),
            ];
            
            return new \App\Modules\Simulation\Services\Transition\TransitionProcessor($transformers, $guards);
        });

        // Phase 80: World Kernel & Primitive Systems (§World-Kernel Architecture)
        $this->app->singleton(\App\Modules\Simulation\Core\Runtime\WorldKernel::class, function ($app) {
            $kernel = new \App\Modules\Simulation\Core\Runtime\WorldKernel($app->make(\App\Modules\Simulation\Core\Runtime\State\StateManager::class));
            
            // Phase 1: Environment
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_ENVIRONMENT,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_METABOLISM,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Physics\MetabolicEngine::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_ENVIRONMENT,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_EXTRACTION,
                $app->make(\App\Modules\Simulation\Core\Runtime\Systems\ResourceSystem::class)
            );

            // Wave 1: Physics Foundation — 5 engines vật lý nền
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_ENVIRONMENT,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_METABOLISM,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Physics\RealityAnchorEngine::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_ENVIRONMENT,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_ENTROPY,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Physics\CosmicPressureEngine::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_ENVIRONMENT,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_EXTRACTION,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Physics\GeologicalEngine::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_ENVIRONMENT,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_METABOLISM,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Physics\ClimateEngine::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_ENVIRONMENT,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_EXTRACTION,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Physics\MaterialEvolutionEngine::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_ENVIRONMENT,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_EXTRACTION,
                $app->make(\App\Modules\Simulation\Core\Runtime\Systems\MaterialWorldSystem::class)
            );

            // Phase 2: Life
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_LIFE,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_METABOLISM,
                $app->make(\App\Modules\Simulation\Core\Runtime\Systems\SurvivalSystem::class)
            );

            // Phase 3: Mind
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_MIND,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_DIFFUSION,
                $app->make(\App\Modules\Simulation\Core\Runtime\Systems\PropagationSystem::class)
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_MIND,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_OBSERVATION,
                $app->make(\App\Modules\Simulation\Core\Runtime\Systems\PsychologySystem::class)
            );

            // Phase 4: Social
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_COHESION,
                $app->make(\App\Modules\Simulation\Core\Runtime\Systems\PowerSystem::class)
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_COHESION,
                $app->make(\App\Modules\Simulation\Core\Runtime\Systems\AllianceSystem::class)
            );

            // Phase 5: Meta
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_META,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_CONFLICT,
                $app->make(\App\Modules\Simulation\Core\Runtime\Systems\ConflictSystem::class)
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_META,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_NARRATIVE,
                $app->make(\App\Modules\Simulation\Core\Runtime\Systems\MythCreationSystem::class)
            );

            // Phase 3: Mind (V10 Engines)
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_MIND,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_DIFFUSION,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Meta\InformationPropagationEngine::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_MIND,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_INNOVATION,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Meta\MeaningEngine::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_MIND,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_INNOVATION,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Meta\KnowledgeEvolutionEngine::class))
            );

            // Phase 4: Social (V10 Engines)
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_COHESION,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Meta\PowerStructureEngine::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_ATTRACTION,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Meta\CulturalInfluenceEngine::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_CYCLE,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Meta\ThermodynamicPhaseEngine::class))
            );

            // Phase 5: Meta (V10 Engines)
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_META,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_NARRATIVE,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Meta\MythogenesisEngine::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_META,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_NARRATIVE,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Meta\CulturalInfluenceEngine::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_META,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_NARRATIVE,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Meta\IdeologyEngine::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_META,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_CORRECTION,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Meta\CausalHistoryEngine::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_META,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_ENTROPY,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Meta\SingularityStabilityEngine::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_META,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_ASCENSION,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Meta\AscensionEngine::class))
            );

            // Phase 1: Environment (Stages)
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_ENVIRONMENT,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_METABOLISM,
                new \App\Modules\Simulation\Core\Runtime\Systems\StageSystemAdapter($app->make(\App\Modules\Simulation\Core\Runtime\Stages\RuleStage::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_ENVIRONMENT,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_METABOLISM,
                new \App\Modules\Simulation\Core\Runtime\Systems\StageSystemAdapter($app->make(\App\Modules\Simulation\Core\Runtime\Stages\EnvironmentStage::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_ENVIRONMENT,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_METABOLISM,
                new \App\Modules\Simulation\Core\Runtime\Systems\StageSystemAdapter($app->make(\App\Modules\Simulation\Core\Runtime\Stages\PhysicsStage::class))
            );

            // Phase 2: Life (Stages)
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_LIFE,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_PROPAGATION,
                new \App\Modules\Simulation\Core\Runtime\Systems\StageSystemAdapter($app->make(\App\Modules\Simulation\Core\Runtime\Stages\PopulationStage::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_LIFE,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_METABOLISM,
                new \App\Modules\Simulation\Core\Runtime\Systems\StageSystemAdapter($app->make(\App\Modules\Simulation\Core\Runtime\Stages\EcologyStage::class))
            );

            // Phase 3: Mind (FFI Vectorized Results + Behavioral Stages)
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_MIND,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_METABOLISM,
                new \App\Modules\Simulation\Core\Runtime\Systems\StageSystemAdapter($app->make(\App\Modules\Simulation\Core\Runtime\Stages\VectorizedActorStage::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_MIND,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_INNOVATION,
                new \App\Modules\Simulation\Core\Runtime\Systems\StageSystemAdapter($app->make(\App\Modules\Simulation\Core\Runtime\Stages\ActorStage::class))
            );

            // Phase 4: Social (Structural Stages)
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_COHESION,
                new \App\Modules\Simulation\Core\Runtime\Systems\StageSystemAdapter($app->make(\App\Modules\Simulation\Core\Runtime\Stages\CivilizationStage::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_ATTRACTION,
                new \App\Modules\Simulation\Core\Runtime\Systems\StageSystemAdapter($app->make(\App\Modules\Simulation\Core\Runtime\Stages\CivilizationFieldStage::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_EXTRACTION,
                new \App\Modules\Simulation\Core\Runtime\Systems\StageSystemAdapter($app->make(\App\Modules\Simulation\Core\Runtime\Stages\EconomyStage::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_EXTRACTION,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Social\FinanceEngine::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_EXTRACTION,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Social\ProductionChainEngine::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_COHESION,
                new \App\Modules\Simulation\Core\Runtime\Systems\StageSystemAdapter($app->make(\App\Modules\Simulation\Core\Runtime\Stages\PoliticsStage::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_COHESION,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Social\DiplomacyEngine::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_DIFFUSION,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Social\CultureEngine::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_DIFFUSION,
                new \App\Modules\Simulation\Core\Runtime\Systems\StageSystemAdapter($app->make(\App\Modules\Simulation\Core\Runtime\Stages\CultureStage::class))
            );

            // Phase 5: Meta (War & Cosmic)
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_META,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_CONFLICT,
                new \App\Modules\Simulation\Core\Runtime\Systems\StageSystemAdapter($app->make(\App\Modules\Simulation\Core\Runtime\Stages\WarStage::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_META,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_METABOLISM,
                new \App\Modules\Simulation\Core\Runtime\Systems\StageSystemAdapter($app->make(\App\Modules\Simulation\Core\Runtime\Stages\MetaCosmicStage::class))
            );


            // ===== Wave 2: Living System =====
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_LIFE,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_METABOLISM,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Environment\LivingWorldEngine::class))
            );

            // ===== Wave 3: Economy =====
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_EXTRACTION,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Social\MarketEngine::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_EXTRACTION,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Social\TradeEngine::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_EXTRACTION,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Social\GlobalEconomyEngine::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_COHESION,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Social\InequalityEngine::class))
            );

            // ===== Wave 4: Society & Politics =====
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_COHESION,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Social\PoliticsEngine::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_COHESION,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Social\LegitimacyEliteEngine::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_OBSERVATION,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Social\PsychologyEngine::class))
            );

            // ===== Wave 5: Civilization =====
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_COHESION,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Social\CivilizationSettlementEngine::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_METABOLISM,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Social\CivilizationPhysicsEngine::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_CYCLE,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Social\CivilizationLongCycleEngine::class))
            );
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_DIFFUSION,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Social\IdeaDiffusionEngine::class))
            );

            // ===== Wave 6: Conflict =====
            $kernel->registerSystem(
                \App\Modules\Simulation\Core\Runtime\WorldKernel::PHASE_META,
                \App\Modules\Simulation\Core\Runtime\WorldKernel::RULE_CONFLICT,
                new \App\Modules\Simulation\Core\Runtime\Systems\EngineSystemAdapter($app->make(\App\Modules\Simulation\Core\Engines\Social\WarEngine::class))
            );

            // ===== Wave 7: TODO — Activate Already-Implemented Engines =====
            // NOTE: The following engines exist with real logic but do NOT implement
            // SimulationEngine::handle(), run(), or update(). They need interface
            // refactoring before they can be registered via EngineSystemAdapter.
            // - HistoryEngine, HistoricalCycleEngine, HistoricalScarsEngine
            // - DynamicAttractorEngine, AttractorEngine, WorldWillEngine
            // - TransmigrationEngine, ChaosEngine, CapabilityEngine
            // - ActionExecutionEngine


            return $kernel;
        });

        $this->app->singleton(\App\Modules\Simulation\Core\Runtime\Systems\SurvivalSystem::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Runtime\Systems\ResourceSystem::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Runtime\Systems\PowerSystem::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Runtime\Systems\AllianceSystem::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Runtime\Systems\ConflictSystem::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Runtime\Systems\PropagationSystem::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Runtime\Systems\MythCreationSystem::class);
        
        // Advanced V10 Engines
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Meta\InformationPropagationEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Meta\PowerStructureEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Meta\CulturalInfluenceEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Meta\MythogenesisEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Meta\MeaningEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Meta\KnowledgeEvolutionEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Meta\ThermodynamicPhaseEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Meta\SingularityStabilityEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Engines\Meta\AscensionEngine::class, function ($app) {
            return new \App\Modules\Simulation\Core\Engines\Meta\AscensionEngine(
                $app->make(\App\Modules\Simulation\Services\Meta\WorldTemplateManager::class),
                $app->make(\App\Contracts\LlmNarrativeClientInterface::class),
            );
        });
        $this->app->singleton(\App\Modules\Simulation\Services\Ecology\ZenithMetricsService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\Core\ReasoningService::class);

        // AdvanceSimulationAction (Legacy facade, keep until fully replaced by WorldKernel)
        $this->app->singleton(\App\Modules\Intelligence\Services\CivilizationCollapseEngine::class);
        $this->app->tag(\config('worldos.engine_registry.engines', []), 'simulation_engine');
        $this->app->singleton(\App\Modules\Simulation\Core\EngineRegistry::class, function ($app) {
            $registry = new \App\Modules\Simulation\Core\EngineRegistry();
            foreach ($app->tagged('simulation_engine') as $engine) {
                $registry->register($engine);
            }
            return $registry;
        });
        $this->app->singleton(\App\Modules\Simulation\Core\SimulationScheduler::class, function ($app) {
            return new \App\Modules\Simulation\Core\SimulationScheduler(
                $app->make(\App\Modules\Simulation\Core\EngineRegistry::class),
                $app->make(\App\Modules\Simulation\Core\Runtime\Contracts\TickSchedulerInterface::class)
            );
        });
        $this->app->singleton(\App\Modules\Simulation\Core\SimulationKernel::class, function ($app) {
            return new \App\Modules\Simulation\Core\SimulationKernel(
                $app->make(\App\Modules\Simulation\Core\EffectResolver::class),
                $app->make(\App\Modules\Simulation\Core\EngineRegistry::class),
                $app->make(\App\Modules\Simulation\Core\Contracts\WorldEventBusInterface::class),
                $app->make(\App\Modules\Simulation\Core\Services\TickMetricsService::class)
            );
        });
        $this->app->singleton(\App\Modules\Simulation\Core\Services\SimulationReplayService::class, function ($app) {
            return new \App\Modules\Simulation\Core\Services\SimulationReplayService(
                $app->make(\App\Modules\Simulation\Core\SimulationKernel::class),
            );
        });

        // Note: SimulationKernel above is Legacy/Rule-based. 
        // WorldKernel (Phase 80) is the new System-driven core.

        // Simulation Runtime: Tick Scheduler + Pipeline + Orchestrator (refactor from AdvanceSimulationAction)
        $this->app->singleton(\App\Modules\Simulation\Services\Cosmology\SimulationClock::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Runtime\Contracts\TickSchedulerInterface::class, \App\Modules\Simulation\Core\Runtime\PhaseScheduler::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Runtime\SimulationTickPipeline::class, function ($app) {
            $scheduler = $app->make(\App\Modules\Simulation\Core\Runtime\Contracts\TickSchedulerInterface::class);
            $stageMap = [
                // Phase: environment
                'rule'         => \App\Modules\Simulation\Core\Runtime\Stages\RuleStage::class,
                'environment'  => \App\Modules\Simulation\Core\Runtime\Stages\EnvironmentStage::class,
                'physics'      => \App\Modules\Simulation\Core\Runtime\Stages\PhysicsStage::class,
                
                // Phase: life
                'population'   => \App\Modules\Simulation\Core\Runtime\Stages\PopulationStage::class,
                'ecology'      => \App\Modules\Simulation\Core\Runtime\Stages\EcologyStage::class,
                
                // Phase: mind
                'vector_actor' => \App\Modules\Simulation\Core\Runtime\Stages\VectorizedActorStage::class,
                'actor'        => \App\Modules\Simulation\Core\Runtime\Stages\ActorStage::class,
                
                // Phase: social
                'civilization' => \App\Modules\Simulation\Core\Runtime\Stages\CivilizationStage::class,
                'field'        => \App\Modules\Simulation\Core\Runtime\Stages\CivilizationFieldStage::class,
                'economy'      => \App\Modules\Simulation\Core\Runtime\Stages\EconomyStage::class,
                'politics'     => \App\Modules\Simulation\Core\Runtime\Stages\PoliticsStage::class,
                'culture'      => \App\Modules\Simulation\Core\Runtime\Stages\CultureStage::class,
                
                // Phase: meta
                'war'          => \App\Modules\Simulation\Core\Runtime\Stages\WarStage::class,
                'meta'         => \App\Modules\Simulation\Core\Runtime\Stages\MetaCosmicStage::class,
            ];
            $stages = [];
            foreach ($scheduler->stageOrder() as $key) {
                if (isset($stageMap[$key])) {
                    $stages[$key] = $app->make($stageMap[$key]);
                }
            }
            return new \App\Modules\Simulation\Core\Runtime\SimulationTickPipeline(
                $scheduler, 
                $stages,
                $app->make(\App\Modules\Simulation\Core\Runtime\State\StateManager::class),
                $app->make(\App\Modules\Simulation\Core\Runtime\EventDrivenScheduler::class),
                $app->make(\App\Modules\Simulation\Core\Engines\Biological\AutopoieticEvolutionEngine::class),
                $app->make(\App\Modules\Simulation\Services\Core\RuleMutationService::class),
                $app->make(\App\Modules\Simulation\Core\Engines\Meta\InformationPropagationEngine::class),
                $app->make(\App\Modules\Simulation\Core\Engines\Meta\PowerStructureEngine::class),
                $app->make(\App\Modules\Simulation\Core\Engines\Meta\CulturalInfluenceEngine::class),
                $app->make(\App\Modules\Simulation\Core\Engines\Meta\MythogenesisEngine::class),
                $app->make(\App\Modules\Simulation\Core\Engines\Meta\MeaningEngine::class),
                $app->make(\App\Modules\Simulation\Core\Engines\Meta\KnowledgeEvolutionEngine::class),
                $app->make(\App\Modules\Simulation\Core\Engines\Meta\ThermodynamicPhaseEngine::class),
                $app->make(\App\Modules\Simulation\Core\Engines\Meta\SingularityStabilityEngine::class),
                $app->make(\App\Modules\Simulation\Core\Engines\Meta\AscensionEngine::class),
                $app->make(\App\Modules\Simulation\Services\Ecology\ZenithMetricsService::class),
                $app->make(\App\Modules\Simulation\Core\Engines\Meta\CausalHistoryEngine::class),
                $app->make(\App\Modules\Simulation\Core\Runtime\WorldKernel::class),
                $app->make(\App\Modules\Narrative\Services\NarrativeEngine::class),
                $app->make(\App\Modules\Narrative\Services\NarrativeQueueManager::class)
            );
        });
        $this->app->singleton(\App\Modules\Simulation\Core\Runtime\SimulationTickOrchestrator::class);

        // State cache (optional) — Phase 2 §2.3
        $this->app->bind(\App\Modules\Simulation\Core\Contracts\StateCacheInterface::class, function ($app) {
            $driver = \config('worldos.state_cache.driver', 'null');
            if ($driver === 'redis') {
                return new \App\Modules\Simulation\Core\StateCache\RedisStateCache(
                    \config('worldos.state_cache.key_prefix', 'worldos:'),
                    \config('worldos.state_cache.ttl_seconds', 300)
                );
            }
            return $app->make(\App\Modules\Simulation\Core\StateCache\NullStateCache::class);
        });

        // Snapshot archive (S3/MinIO optional) — Doc §10
        $this->app->bind(\App\Modules\Simulation\Core\Contracts\SnapshotArchiveInterface::class, function ($app) {
            $driver = \config('worldos.snapshot.archive_driver', 'null');
            if ($driver === 's3') {
                return new \App\Modules\Simulation\Core\SnapshotArchive\S3SnapshotArchive(
                    \config('worldos.snapshot.archive.disk', 's3'),
                    \config('worldos.snapshot.archive.prefix', 'worldos/snapshots')
                );
            }
            return $app->make(\App\Modules\Simulation\Core\SnapshotArchive\NullSnapshotArchive::class);
        });

        // Phase 2: Simulation Supervisor
        $this->app->singleton(\App\Modules\Simulation\Core\Supervisor\EngineDriver::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Supervisor\StateSynchronizer::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Supervisor\SnapshotManager::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Supervisor\EventDispatcher::class);
        $this->app->singleton(\App\Modules\Simulation\Core\Supervisor\RuntimePipeline::class, function ($app) {
            $handlers = [
                $app->make(\App\Modules\Simulation\Core\Supervisor\Handlers\CognitivePostSnapshotHandler::class),
                $app->make(\App\Modules\Simulation\Core\Supervisor\Handlers\CollapsePostSnapshotHandler::class),
                $app->make(\App\Modules\Simulation\Core\Supervisor\Handlers\SocialGraphPostSnapshotHandler::class),
                $app->make(\App\Modules\Simulation\Core\Supervisor\Handlers\DemographicRatesPostSnapshotHandler::class),
                $app->make(\App\Modules\Simulation\Core\Supervisor\Handlers\UrbanStressAgriculturePostSnapshotHandler::class),
                $app->make(\App\Modules\Simulation\Core\Supervisor\Handlers\KnowledgeGraphPostSnapshotHandler::class),
                $app->make(\App\Modules\Simulation\Core\Supervisor\Handlers\CivilizationDiscoveryPostSnapshotHandler::class),
                $app->make(\App\Modules\Simulation\Core\Supervisor\Handlers\SelfImprovingPostSnapshotHandler::class),
                // RuleVm already handled in RuleStage
            ];
            return new \App\Modules\Simulation\Core\Supervisor\RuntimePipeline(
                $app->make(\App\Modules\Simulation\Core\Runtime\SimulationTickOrchestrator::class),
                $handlers
            );
        });
        $this->app->singleton(\App\Modules\Simulation\Core\Supervisor\SimulationSupervisor::class);
    }

    public function boot(): void
    {
        \Illuminate\Support\Facades\Event::listen(
            \App\Modules\Simulation\Events\PowerSystemTransitionTriggered::class,
            \App\Modules\Simulation\Listeners\HandlePowerSystemTransition::class
        );

        \Illuminate\Support\Facades\Event::listen(
            \App\Modules\Simulation\Events\EpochTransitioned::class,
            \App\Modules\Simulation\Listeners\HandleEpochTransition::class
        );

        Route::group([
            'prefix' => 'api',
            'middleware' => 'api',
        ], function () {
            $this->loadRoutesFrom(__DIR__ . '/../routes/api.php');
        });

        if ($this->app->runningInConsole()) {
            $this->commands([
                \App\Modules\Simulation\Console\Commands\AdvanceSimulationCommand::class,
                \App\Modules\Simulation\Console\Commands\AutonomicPulseCommand::class,
                \App\Modules\Simulation\Console\Commands\DeployRuleProposalCommand::class,
                \App\Modules\Simulation\Console\Commands\WorldOSRunContinuousCommand::class,
                \App\Modules\Simulation\Console\Commands\WorldosAutonomicPulseCommand::class,
                \App\Modules\Simulation\Console\Commands\WorldosBenchmarkTickCommand::class,
                \App\Modules\Simulation\Console\Commands\WorldosCalibrationCheckCommand::class,
                \App\Modules\Simulation\Console\Commands\WorldosReplayCommand::class,
                \App\Modules\Simulation\Console\Commands\WorldosSimulationBatchCommand::class,
                \App\Modules\Simulation\Console\Commands\WorldosSimulationMetricsCommand::class,
                \App\Modules\Simulation\Console\Commands\SeedMaterialsCommand::class,
                \App\Modules\Simulation\Console\Commands\KafkaEventStreamConsumeCommand::class,
                \App\Modules\Simulation\Console\Commands\ResetWorldOS::class,
                \App\Modules\Simulation\Console\Commands\RunDemoScenario::class,
                \App\Modules\Simulation\Console\Commands\WorldosDemoCommand::class,
                \App\Modules\Simulation\Console\Commands\WorldosEnginesCommand::class,
                \App\Modules\Simulation\Console\Commands\WorldosEngineProductsCommand::class,
                \App\Modules\Simulation\Console\Commands\WorldosMetricsReportCommand::class,
                \App\Modules\Simulation\Console\Commands\WorldosSimCommand::class,
            ]);
        }
    }
}

