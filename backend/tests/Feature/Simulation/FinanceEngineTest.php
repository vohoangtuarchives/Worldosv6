<?php

namespace Tests\Feature\Simulation;

use App\Models\Multiverse;
use App\Models\Universe;
use App\Simulation\Domain\TickContext;
use App\Simulation\Engines\Social\FinanceEngine;
use App\Simulation\Engines\Social\ProductionChainEngine;
use App\Simulation\Runtime\State\WorldState;
use Carbon\Carbon;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

class FinanceEngineTest extends TestCase
{
    use RefreshDatabase;

    public function test_finance_and_production_engines()
    {
        $now = Carbon::now();
        $multiverseId = DB::table('multiverses')->insertGetId([
            'name' => 'Test Multiverse',
            'slug' => 'test-multi',
        ]);
        $worldId = DB::table('worlds')->insertGetId([
            'name' => 'Test World',
            'slug' => 'test-world-' . uniqid(),
            'global_tick' => 0,
            'world_seed' => json_encode([]),
        ]);
        
        $universeId = DB::table('universes')->insertGetId([
            'multiverse_id' => $multiverseId,
            'world_id' => $worldId,
            'name' => 'Test Universe',
            'status' => 'active',
            'current_tick' => 1,
            'entropy' => 0.5,
            'state_vector' => json_encode([]),
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $state = new WorldState(['universe_id' => $universeId], []);
        
        // Mock a few zones with settlements
        $zones = [
            0 => [
                'state' => ['economy_surplus' => 100, 'economy_consumption' => 50], // Net +50
            ],
            1 => [
                'state' => ['economy_surplus' => 20, 'economy_consumption' => 80], // Net -60
            ]
        ];
        
        $state->set('zones', $zones);

        config(['worldos.testing' => true]);
        config(['worldos.intelligence.economy_tick_interval' => 1]);

        $ctx = new TickContext($universeId, 50, 49);

        // Run FinanceEngine
        $financeEngine = new FinanceEngine();
        $result1 = $financeEngine->handle($state, $ctx);
        $effect1 = $result1->stateChanges[0];
        $reflection1 = new \ReflectionClass($effect1);
        $prop1 = $reflection1->getProperty('changes');
        $prop1->setAccessible(true);
        $changes1 = $prop1->getValue($effect1);

        // Assert Finance
        $financeData = $changes1['civilization.finance'];
        $this->assertNotNull($financeData);
        $this->assertEquals(50, $financeData['zones'][0]['credit']);
        $this->assertEquals(0, $financeData['zones'][0]['debt']);
        
        $this->assertEquals(0, $financeData['zones'][1]['credit']);
        $this->assertEquals(60, $financeData['zones'][1]['debt']);
        
        $this->assertEquals(50, $financeData['total_credit']);
        $this->assertEquals(60, $financeData['total_debt']);

        // Run ProductionChainEngine
        $productionEngine = new ProductionChainEngine();
        $result2 = $productionEngine->handle($state, $ctx);
        $effect2 = $result2->stateChanges[0];
        $reflection2 = new \ReflectionClass($effect2);
        $prop2 = $reflection2->getProperty('changes');
        $prop2->setAccessible(true);
        $changes2 = $prop2->getValue($effect2);

        // Assert Production
        $productionData = $changes2['civilization.production'];
        $this->assertNotNull($productionData);
        
        // Bonus material count is 0 in DB, so multiplier = 1.0
        $this->assertEquals(1.0, $productionData['material_bonus_multiplier']);
        
        // Output Zone 0: 100 surplus * 1.0 * 0.5 = 50
        $this->assertEquals(50, $productionData['zones'][0]['industrial_output']);
        // Output Zone 1: 20 surplus * 1.0 * 0.5 = 10
        $this->assertEquals(10, $productionData['zones'][1]['industrial_output']);
        
        $this->assertEquals(60, $productionData['total_industrial_output']);
    }
}
