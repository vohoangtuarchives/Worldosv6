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
            \App\Contracts\UniverseEvaluatorInterface::class,
            \App\Modules\Simulation\Services\AutonomicEvolutionEngine::class
        );

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
        $this->app->singleton(\App\Simulation\EngineRegistry::class, function ($app) {
            $registry = new \App\Simulation\EngineRegistry();
            $registry->register($app->make(\App\Modules\World\Services\GeographyEngine::class));
            $registry->register($app->make(\App\Simulation\Engines\PotentialFieldEngine::class));
            $registry->register($app->make(\App\Simulation\Engines\CosmicPressureEngine::class));
            $registry->register($app->make(\App\Simulation\Engines\StructuralDecayEngine::class));
            $registry->register($app->make(\App\Simulation\Engines\AdaptiveTopologyEngine::class));
            $registry->register($app->make(\App\Simulation\Engines\LawEvolutionEngine::class));
            $registry->register($app->make(\App\Simulation\Engines\ZoneConflictEngine::class));
            $registry->register($app->make(\App\Simulation\Engines\CulturalDriftEngine::class));
            return $registry;
        });
        $this->app->singleton(\App\Simulation\SimulationKernel::class, function ($app) {
            return new \App\Simulation\SimulationKernel(
                $app->make(\App\Simulation\EffectResolver::class),
                $app->make(\App\Simulation\EngineRegistry::class),
                $app->make(\App\Simulation\Contracts\WorldEventBusInterface::class)
            );
        });
    }

    public function boot(): void
    {
        // Add any event listeners or extra boot logic here
    }
}
