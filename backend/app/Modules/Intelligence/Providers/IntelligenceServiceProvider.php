<?php

namespace App\Modules\Intelligence\Providers;

use Illuminate\Support\ServiceProvider;
use App\Modules\Intelligence\Contracts\ActorRepositoryInterface;
use App\Modules\Intelligence\Repositories\ActorEloquentRepository;
use App\Modules\Intelligence\Contracts\AgentDecisionRepositoryInterface;
use App\Modules\Intelligence\Repositories\AgentDecisionEloquentRepository;
use App\Modules\Intelligence\Contracts\AiMemoryRepositoryInterface;
use App\Modules\Intelligence\Repositories\AiMemoryEloquentRepository;

use App\Modules\Intelligence\Entities\Archetypes\Warlord;
use App\Modules\Intelligence\Entities\Archetypes\Technocrat;
use App\Modules\Intelligence\Entities\Archetypes\RogueAI;
use App\Modules\Intelligence\Entities\Archetypes\Archmage;
use App\Modules\Intelligence\Entities\Archetypes\VillageElder;
use App\Modules\Intelligence\Entities\Archetypes\TribalLeader;
use App\Modules\Intelligence\Services\ActorRegistry;
use App\Modules\Intelligence\Services\CivilizationAttractorEngine;

class IntelligenceServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Repository bindings
        $this->app->bind(ActorRepositoryInterface::class, ActorEloquentRepository::class);
        $this->app->bind(AgentDecisionRepositoryInterface::class, AgentDecisionEloquentRepository::class);
        $this->app->bind(AiMemoryRepositoryInterface::class, AiMemoryEloquentRepository::class);

        // Tag archetype classes for auto-discovery
        $this->app->tag([
            Warlord::class,
            Technocrat::class,
            RogueAI::class,
            Archmage::class,
            VillageElder::class,
            TribalLeader::class,
        ], 'archetype');

        // ActorRegistry with auto-discovery
        $this->app->singleton(ActorRegistry::class, function ($app) {
            return new ActorRegistry($app->tagged('archetype'));
        });

        // Civilization Attractor Engine (singleton — stateless)
        $this->app->singleton(CivilizationAttractorEngine::class);

        $this->app->singleton(\App\Modules\Intelligence\Services\ActorEvolutionService::class);
        $this->app->singleton(\App\Modules\Intelligence\Services\AgentAutonomyService::class);
    }

    public function boot(): void
    {
        // Future: Register event listeners or routes
    }
}
