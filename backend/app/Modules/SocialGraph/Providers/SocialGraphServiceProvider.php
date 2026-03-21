<?php

namespace App\Modules\SocialGraph\Providers;

use Illuminate\Support\ServiceProvider;
use App\Modules\SocialGraph\Services\Neo4jSocialSyncer;

class SocialGraphServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(Neo4jSocialSyncer::class, function ($app) {
            return new Neo4jSocialSyncer();
        });
    }

    public function boot(): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands([
                \App\Modules\SocialGraph\Console\Commands\Neo4jSyncCommand::class,
            ]);
        }
    }
}
