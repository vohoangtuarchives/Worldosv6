<?php

return [
    App\Providers\AppServiceProvider::class,
    App\Providers\RepositoryServiceProvider::class,
    App\Modules\Simulation\Providers\SimulationServiceProvider::class,
    App\Modules\Intelligence\Providers\IntelligenceServiceProvider::class,
    App\Modules\Institutions\Providers\InstitutionsServiceProvider::class,
    Laravel\Sanctum\SanctumServiceProvider::class,
];
