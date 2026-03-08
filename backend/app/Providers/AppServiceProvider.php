<?php

namespace App\Providers;

use App\Contracts\LlmNarrativeClientInterface;
use App\Contracts\SimulationEngineClientInterface;
use App\Contracts\UniverseEvaluatorInterface;
use App\Services\Narrative\OpenAINarrativeService;
use App\Repositories\UniverseSnapshotRepository;
use App\Services\Simulation\HttpSimulationEngineClient;
use App\Services\Simulation\StubSimulationEngineClient;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Ensure Monolog handler base classes load before config/logging.php references StreamHandler (fixes "AbstractHandler not found" on seed)
        class_exists(\Monolog\Handler\AbstractHandler::class, true);

        $this->app->bind(SimulationEngineClientInterface::class, function ($app) {
            $url = (string) config('worldos.simulation_engine_grpc_url', '');
            if ($url !== '' && (str_starts_with($url, 'http://') || str_starts_with($url, 'https://'))) {
                return new HttpSimulationEngineClient($url);
            }
            return new StubSimulationEngineClient;
        });
        $this->app->singleton(UniverseSnapshotRepository::class);
        $this->app->singleton(\App\Services\Observer\ObserverService::class);
        $this->app->singleton(\App\Services\AI\MemoryService::class);
        $this->app->bind(
            \App\Contracts\GraphProviderInterface::class,
            \App\Services\Graph\RelationalGraphProvider::class
        );
        $this->app->singleton(LlmNarrativeClientInterface::class, OpenAINarrativeService::class);
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
        \Illuminate\Support\Facades\Event::listen(
            \App\Events\Simulation\UniverseSimulationPulsed::class,
            \App\Modules\Intelligence\Listeners\ProcessIntelligenceEvolution::class
        );
        \Illuminate\Support\Facades\Event::listen(
            \App\Events\Simulation\UniverseSimulationPulsed::class,
            \App\Modules\Institutions\Listeners\ProcessInstitutionalFramework::class
        );
    }
}
