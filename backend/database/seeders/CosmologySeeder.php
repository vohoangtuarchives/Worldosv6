<?php

namespace Database\Seeders;

use App\Models\Multiverse;
use App\Models\Saga;
use App\Models\Universe;
use App\Models\World;
use App\Services\Saga\SagaService;
use Illuminate\Database\Seeder;

class CosmologySeeder extends Seeder
{
    /**
     * Seed default Cosmology: one Multiverse, one World, one Saga, one Universe.
     * Run: php artisan db:seed --class=CosmologySeeder
     */
    public function run(): void
    {
        $multiverse = Multiverse::firstOrCreate(
            ['slug' => 'default'],
            [
                'name' => 'Default Multiverse',
                'config' => ['description' => 'WorldOS V6 demo'],
            ]
        );

        $world = World::firstOrCreate(
            ['slug' => 'default-world'],
            [
                'multiverse_id' => $multiverse->id,
                'name' => 'Default World',
                'axiom' => [
                    'entropy_conservation' => true,
                    'material_organization' => true,
                ],
                'world_seed' => ['archetypes' => []],
                'origin' => 'Vietnamese',
                'is_autonomic' => true,
                'current_genre' => 'urban',
                'base_genre' => 'urban',
            ]
        );

        $sagaService = app(SagaService::class);
        $existingUniverse = Universe::where('world_id', $world->id)->first();
        if (! $existingUniverse) {
            $sagaService->spawnUniverse($world);
        }

        $this->command?->info('Cosmology seeded: 1 Multiverse, 1 World, 1 Universe (Implicit Saga).');
    }
}
