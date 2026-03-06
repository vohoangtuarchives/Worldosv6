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
        $this->app->singleton(\App\Modules\Simulation\Services\StrategicDecisionEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\ScenarioEngine::class);
        $this->app->singleton(\App\Modules\Simulation\Services\MultiverseInteractionService::class);
        $this->app->singleton(\App\Modules\Simulation\Services\WorldRegulatorEngine::class);

        $this->app->bind(
            \App\Contracts\UniverseEvaluatorInterface::class,
            \App\Modules\Simulation\Services\StrategicDecisionEngine::class
        );

        // Simulation Kernel (effect-based, deterministic tick)
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
        $this->app->singleton(\App\Simulation\SimulationKernel::class, function ($app) {
            $kernel = new \App\Simulation\SimulationKernel($app->make(\App\Simulation\EffectResolver::class));
            $factors = config('worldos.time_scale_factors', []);
            $kernel->registerEngine(
                $app->make(\App\Simulation\Engines\PotentialFieldEngine::class),
                $factors['potential_field'] ?? 1
            );
            $kernel->registerEngine(
                $app->make(\App\Simulation\Engines\ZoneConflictEngine::class),
                $factors['zone_conflict'] ?? 1
            );
            $kernel->registerEngine(
                $app->make(\App\Simulation\Engines\CosmicPressureEngine::class),
                $factors['cosmic_pressure'] ?? 1
            );
            $kernel->registerEngine(
                $app->make(\App\Simulation\Engines\StructuralDecayEngine::class),
                $factors['structural_decay'] ?? 5
            );
            $kernel->registerEngine(
                $app->make(\App\Simulation\Engines\CulturalDriftEngine::class),
                $factors['cultural_drift'] ?? 3
            );
            $kernel->registerEngine(
                $app->make(\App\Simulation\Engines\LawEvolutionEngine::class),
                $factors['law_evolution'] ?? 20
            );
            $kernel->registerEngine(
                $app->make(\App\Simulation\Engines\AdaptiveTopologyEngine::class),
                $factors['adaptive_topology'] ?? 50
            );
            return $kernel;
        });
    }

    public function boot(): void
    {
        // Add any event listeners or extra boot logic here
    }
}
