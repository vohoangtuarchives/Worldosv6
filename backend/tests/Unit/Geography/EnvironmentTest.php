<?php

namespace Tests\Unit\Geography;

use App\Modules\Geography\Entities\NaturalResource;
use App\Modules\Geography\Services\EnvironmentTickService;
use App\Modules\Geography\ValueObjects\Tile;
use App\Modules\Geography\ValueObjects\Weather;
use Tests\TestCase;

class EnvironmentTest extends TestCase
{
    public function test_tile_traverse_cost_varies_by_biome_and_elevation(): void
    {
        $plains = new Tile(0, 0, Tile::BIOME_PLAINS, 'flat');
        $this->assertEquals(1.0, $plains->getTraverseCost());

        $forestHill = new Tile(1, 0, Tile::BIOME_FOREST, 'hill');
        $this->assertEquals(2.25, $forestHill->getTraverseCost()); // 1.5 * 1.5

        $mountain = new Tile(2, 0, Tile::BIOME_MOUNTAIN, 'high');
        $this->assertEquals(6.0, $mountain->getTraverseCost()); // 3.0 * 2.0
    }

    public function test_resource_regenerates_based_on_rate_and_weather(): void
    {
        $wood = new NaturalResource('wood1', 'wood', 50.0, 100.0, 5.0, 1.0);
        
        // Clear weather (multiplier 1.0) -> +5.0
        $wood->regenerate(1.0);
        $this->assertEquals(55.0, $wood->currentAmount);

        // Rain weather (multiplier 1.5) -> +7.5
        $wood->regenerate(1.5);
        $this->assertEquals(62.5, $wood->currentAmount);

        // Drought weather (multiplier 0.2) -> +1.0
        $wood->regenerate(0.2);
        $this->assertEquals(63.5, $wood->currentAmount);
    }

    public function test_mineral_resource_never_regenerates(): void
    {
        $stone = new NaturalResource('stone1', 'stone', 100.0, 100.0, 0.0, 2.0);
        $stone->harvest(50.0);
        
        $this->assertEquals(50.0, $stone->currentAmount);

        // Rain should not help minerals grow
        $stone->regenerate(1.5);
        $this->assertEquals(50.0, $stone->currentAmount);
    }

    public function test_environment_tick_loops_weather_and_resources(): void
    {
        $service = new EnvironmentTickService();
        $resources = [
            'r1' => new NaturalResource('r1', 'wood', 50.0, 100.0, 10.0, 1.0),
            'r2' => new NaturalResource('r2', 'stone', 10.0, 100.0, 0.0, 1.0)
        ];

        $weather = new Weather(Weather::TYPE_RAIN, 2, 1.0);

        // Tick 1 (Weather remain 1, regen x1.5)
        [$updatedResources, $nextWeather] = $service->tickEnvironment($resources, $weather, 1);
        
        $this->assertEquals(1, $nextWeather->durationTicks);
        $this->assertEquals(Weather::TYPE_RAIN, $nextWeather->type);
        $this->assertEquals(65.0, $updatedResources['r1']->currentAmount); // 50 + 10x1.5
        $this->assertEquals(10.0, $updatedResources['r2']->currentAmount); // No regen for stone
    }

    public function test_depleted_resource_is_removed_from_environment(): void
    {
        $service = new EnvironmentTickService();
        $resources = [
            'r1' => new NaturalResource('r1', 'wood', 0.0, 100.0, 10.0, 1.0), // Can grow back
            'r2' => new NaturalResource('r2', 'stone', 0.0, 100.0, 0.0, 1.0)  // Depleted!
        ];

        $weather = new Weather(Weather::TYPE_CLEAR, 2, 1.0);

        [$updatedResources, $nextWeather] = $service->tickEnvironment($resources, $weather, 1);
        
        $this->assertArrayHasKey('r1', $updatedResources);
        $this->assertArrayNotHasKey('r2', $updatedResources); // Removed!
    }
}
