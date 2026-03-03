<?php

namespace App\Providers;

use App\Contracts\SimulationEngineClientInterface;
use App\Contracts\UniverseEvaluatorInterface;
use App\Repositories\UniverseSnapshotRepository;
use App\Services\Simulation\HttpSimulationEngineClient;
use App\Services\Simulation\StubSimulationEngineClient;
use App\Services\Simulation\UniverseEvaluator;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(SimulationEngineClientInterface::class, function ($app) {
            $url = (string) config('worldos.simulation_engine_grpc_url', '');
            if ($url !== '' && (str_starts_with($url, 'http://') || str_starts_with($url, 'https://'))) {
                return new HttpSimulationEngineClient($url);
            }
            return new StubSimulationEngineClient;
        });
        $this->app->bind(
            UniverseEvaluatorInterface::class,
            UniverseEvaluator::class
        );
        $this->app->singleton(UniverseSnapshotRepository::class);
        $this->app->singleton(\App\Services\Observer\ObserverService::class);
        $this->app->singleton(\App\Services\Simulation\CultureDiffusionService::class);
        $this->app->singleton(\App\Services\Simulation\InstitutionManager::class);
        $this->app->singleton(\App\Services\AI\MemoryService::class);
        $this->app->bind(
            \App\Contracts\GraphProviderInterface::class,
            \App\Services\Graph\RelationalGraphProvider::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \Illuminate\Support\Facades\Event::listen(
            \App\Events\Simulation\UniverseSimulationPulsed::class,
            \App\Listeners\Simulation\ProcessMaterialLifecycle::class
        );
        \Illuminate\Support\Facades\Event::listen(
            \App\Events\Simulation\UniverseSimulationPulsed::class,
            \App\Listeners\Simulation\ManageInstitutions::class
        );
        \Illuminate\Support\Facades\Event::listen(
            \App\Events\Simulation\UniverseSimulationPulsed::class,
            \App\Listeners\Simulation\GenerateNarrative::class
        );
        \Illuminate\Support\Facades\Event::listen(
            \App\Events\Simulation\UniverseSimulationPulsed::class,
            \App\Listeners\Simulation\EvaluateSimulationResult::class
        );
        \Illuminate\Support\Facades\Event::listen(
            \App\Events\Simulation\UniverseSimulationPulsed::class,
            \App\Listeners\Simulation\StagnationDetectorListener::class
        );
        \Illuminate\Support\Facades\Event::listen(
            \App\Events\Simulation\UniverseSimulationPulsed::class,
            \App\Listeners\Simulation\SyncToGraph::class
        );
    }
}
