<?php

namespace App\Modules\Narrative\Providers;

use Illuminate\Support\ServiceProvider;
use App\Modules\Narrative\Services\NarrativeEngine;
use App\Modules\Narrative\Services\StateExtractorDSL;
use App\Modules\Narrative\Services\SignalExtractor;
use App\Modules\Narrative\Services\StateMutationEngine;
use App\Modules\Narrative\Services\ChronicleSynthesisEngine;
use App\Modules\Narrative\Services\UniverseHistoryGenerator;
use App\Modules\Narrative\Repositories\ChronicleMemoryRepository;
use App\Contracts\LlmNarrativeClientInterface;
use App\Modules\Narrative\Services\OpenAINarrativeService;

class NarrativeServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(StateExtractorDSL::class);
        $this->app->singleton(SignalExtractor::class);
        $this->app->singleton(StateMutationEngine::class);
        $this->app->singleton(ChronicleMemoryRepository::class);
        $this->app->singleton(ChronicleSynthesisEngine::class);
        $this->app->singleton(UniverseHistoryGenerator::class);
        
        $this->app->bind(LlmNarrativeClientInterface::class, OpenAINarrativeService::class);

        $this->app->singleton(NarrativeEngine::class);
    }

    public function boot(): void
    {
        // Internal event listeners for narrative feedback loops could be registered here
    }
}
