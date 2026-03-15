<?php

namespace App\Modules\Simulation\Providers;

use Illuminate\Support\ServiceProvider;
use App\Modules\Simulation\Contracts\RelicRepositoryInterface;
use App\Modules\Simulation\Repositories\RelicEloquentRepository;
use App\Modules\Simulation\Contracts\TrajectoryRepositoryInterface;
use App\Modules\Simulation\Repositories\TrajectoryEloquentRepository;

use App\Modules\Simulation\Contracts\UniverseRepositoryInterface;
use App\Modules\Simulation\Repositories\UniverseEloquentRepository;

class SimulationServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Bindings for repositories
        $this->app->bind(RelicRepositoryInterface::class, RelicEloquentRepository::class);
        $this->app->bind(TrajectoryRepositoryInterface::class, TrajectoryEloquentRepository::class);
        $this->app->bind(UniverseRepositoryInterface::class, UniverseEloquentRepository::class);

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
            \App\Services\Simulation\StateVectorUniverseSimilarityService::class
        );
        $this->app->bind(\App\Contracts\CausalityGraphServiceInterface::class, function ($app) {
            return config('worldos.causality.driver', 'null') === 'redis'
                ? $app->make(\App\Services\Simulation\RedisCausalityGraphService::class)
                : $app->make(\App\Services\Simulation\NullCausalityGraphService::class);
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
                return $app->make(\App\Services\Simulation\EventStream\NullSimulationEventStreamProducer::class);
            }
            return new \App\Services\Simulation\EventStream\KafkaRestSimulationEventStreamProducer(
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
        $this->app->singleton(\App\Simulation\Engines\PotentialFieldEngine::class);
        $this->app->singleton(\App\Simulation\Engines\CosmicPressureEngine::class);
        $this->app->singleton(\App\Simulation\Engines\ZoneConflictEngine::class);
        $this->app->singleton(\App\Simulation\Engines\StructuralDecayEngine::class);
        $this->app->singleton(\App\Simulation\Engines\LawEvolutionEngine::class);
        $this->app->singleton(\App\Simulation\Engines\CulturalDriftEngine::class);
        $this->app->singleton(\App\Simulation\Engines\AdaptiveTopologyEngine::class);
        $this->app->singleton(\App\Simulation\Engines\CausalityEngine::class);
        $this->app->singleton(\App\Simulation\Engines\ClimateEngine::class);
        $this->app->singleton(\App\Simulation\Engines\AgricultureEngine::class);
        $this->app->singleton(\App\Simulation\Engines\PopulationEngine::class);
        $this->app->singleton(\App\Simulation\Engines\MigrationEngine::class);
        $this->app->singleton(\App\Simulation\Engines\DiseaseEngine::class);
        $this->app->singleton(\App\Simulation\Engines\CivilizationFormationEngine::class);
        $this->app->singleton(\App\Simulation\Engines\CitySimulationEngine::class);
        $this->app->singleton(\App\Simulation\Engines\GovernanceEngine::class);
        $this->app->singleton(\App\Simulation\Engines\TradeEngine::class);
        $this->app->singleton(\App\Simulation\Engines\KnowledgePropagationEngine::class);
        $this->app->singleton(\App\Simulation\Engines\TechEvolutionEngine::class);
        $this->app->singleton(\App\Simulation\Engines\ReligionEngine::class);
        $this->app->singleton(\App\Simulation\Engines\ArtCultureEngine::class);
        $this->app->singleton(\App\Simulation\Engines\PsychologyEngine::class);
        $this->app->singleton(\App\Simulation\Engines\MultiverseOsmosisEngine::class);
        $this->app->singleton(\App\Simulation\Engines\MetaAttractorEngine::class);
        $this->app->singleton(\App\Simulation\Engines\CivilizationPhysicsEngine::class);
        $this->app->singleton(\App\Simulation\Engines\CausalHistoryEngine::class);
        $this->app->singleton(\App\Simulation\Engines\OmegaConvergenceEngine::class);
        $this->app->singleton(\App\Simulation\Engines\CausalBridgeEngine::class);
        $this->app->singleton(\App\Simulation\Engines\PostApotheosisEngine::class);
        $this->app->singleton(\App\Services\Simulation\ObserverSpectrumService::class);
        $this->app->singleton(\App\Simulation\Engines\ResonanceBleedingEngine::class);
        $this->app->singleton(\App\Simulation\Engines\DynamicLawEngine::class);
        $this->app->singleton(\App\Simulation\Engines\RealityAnchorEngine::class);
        $this->app->singleton(\App\Simulation\Engines\DeepTimeMemoryEngine::class);
        $this->app->singleton(\App\Simulation\Engines\HigherDimensionalEngine::class);
        $this->app->singleton(\App\Simulation\Engines\InfiniteRecursionEngine::class);
        $this->app->singleton(\App\Simulation\Runtime\EventDrivenScheduler::class);
        $this->app->singleton(\App\Simulation\Engines\IdealismEngine::class);
        $this->app->singleton(\App\Simulation\Engines\SingularityEngine::class);
        $this->app->singleton(\App\Simulation\Engines\AutopoieticEvolutionEngine::class);
        $this->app->singleton(\App\Simulation\Engines\InformationDensityEngine::class);
        $this->app->singleton(\App\Services\Simulation\CausalCacheService::class);
        $this->app->singleton(\App\Services\Simulation\RuleMutationService::class);
        $this->app->singleton(\App\Services\Simulation\StructuralHashService::class);
        $this->app->singleton(\App\Services\Simulation\HolographicCompressionService::class);
        
        // Advanced V10 Engines
        $this->app->singleton(\App\Simulation\Engines\InformationPropagationEngine::class);
        $this->app->singleton(\App\Simulation\Engines\PowerStructureEngine::class);
        $this->app->singleton(\App\Simulation\Engines\CulturalAttractorEngine::class);
        $this->app->singleton(\App\Simulation\Engines\MythogenesisEngine::class);
        $this->app->singleton(\App\Simulation\Engines\MeaningEngine::class);
        $this->app->singleton(\App\Simulation\Engines\KnowledgeEvolutionEngine::class);
        $this->app->singleton(\App\Simulation\Engines\CivilizationPhaseTransitionEngine::class);
        $this->app->singleton(\App\Simulation\Engines\SingularityStabilityEngine::class);
        $this->app->singleton(\App\Simulation\Engines\AscensionEngine::class);
        $this->app->singleton(\App\Services\Simulation\ZenithMetricsService::class);
        $this->app->singleton(\App\Services\Simulation\ReasoningService::class);
        $this->app->singleton(\App\Services\Simulation\CivilizationCollapseEngine::class);
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
                $app->make(\App\Simulation\Contracts\WorldEventBusInterface::class)
            );
        });

        // Simulation Runtime: Tick Scheduler + Pipeline + Orchestrator (refactor from AdvanceSimulationAction)
        $this->app->singleton(\App\Services\Simulation\SimulationClock::class);
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
                $app->make(\App\Simulation\Engines\AutopoieticEvolutionEngine::class),
                $app->make(\App\Services\Simulation\RuleMutationService::class),
                $app->make(\App\Simulation\Engines\InformationPropagationEngine::class),
                $app->make(\App\Simulation\Engines\PowerStructureEngine::class),
                $app->make(\App\Simulation\Engines\CulturalAttractorEngine::class),
                $app->make(\App\Simulation\Engines\MythogenesisEngine::class),
                $app->make(\App\Simulation\Engines\MeaningEngine::class),
                $app->make(\App\Simulation\Engines\KnowledgeEvolutionEngine::class),
                $app->make(\App\Simulation\Engines\CivilizationPhaseTransitionEngine::class),
                $app->make(\App\Simulation\Engines\SingularityStabilityEngine::class),
                $app->make(\App\Simulation\Engines\AscensionEngine::class),
                $app->make(\App\Services\Simulation\ZenithMetricsService::class)
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
        // Add any event listeners or extra boot logic here
    }
}
