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

        // Narrative Engine: Strategy registry + pipeline (Event Aggregator → PromptBuilder → Generator → Writer)
        $this->app->singleton(\App\Services\Narrative\NarrativeStrategyRegistry::class, function ($app) {
            $registry = new \App\Services\Narrative\NarrativeStrategyRegistry();
            $registry->register($app->make(\App\Services\Narrative\Strategies\DeathNarrativeStrategy::class));
            $registry->register($app->make(\App\Services\Narrative\Strategies\RebirthNarrativeStrategy::class));
            $registry->register($app->make(\App\Services\Narrative\Strategies\ParadoxNarrativeStrategy::class));
            $registry->register($app->make(\App\Services\Narrative\Strategies\AnomalyNarrativeStrategy::class));
            $registry->register($app->make(\App\Services\Narrative\Strategies\LegacyNarrativeStrategy::class));
            return $registry;
        });
        $this->app->singleton(\App\Services\Narrative\NarrativeCache::class);
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
        // ProcessInstitutionalFramework (SupremeEntity, Institutions) must run BEFORE EvaluateSimulationResult
        // so Eval can merge cosmic impact into metrics and save once; no listener after Eval should write snapshot.
        \Illuminate\Support\Facades\Event::listen(
            \App\Events\Simulation\UniverseSimulationPulsed::class,
            \App\Modules\Institutions\Listeners\ProcessInstitutionalFramework::class
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
            \App\Events\Simulation\SimulationEventOccurred::class,
            \App\Listeners\Simulation\SyncWorldEventToGraph::class
        );
        \Illuminate\Support\Facades\Event::listen(
            \App\Events\Simulation\SimulationEventOccurred::class,
            \App\Listeners\Simulation\SyncWorldEventToCausalityGraph::class
        );
    }
}
