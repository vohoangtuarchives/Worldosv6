<?php

namespace App\Modules\Intelligence\Providers;

use Illuminate\Support\ServiceProvider;
use App\Modules\Intelligence\Contracts\ActorRepositoryInterface;
use App\Modules\Intelligence\Repositories\ActorEloquentRepository;
use App\Modules\Intelligence\Contracts\AgentDecisionRepositoryInterface;
use App\Modules\Intelligence\Repositories\AgentDecisionEloquentRepository;
use App\Modules\Intelligence\Contracts\AiMemoryRepositoryInterface;
use App\Modules\Intelligence\Repositories\AiMemoryEloquentRepository;

class IntelligenceServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(ActorRepositoryInterface::class, ActorEloquentRepository::class);
        $this->app->bind(AgentDecisionRepositoryInterface::class, AgentDecisionEloquentRepository::class);
        $this->app->bind(AiMemoryRepositoryInterface::class, AiMemoryEloquentRepository::class);
        
        $this->app->singleton(\App\Modules\Intelligence\Services\ActorRegistry::class);
        $this->app->singleton(\App\Modules\Intelligence\Services\ActorEvolutionService::class);
        $this->app->singleton(\App\Modules\Intelligence\Services\AgentAutonomyService::class);
    }

    public function boot(): void
    {
        // Future: Register event listeners or routes
    }
}
