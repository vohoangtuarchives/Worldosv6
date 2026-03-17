<?php

namespace Tests\Feature\Simulation;

use App\Models\DiplomaticTreaty;
use App\Models\Universe;
use App\Simulation\Engines\Social\DiplomacyEngine;
use App\Simulation\Domain\TickContext;
use App\Simulation\Runtime\State\WorldState;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DiplomacyEngineTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Cần đảm bảo table được load hoặc RefreshDatabase hoạt động chuẩn
    }

    public function test_diplomacy_engine_expires_treaties()
    {
        $multiverse = \App\Models\Multiverse::create(['name' => 'Test Multiverse', 'slug' => 'test-mv']);
        $world = \App\Models\World::create([
            'multiverse_id' => $multiverse->id,
            'name' => 'Test World',
            'slug' => 'test-world-'.uniqid(),
            'world_seed' => [],
            'global_tick' => 0,
        ]);
        $universe = Universe::create([
            'world_id' => $world->id,
            'multiverse_id' => $multiverse->id,
            'name' => 'Test Universe',
            'status' => 'active',
            'current_tick' => 1,
            'entropy' => 0.5,
        ]);

        // Tạo 1 treaty hết hạn ở tick 100
        $treaty = DiplomaticTreaty::create([
            'universe_id' => $universe->id,
            'source_civ_id' => 1,
            'target_civ_id' => 2,
            'treaty_type' => 'ALLIANCE',
            'started_at_tick' => 10,
            'ends_at_tick' => 100,
            'is_active' => true,
        ]);

        $state = new WorldState([
            'universe_id' => $universe->id,
            'factions' => [
                ['id' => 1, 'ideology_vector' => [0.8, 0.2, 0.5]],
                ['id' => 2, 'ideology_vector' => [0.7, 0.3, 0.5]],
                ['id' => 3, 'ideology_vector' => [0.1, 0.9, 0.1]], // Rất khác biệt
            ]
        ]);

        $engine = app(DiplomacyEngine::class);
        config(['worldos.intelligence.diplomacy_tick_interval' => 1]); // Chạy mỗi tick để test dễ

        // Tick 90: Chưa hết hạn, tension phải thấp vì có ALLIANCE
        $result = $engine->runWithState($state, 90);
        $this->assertTrue(DiplomaticTreaty::find($treaty->id)->is_active);
        $this->assertEmpty($result->events);

        // Lấy effect merge state
        $effects = $result->stateChanges;
        $this->assertNotEmpty($effects);
        $diplomacy = $effects[0]['value'];
        $this->assertTrue($diplomacy['tensions']['1_2']['has_alliance']);
        $this->assertFalse($diplomacy['tensions']['1_3']['has_alliance']);

        // Tick 100: Hết hạn
        $result100 = $engine->runWithState($state, 100);
        
        // Kiểm tra db is_active = false
        $this->assertFalse(DiplomaticTreaty::find($treaty->id)->is_active);
        
        // Kiểm tra có event TREATY_EXPIRED
        $this->assertEquals('TREATY_EXPIRED', $result100->events[0]['type']);
        $this->assertEquals(1, $result100->events[0]['source_civ_id']);
        $this->assertEquals(2, $result100->events[0]['target_civ_id']);
    }
}
