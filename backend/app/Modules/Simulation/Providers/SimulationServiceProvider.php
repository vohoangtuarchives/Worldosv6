<?php

namespace App\Modules\Simulation\Providers;

use Illuminate\Support\ServiceProvider;
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
        $this->app->register(\App\Modules\Narrative\Providers\NarrativeServiceProvider::class);

        // Bindings for repositories
        $this->app->bind(RelicRepositoryInterface::class, RelicEloquentRepository::class);
        $this->app->bind(TrajectoryRepositoryInterface::class, TrajectoryEloquentRepository::class);
        $this->app->bind(UniverseRepositoryInterface::class, UniverseEloquentRepository::class);
        $this->app->bind(\App\Modules\Simulation\Contracts\WorldRepositoryInterface::class, \App\Modules\Simulation\Repositories\WorldEloquentRepository::class);
        $this->app->bind(\App\Modules\Simulation\Contracts\SnapshotRepositoryInterface::class, \App\Modules\Simulation\Repositories\SnapshotEloquentRepository::class);

        // Vocation V1 Repository Bindings
        $this->app->bind(VocationRepositoryInterface::class, VocationEloquentRepository::class);
        $this->app->bind(SkillRepositoryInterface::class, SkillEloquentRepository::class);
        $this->app->bind(ActorMasteryRepositoryInterface::class, ActorMasteryEloquentRepository::class);

        $this->app->singleton(\App\Simulation\Domain\Pipelines\SpawnPipeline::class, function ($app) {
            return new \App\Simulation\Domain\Pipelines\SpawnPipeline([
                $app->make(\App\Simulation\Domain\Pipelines\Steps\InheritStateStep::class),
                $app->make(\App\Simulation\Domain\Pipelines\Steps\MutateGenomeStep::class),
                $app->make(\App\Simulation\Domain\Pipelines\Steps\PreCreateInjectionStep::class),
                $app->make(\App\Simulation\Domain\Pipelines\Steps\CreateUniverseStep::class),
                $app->make(\App\Simulation\Domain\Pipelines\Steps\InheritAxiomsStep::class),
                $app->make(\App\Simulation\Domain\Pipelines\Steps\FinalizeSpawnStep::class),
            ]);
        });

        $this->app->singleton(\App\Modules\Simulation\Services\ConvergenceEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\ResonanceEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\CausalCorrectionEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\PressureCalculator::class);
        $this->app->singleton(\App\Modules\Simulation\Services\CosmicPhaseDetector::class);
        $this->app->singleton(\App\Modules\Simulation\Services\ScenarioEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\MultiverseInteractionService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\WorldRegulatorEngine::class);

        $this->app->singleton(\App\Modules\Simulation\Services\AutonomicEvolutionEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\MultiverseSchedulerEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\TimelineSelectionEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\NarrativeExtractionEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\CivilizationMemoryEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\MythologyGeneratorEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\IdeologyEvolutionEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\GreatPersonEngine::class);
        $this->app->bind(
            \App\Contracts\UniverseSimilarityServiceInterface::class,
            \App\Modules\Simulation\Services\StateVectorUniverseSimilarityService::class
        );
        $this->app->bind(\App\Contracts\CausalityGraphServiceInterface::class, function ($app) {
            return config('worldos.causality.driver', 'null') === 'redis'
                ? $app->make(\App\Modules\Simulation\Services\RedisCausalityGraphService::class)
                : $app->make(\App\Modules\Simulation\Services\NullCausalityGraphService::class);
        });
        $this->app->bind(
            \App\Contracts\UniverseEvaluatorInterface::class,
            \App\Modules\Simulation\Services\AutonomicEvolutionEngine::class
        );

        // State Management (Phase 37)
        $this->app->singleton(\App\Simulation\Runtime\State\StateManager::class);

        // Simulation Kernel (effect-based, deterministic tick) + Event Bus (Tier 3, Phase 5 Track A)
        $this->app->singleton(\App\Simulation\SimulationEventBus::class);
        $this->app->bind(\App\Simulation\Contracts\WorldEventBusBackendInterface::class, function ($app) {
            $driver = config('worldos.event_bus.driver', 'database');
            return $driver === 'redis_stream'
                ? new \App\Simulation\EventBus\RedisStreamWorldEventBusBackend(true, config('worldos.event_bus.stream_key'))
                : $app->make(\App\Simulation\EventBus\DatabaseWorldEventBusBackend::class);
        });
        $this->app->singleton(\App\Simulation\Contracts\WorldEventBusInterface::class, \App\Simulation\WorldEventBus::class);
        $this->app->singleton(\App\Simulation\WorldEventBus::class);
        $this->app->bind(\App\Contracts\SimulationEventStreamProducerInterface::class, function ($app) {
            if (! config('worldos.event_stream.kafka_enabled', false)) {
                return $app->make(\App\Modules\Simulation\Services\EventStream\NullSimulationEventStreamProducer::class);
            }
            return new \App\Modules\Simulation\Services\EventStream\KafkaRestSimulationEventStreamProducer(
                config('worldos.event_stream.rest_proxy_url'),
                config('worldos.event_stream.topic_simulation_advanced'),
                config('worldos.event_stream.topic_events'),
            );
        });
        $this->app->bind(\App\Simulation\Contracts\WorldOsGraphServiceInterface::class, function ($app) {
            $enabled = config('worldos.graph.enabled', false);
            $uri = config('worldos.graph.uri', '');
            if (! $enabled || $uri === '') {
                return $app->make(\App\Simulation\Graph\NullWorldOsGraphService::class);
            }
            return new \App\Simulation\Graph\Neo4jWorldOsGraphService(
                $uri,
                config('worldos.graph.username'),
                config('worldos.graph.password')
            );
        });
        $this->app->singleton(\App\Simulation\EffectResolver::class);
        $this->app->singleton(\App\Simulation\Support\SnapshotLoader::class);
        $this->app->singleton(\App\Simulation\Services\ZonePressureCalculator::class);
        $this->app->singleton(\App\Simulation\Services\TopologyResolver::class);
        $this->app->singleton(\App\Simulation\Services\CosmicSignalCollector::class);
        $this->app->singleton(\App\Simulation\Services\PhasePressureCalculator::class);
        $this->app->singleton(\App\Simulation\Engines\Physics\PotentialFieldEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Physics\CosmicPressureEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Social\ZoneConflictEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Physics\StructuralDecayEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Meta\LawEvolutionEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Social\CulturalDriftEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Physics\AdaptiveTopologyEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Meta\CausalityEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Physics\ClimateEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Social\AgricultureEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Social\PopulationEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Social\MigrationEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Social\DiseaseEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Social\CivilizationFormationEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Social\CitySimulationEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Social\GovernanceEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Social\TradeEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Social\KnowledgePropagationEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Social\TechEvolutionEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Social\ReligionEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Social\ArtCultureEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Social\PsychologyEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Social\GlobalEconomyEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Social\MarketEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Social\InequalityEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Social\PoliticsEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Social\LegitimacyEliteEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Social\WarEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Social\EcologicalCollapseEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Social\EcologicalPhaseTransitionEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Physics\GeologicalEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Meta\MultiverseOsmosisEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Meta\MetaAttractorEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Social\CivilizationPhysicsEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Meta\CausalHistoryEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Meta\OmegaConvergenceEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Meta\CausalBridgeEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Meta\PostApotheosisEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\ObserverSpectrumService::class);
        $this->app->singleton(\App\Simulation\Engines\Meta\ResonanceBleedingEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Meta\DynamicLawEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Physics\RealityAnchorEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Meta\DeepTimeMemoryEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Meta\HigherDimensionalEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Meta\InfiniteRecursionEngine::class);
        $this->app->singleton(\App\Simulation\Runtime\EventDrivenScheduler::class);
        $this->app->singleton(\App\Simulation\Engines\Meta\IdealismEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Meta\SingularityEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Biological\AutopoieticEvolutionEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Meta\InformationDensityEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Physics\MetabolicEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Meta\IdeologyEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Meta\CulturalInfluenceEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\CausalCacheService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\RuleMutationService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\StructuralHashService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\HolographicCompressionService::class);

        // Batch 1: Physics & Metaphysics
        $this->app->singleton(\App\Modules\Simulation\Services\HeatDeathService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\RealityCalibrationService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\CosmicEnergyPoolService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\SamsaraService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\SoulAnchorService::class);

        // Batch 2: Social & Civilization
        $this->app->singleton(\App\Modules\Simulation\Services\CivilizationDiscoveryService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\DemographicRatesService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\SocialGraphService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\LegitimacyEliteService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\UrbanStressAgricultureService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\DemographicStages::class);

        // Batch 3: Narrative & Cognition
        $this->app->singleton(\App\Modules\Simulation\Services\ActorCognitiveService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\CivilizationNarrativeInterpreter::class);
        $this->app->singleton(\App\Modules\Simulation\Services\GrandNarrativeService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\HeroLifecycleService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\IdeologyConversionService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\KnowledgeGraphService::class);

        // Batch 4: Technical & Infrastructure
        $this->app->singleton(\App\Modules\Simulation\Services\SimulationClock::class);
        $this->app->singleton(\App\Modules\Simulation\Services\SimulationPRNG::class);

        // Batch 5: Intelligence & Emergence
        $this->app->singleton(\App\Modules\Simulation\Services\AnomalyGeneratorService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\EvolutionarySparkService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\SelfImprovingSimulationService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\TheDreamingService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\ZenithMetricsService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\ReasoningService::class);

        // Batch 6: Rule & DSL Engines
        $this->app->singleton(\App\Modules\Simulation\Services\RuleEngine\RuleVmService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\RuleEngine\FfiRuleEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\RuleEngine\RuleGraphService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\RuleEngine\DeployRuleProposalService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\RuleEngine\EventTriggerProcessor::class);

        // Batch 7: Infrastructure & Support
        $this->app->singleton(\App\Modules\Simulation\Services\SimulationMetricsExporter::class);
        $this->app->singleton(\App\Modules\Simulation\Services\SimulationMetricsLogger::class);
        $this->app->singleton(\App\Modules\Simulation\Services\SimulationTracer::class);
        $this->app->singleton(\App\Modules\Simulation\Services\MetricsExtractor::class);
        $this->app->singleton(\App\Modules\Simulation\Services\WorldSimulationStatusService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\StateVectorUniverseSimilarityService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\NullUniverseSimilarityService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\UniverseRuntimeService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\CheatGranterService::class);

        // Batch 8: Multiverse-Level Logic
        $this->app->singleton(\App\Modules\Simulation\Services\MultiverseSovereigntyService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\MultiverseSynthesisService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\CosmogenesisService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\TemporalSyncService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\ParadoxResolver::class);
        $this->app->singleton(\App\Modules\Simulation\Services\ResonanceAuditorService::class);

        // Batch 9: Emergent Physics & Social
        $this->app->singleton(\App\Modules\Simulation\Services\FieldDiffusionEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\GeographyResourceService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\GreatPersonLegacyService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\InnovationRateService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\InstitutionDecayService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\KernelMutationService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\MacroAgentSpawnService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\MetaEdictService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\SurvivalPruningService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\VaultService::class);

        // Batch 10: FFI & Clients
        $this->app->singleton(\App\Modules\Simulation\Services\AxiomRegistry::class);
        
        // Vocation V1 Engine Services
        $this->app->singleton(\App\Modules\Simulation\Vocation\DSL\ExpressionEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Vocation\Services\ElementInteractionService::class);
        $this->app->singleton(\App\Modules\Simulation\Vocation\Services\VocationEvolutionService::class);
        $this->app->singleton(\App\Modules\Simulation\Vocation\Services\VocationEngine::class);

        $this->app->singleton(\App\Modules\Simulation\Services\HttpSimulationEngineClient::class);
        $this->app->singleton(\App\Modules\Simulation\Services\StubSimulationEngineClient::class);
        $this->app->singleton(\App\Modules\Simulation\Services\FfiActorEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\FeatureExtractionService::class);

        // Phase 80: World Kernel & Primitive Systems (§World-Kernel Architecture)
        $this->app->singleton(\App\Simulation\Runtime\WorldKernel::class, function ($app) {
            $kernel = new \App\Simulation\Runtime\WorldKernel($app->make(\App\Simulation\Runtime\State\StateManager::class));
            
            // Phase 1: Environment
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_ENVIRONMENT,
                \App\Simulation\Runtime\WorldKernel::RULE_METABOLISM,
                new \App\Simulation\Runtime\Systems\EngineSystemAdapter($app->make(\App\Simulation\Engines\Physics\MetabolicEngine::class))
            );
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_ENVIRONMENT,
                \App\Simulation\Runtime\WorldKernel::RULE_EXTRACTION,
                $app->make(\App\Simulation\Runtime\Systems\ResourceSystem::class)
            );

            // Phase 2: Life
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_LIFE,
                \App\Simulation\Runtime\WorldKernel::RULE_METABOLISM,
                $app->make(\App\Simulation\Runtime\Systems\SurvivalSystem::class)
            );

            // Phase 3: Mind
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_MIND,
                \App\Simulation\Runtime\WorldKernel::RULE_DIFFUSION,
                $app->make(\App\Simulation\Runtime\Systems\PropagationSystem::class)
            );

            // Phase 4: Social
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Simulation\Runtime\WorldKernel::RULE_COHESION,
                $app->make(\App\Simulation\Runtime\Systems\PowerSystem::class)
            );
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Simulation\Runtime\WorldKernel::RULE_COHESION,
                $app->make(\App\Simulation\Runtime\Systems\AllianceSystem::class)
            );

            // Phase 5: Meta
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_META,
                \App\Simulation\Runtime\WorldKernel::RULE_CONFLICT,
                $app->make(\App\Simulation\Runtime\Systems\ConflictSystem::class)
            );
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_META,
                \App\Simulation\Runtime\WorldKernel::RULE_NARRATIVE,
                $app->make(\App\Simulation\Runtime\Systems\MythCreationSystem::class)
            );

            // Phase 3: Mind (V10 Engines)
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_MIND,
                \App\Simulation\Runtime\WorldKernel::RULE_DIFFUSION,
                new \App\Simulation\Runtime\Systems\EngineSystemAdapter($app->make(\App\Simulation\Engines\Meta\InformationPropagationEngine::class))
            );
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_MIND,
                \App\Simulation\Runtime\WorldKernel::RULE_INNOVATION,
                new \App\Simulation\Runtime\Systems\EngineSystemAdapter($app->make(\App\Simulation\Engines\Meta\MeaningEngine::class))
            );
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_MIND,
                \App\Simulation\Runtime\WorldKernel::RULE_INNOVATION,
                new \App\Simulation\Runtime\Systems\EngineSystemAdapter($app->make(\App\Simulation\Engines\Meta\KnowledgeEvolutionEngine::class))
            );

            // Phase 4: Social (V10 Engines)
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Simulation\Runtime\WorldKernel::RULE_COHESION,
                new \App\Simulation\Runtime\Systems\EngineSystemAdapter($app->make(\App\Simulation\Engines\Meta\PowerStructureEngine::class))
            );
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Simulation\Runtime\WorldKernel::RULE_ATTRACTION,
                new \App\Simulation\Runtime\Systems\EngineSystemAdapter($app->make(\App\Simulation\Engines\Social\CulturalAttractorEngine::class))
            );
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Simulation\Runtime\WorldKernel::RULE_CYCLE,
                new \App\Simulation\Runtime\Systems\EngineSystemAdapter($app->make(\App\Simulation\Engines\Meta\ThermodynamicPhaseEngine::class))
            );

            // Phase 5: Meta (V10 Engines)
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_META,
                \App\Simulation\Runtime\WorldKernel::RULE_NARRATIVE,
                new \App\Simulation\Runtime\Systems\EngineSystemAdapter($app->make(\App\Simulation\Engines\Meta\MythogenesisEngine::class))
            );
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_META,
                \App\Simulation\Runtime\WorldKernel::RULE_NARRATIVE,
                new \App\Simulation\Runtime\Systems\EngineSystemAdapter($app->make(\App\Simulation\Engines\Meta\CulturalInfluenceEngine::class))
            );
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_META,
                \App\Simulation\Runtime\WorldKernel::RULE_NARRATIVE,
                new \App\Simulation\Runtime\Systems\EngineSystemAdapter($app->make(\App\Simulation\Engines\Meta\IdeologyEngine::class))
            );
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_META,
                \App\Simulation\Runtime\WorldKernel::RULE_CORRECTION,
                new \App\Simulation\Runtime\Systems\EngineSystemAdapter($app->make(\App\Simulation\Engines\Meta\CausalHistoryEngine::class))
            );
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_META,
                \App\Simulation\Runtime\WorldKernel::RULE_ENTROPY,
                new \App\Simulation\Runtime\Systems\EngineSystemAdapter($app->make(\App\Simulation\Engines\Meta\SingularityStabilityEngine::class))
            );
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_META,
                \App\Simulation\Runtime\WorldKernel::RULE_ASCENSION,
                new \App\Simulation\Runtime\Systems\EngineSystemAdapter($app->make(\App\Simulation\Engines\Meta\AscensionEngine::class))
            );

            // Phase 1: Environment (Stages)
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_ENVIRONMENT,
                \App\Simulation\Runtime\WorldKernel::RULE_METABOLISM,
                new \App\Simulation\Runtime\Systems\StageSystemAdapter($app->make(\App\Simulation\Runtime\Stages\RuleStage::class))
            );
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_ENVIRONMENT,
                \App\Simulation\Runtime\WorldKernel::RULE_METABOLISM,
                new \App\Simulation\Runtime\Systems\StageSystemAdapter($app->make(\App\Simulation\Runtime\Stages\EnvironmentStage::class))
            );
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_ENVIRONMENT,
                \App\Simulation\Runtime\WorldKernel::RULE_METABOLISM,
                new \App\Simulation\Runtime\Systems\StageSystemAdapter($app->make(\App\Simulation\Runtime\Stages\PhysicsStage::class))
            );

            // Phase 2: Life (Stages)
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_LIFE,
                \App\Simulation\Runtime\WorldKernel::RULE_PROPAGATION,
                new \App\Simulation\Runtime\Systems\StageSystemAdapter($app->make(\App\Simulation\Runtime\Stages\PopulationStage::class))
            );
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_LIFE,
                \App\Simulation\Runtime\WorldKernel::RULE_METABOLISM,
                new \App\Simulation\Runtime\Systems\StageSystemAdapter($app->make(\App\Simulation\Runtime\Stages\EcologyStage::class))
            );

            // Phase 3: Mind (FFI Vectorized Results + Behavioral Stages)
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_MIND,
                \App\Simulation\Runtime\WorldKernel::RULE_METABOLISM,
                new \App\Simulation\Runtime\Systems\StageSystemAdapter($app->make(\App\Simulation\Runtime\Stages\VectorizedActorStage::class))
            );
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_MIND,
                \App\Simulation\Runtime\WorldKernel::RULE_INNOVATION,
                new \App\Simulation\Runtime\Systems\StageSystemAdapter($app->make(\App\Simulation\Runtime\Stages\ActorStage::class))
            );

            // Phase 4: Social (Structural Stages)
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Simulation\Runtime\WorldKernel::RULE_COHESION,
                new \App\Simulation\Runtime\Systems\StageSystemAdapter($app->make(\App\Simulation\Runtime\Stages\CivilizationStage::class))
            );
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Simulation\Runtime\WorldKernel::RULE_ATTRACTION,
                new \App\Simulation\Runtime\Systems\StageSystemAdapter($app->make(\App\Simulation\Runtime\Stages\CivilizationFieldStage::class))
            );
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Simulation\Runtime\WorldKernel::RULE_EXTRACTION,
                new \App\Simulation\Runtime\Systems\StageSystemAdapter($app->make(\App\Simulation\Runtime\Stages\EconomyStage::class))
            );
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Simulation\Runtime\WorldKernel::RULE_EXTRACTION,
                new \App\Simulation\Runtime\Systems\EngineSystemAdapter($app->make(\App\Simulation\Engines\Social\FinanceEngine::class))
            );
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Simulation\Runtime\WorldKernel::RULE_EXTRACTION,
                new \App\Simulation\Runtime\Systems\EngineSystemAdapter($app->make(\App\Simulation\Engines\Social\ProductionChainEngine::class))
            );
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Simulation\Runtime\WorldKernel::RULE_COHESION,
                new \App\Simulation\Runtime\Systems\StageSystemAdapter($app->make(\App\Simulation\Runtime\Stages\PoliticsStage::class))
            );
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Simulation\Runtime\WorldKernel::RULE_COHESION,
                new \App\Simulation\Runtime\Systems\EngineSystemAdapter($app->make(\App\Simulation\Engines\Social\DiplomacyEngine::class))
            );
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Simulation\Runtime\WorldKernel::RULE_DIFFUSION,
                new \App\Simulation\Runtime\Systems\EngineSystemAdapter($app->make(\App\Simulation\Engines\Social\CultureEngine::class))
            );
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_SOCIAL,
                \App\Simulation\Runtime\WorldKernel::RULE_DIFFUSION,
                new \App\Simulation\Runtime\Systems\StageSystemAdapter($app->make(\App\Simulation\Runtime\Stages\CultureStage::class))
            );

            // Phase 5: Meta (War & Cosmic)
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_META,
                \App\Simulation\Runtime\WorldKernel::RULE_CONFLICT,
                new \App\Simulation\Runtime\Systems\StageSystemAdapter($app->make(\App\Simulation\Runtime\Stages\WarStage::class))
            );
            $kernel->registerSystem(
                \App\Simulation\Runtime\WorldKernel::PHASE_META,
                \App\Simulation\Runtime\WorldKernel::RULE_METABOLISM,
                new \App\Simulation\Runtime\Systems\StageSystemAdapter($app->make(\App\Simulation\Runtime\Stages\MetaCosmicStage::class))
            );


            return $kernel;
        });

        $this->app->singleton(\App\Simulation\Runtime\Systems\SurvivalSystem::class);
        $this->app->singleton(\App\Simulation\Runtime\Systems\ResourceSystem::class);
        $this->app->singleton(\App\Simulation\Runtime\Systems\PowerSystem::class);
        $this->app->singleton(\App\Simulation\Runtime\Systems\AllianceSystem::class);
        $this->app->singleton(\App\Simulation\Runtime\Systems\ConflictSystem::class);
        $this->app->singleton(\App\Simulation\Runtime\Systems\PropagationSystem::class);
        $this->app->singleton(\App\Simulation\Runtime\Systems\MythCreationSystem::class);
        
        // Advanced V10 Engines
        $this->app->singleton(\App\Simulation\Engines\Meta\InformationPropagationEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Meta\PowerStructureEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Social\CulturalAttractorEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Meta\MythogenesisEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Meta\MeaningEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Meta\KnowledgeEvolutionEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Meta\ThermodynamicPhaseEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Meta\SingularityStabilityEngine::class);
        $this->app->singleton(\App\Simulation\Engines\Meta\AscensionEngine::class, function ($app) {
            return new \App\Simulation\Engines\Meta\AscensionEngine(
                $app->make(\App\Modules\Simulation\Services\WorldTemplateManager::class),
                $app->make(\App\Contracts\LlmNarrativeClientInterface::class),
            );
        });
        $this->app->singleton(\App\Modules\Simulation\Services\ZenithMetricsService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\ReasoningService::class);

        // AdvanceSimulationAction (Legacy facade, keep until fully replaced by WorldKernel)
        $this->app->singleton(\App\Simulation\Engines\Social\CivilizationCollapseEngine::class);
        $this->app->tag(config('worldos.engine_registry.engines', []), 'simulation_engine');
        $this->app->singleton(\App\Simulation\EngineRegistry::class, function ($app) {
            $registry = new \App\Simulation\EngineRegistry();
            foreach ($app->tagged('simulation_engine') as $engine) {
                $registry->register($engine);
            }
            return $registry;
        });
        $this->app->singleton(\App\Simulation\SimulationScheduler::class, function ($app) {
            return new \App\Simulation\SimulationScheduler(
                $app->make(\App\Simulation\EngineRegistry::class),
                $app->make(\App\Simulation\Runtime\Contracts\TickSchedulerInterface::class)
            );
        });
        $this->app->singleton(\App\Simulation\SimulationKernel::class, function ($app) {
            return new \App\Simulation\SimulationKernel(
                $app->make(\App\Simulation\EffectResolver::class),
                $app->make(\App\Simulation\EngineRegistry::class),
                $app->make(\App\Simulation\Contracts\WorldEventBusInterface::class),
                $app->make(\App\Simulation\Services\TickMetricsService::class)
            );
        });
        $this->app->singleton(\App\Simulation\Services\SimulationReplayService::class, function ($app) {
            return new \App\Simulation\Services\SimulationReplayService(
                $app->make(\App\Simulation\SimulationKernel::class),
            );
        });

        // Note: SimulationKernel above is Legacy/Rule-based. 
        // WorldKernel (Phase 80) is the new System-driven core.

        // Simulation Runtime: Tick Scheduler + Pipeline + Orchestrator (refactor from AdvanceSimulationAction)
        $this->app->singleton(\App\Modules\Simulation\Services\SimulationClock::class);
        $this->app->singleton(\App\Simulation\Runtime\Contracts\TickSchedulerInterface::class, \App\Simulation\Runtime\PhaseScheduler::class);
        $this->app->singleton(\App\Simulation\Runtime\SimulationTickPipeline::class, function ($app) {
            $scheduler = $app->make(\App\Simulation\Runtime\Contracts\TickSchedulerInterface::class);
            $stageMap = [
                // Phase: environment
                'rule'         => \App\Simulation\Runtime\Stages\RuleStage::class,
                'environment'  => \App\Simulation\Runtime\Stages\EnvironmentStage::class,
                'physics'      => \App\Simulation\Runtime\Stages\PhysicsStage::class,
                
                // Phase: life
                'population'   => \App\Simulation\Runtime\Stages\PopulationStage::class,
                'ecology'      => \App\Simulation\Runtime\Stages\EcologyStage::class,
                
                // Phase: mind
                'vector_actor' => \App\Simulation\Runtime\Stages\VectorizedActorStage::class,
                'actor'        => \App\Simulation\Runtime\Stages\ActorStage::class,
                
                // Phase: social
                'civilization' => \App\Simulation\Runtime\Stages\CivilizationStage::class,
                'field'        => \App\Simulation\Runtime\Stages\CivilizationFieldStage::class,
                'economy'      => \App\Simulation\Runtime\Stages\EconomyStage::class,
                'politics'     => \App\Simulation\Runtime\Stages\PoliticsStage::class,
                'culture'      => \App\Simulation\Runtime\Stages\CultureStage::class,
                
                // Phase: meta
                'war'          => \App\Simulation\Runtime\Stages\WarStage::class,
                'meta'         => \App\Simulation\Runtime\Stages\MetaCosmicStage::class,
            ];
            $stages = [];
            foreach ($scheduler->stageOrder() as $key) {
                if (isset($stageMap[$key])) {
                    $stages[$key] = $app->make($stageMap[$key]);
                }
            }
            return new \App\Simulation\Runtime\SimulationTickPipeline(
                $scheduler, 
                $stages,
                $app->make(\App\Simulation\Runtime\State\StateManager::class),
                $app->make(\App\Simulation\Runtime\EventDrivenScheduler::class),
                $app->make(\App\Simulation\Engines\Biological\AutopoieticEvolutionEngine::class),
                $app->make(\App\Modules\Simulation\Services\RuleMutationService::class),
                $app->make(\App\Simulation\Engines\Meta\InformationPropagationEngine::class),
                $app->make(\App\Simulation\Engines\Meta\PowerStructureEngine::class),
                $app->make(\App\Simulation\Engines\Social\CulturalAttractorEngine::class),
                $app->make(\App\Simulation\Engines\Meta\MythogenesisEngine::class),
                $app->make(\App\Simulation\Engines\Meta\MeaningEngine::class),
                $app->make(\App\Simulation\Engines\Meta\KnowledgeEvolutionEngine::class),
                $app->make(\App\Simulation\Engines\Meta\ThermodynamicPhaseEngine::class),
                $app->make(\App\Simulation\Engines\Meta\SingularityStabilityEngine::class),
                $app->make(\App\Simulation\Engines\Meta\AscensionEngine::class),
                $app->make(\App\Modules\Simulation\Services\ZenithMetricsService::class),
                $app->make(\App\Simulation\Engines\Meta\CausalHistoryEngine::class),
                $app->make(\App\Simulation\Runtime\WorldKernel::class),
                $app->make(\App\Modules\Narrative\Services\NarrativeEngine::class)
            );
        });
        $this->app->singleton(\App\Simulation\Runtime\SimulationTickOrchestrator::class);

        // State cache (optional) — Phase 2 §2.3
        $this->app->bind(\App\Simulation\Contracts\StateCacheInterface::class, function ($app) {
            $driver = config('worldos.state_cache.driver', 'null');
            if ($driver === 'redis') {
                return new \App\Simulation\StateCache\RedisStateCache(
                    config('worldos.state_cache.key_prefix', 'worldos:'),
                    config('worldos.state_cache.ttl_seconds', 300)
                );
            }
            return $app->make(\App\Simulation\StateCache\NullStateCache::class);
        });

        // Snapshot archive (S3/MinIO optional) — Doc §10
        $this->app->bind(\App\Simulation\Contracts\SnapshotArchiveInterface::class, function ($app) {
            $driver = config('worldos.snapshot.archive_driver', 'null');
            if ($driver === 's3') {
                return new \App\Simulation\SnapshotArchive\S3SnapshotArchive(
                    config('worldos.snapshot.archive.disk', 's3'),
                    config('worldos.snapshot.archive.prefix', 'worldos/snapshots')
                );
            }
            return $app->make(\App\Simulation\SnapshotArchive\NullSnapshotArchive::class);
        });

        // Phase 2: Simulation Supervisor
        $this->app->singleton(\App\Simulation\Supervisor\EngineDriver::class);
        $this->app->singleton(\App\Simulation\Supervisor\StateSynchronizer::class);
        $this->app->singleton(\App\Simulation\Supervisor\SnapshotManager::class);
        $this->app->singleton(\App\Simulation\Supervisor\EventDispatcher::class);
        $this->app->singleton(\App\Simulation\Supervisor\RuntimePipeline::class, function ($app) {
            $handlers = [
                $app->make(\App\Simulation\Supervisor\Handlers\CognitivePostSnapshotHandler::class),
                $app->make(\App\Simulation\Supervisor\Handlers\CollapsePostSnapshotHandler::class),
                $app->make(\App\Simulation\Supervisor\Handlers\SocialGraphPostSnapshotHandler::class),
                $app->make(\App\Simulation\Supervisor\Handlers\DemographicRatesPostSnapshotHandler::class),
                $app->make(\App\Simulation\Supervisor\Handlers\UrbanStressAgriculturePostSnapshotHandler::class),
                $app->make(\App\Simulation\Supervisor\Handlers\KnowledgeGraphPostSnapshotHandler::class),
                $app->make(\App\Simulation\Supervisor\Handlers\CivilizationDiscoveryPostSnapshotHandler::class),
                $app->make(\App\Simulation\Supervisor\Handlers\SelfImprovingPostSnapshotHandler::class),
                // RuleVm already handled in RuleStage
            ];
            return new \App\Simulation\Supervisor\RuntimePipeline(
                $app->make(\App\Simulation\Runtime\SimulationTickOrchestrator::class),
                $handlers
            );
        });
        $this->app->singleton(\App\Simulation\Supervisor\SimulationSupervisor::class);
    }

    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__ . '/../routes/api.php');
    }
}

