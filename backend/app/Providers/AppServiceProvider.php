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
        $this->app->singleton(\App\Services\Simulation\InstitutionalEngine::class);
        $this->app->singleton(\App\Services\AI\MemoryService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
