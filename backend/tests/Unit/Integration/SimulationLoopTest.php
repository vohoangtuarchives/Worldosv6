<?php

namespace Tests\Unit\Integration;

use App\Modules\Economics\Services\HarvestingService;
use App\Simulation\Engines\Environment\GeographyEngine;
use App\Simulation\Engines\Integration\ActionExecutionEngine;
use App\Simulation\Engines\Integration\Handlers\EatActionHandler;
use App\Simulation\Engines\Integration\Handlers\ForageActionHandler;
use App\Simulation\Engines\Integration\Handlers\WanderActionHandler;
use App\Simulation\Entities\Agent;
use App\Simulation\State\WorldState;
use Tests\TestCase;

class SimulationLoopTest extends TestCase
{
    private ActionExecutionEngine $engine;
    private WorldState $world;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->engine = new ActionExecutionEngine();
        $this->engine->registerHandler(new WanderActionHandler());
        $this->engine->registerHandler(new ForageActionHandler(new HarvestingService()));
        $this->engine->registerHandler(new EatActionHandler());

        $this->world = new WorldState();
        $this->world->set('universe_id', 999);
    }

    public function test_biological_tick_increases_hunger_and_fear(): void
    {
        $agent = new Agent('a1');
        $agent->hunger = 0.5; // Đói vừa
        $agent->health = 100.0;

        $this->engine->tickAgents([$agent], $this->world);

        $this->assertEquals(0.51, $agent->hunger, "Hunger should increase by 0.01 per tick");
        
        // Không có action nào, nên queue vẫn rỗng
        $this->assertEmpty($agent->currentActionSequence);
    }

    public function test_agent_can_eat_when_hungry_to_reduce_fear(): void
    {
        $agent = new Agent('a2');
        $agent->hunger = 0.8; // Rất đói
        $agent->energy = 50.0;
        $agent->psychology->fear = 0.5;

        // Cho ít đồ ăn vào túi
        $item = new \App\Modules\Economics\ValueObjects\Item('f1', 'food', 10.0, 0.5);
        $agent->inventory->addItem($item);

        // Nạp lệnh GOAP
        $agent->currentActionSequence = ['eat'];

        $logs = $this->engine->tickAgents([$agent], $this->world);

        // 1 tick = hunger + 0.01 -> 0.81. Eat 5 food = -0.5 hunger -> 0.31
        $this->assertEqualsWithDelta(0.31, $agent->hunger, 0.05);

        // Ăn xong fear giảm 0.3. Tính cả BiologicalTick (fear + 0.081) thì: 0.5 + 0.081 - 0.3 = 0.281
        $this->assertEqualsWithDelta(0.281, $agent->psychology->fear, 0.05);

        $this->assertEmpty($agent->currentActionSequence, "Action should be removed from queue");
        $this->assertStringContainsString("successfully executed eat", $logs[0]);
    }

    public function test_agent_can_forage_and_eat_sequence(): void
    {
        // Phải fake map vì Forage cần Map
        // Inject fake state cho GeographyEngine vũ trụ 999
        $tickService = new \App\Modules\Geography\Services\EnvironmentTickService();
        $geoEngine = new GeographyEngine($tickService);
        // Chạy rỗng để init map
        $geoEngine->handle($this->world, new \App\Simulation\Context\SimulationContext(1));
        
        // Cưỡng ép ô 0,0 là Rừng (có đồ ăn)
        $persistent = &GeographyEngine::getPersistentState(999);
        $persistent['map']['0,0'] = new \App\Modules\Geography\ValueObjects\Tile(0, 0, 'forest');
        $persistent['resources']['0,0']['food1'] = new \App\Modules\Geography\Entities\NaturalResource('f1', 'food', 50, 50, 1.0, 1.0);

        $agent = new Agent('a3');
        $agent->x = 0; $agent->y = 0;
        $agent->hunger = 0.5;
        $agent->energy = 100.0;
        
        // SEQUENCE: Forage -> Eat
        $agent->currentActionSequence = ['forage', 'eat'];

        // TICK 1: Forage
        $this->engine->tickAgents([$agent], $this->world);
        $this->assertEquals('eat', $agent->currentActionSequence[0], "Next action should be eat");
        $this->assertTrue($agent->inventory->getCategoryTotal('food') > 0, "Should have food in inventory");

        // TICK 2: Eat
        $this->engine->tickAgents([$agent], $this->world);
        $this->assertEmpty($agent->currentActionSequence, "Queue should be empty");
        // Kiểm tra thấy no bụng hơn ván trước
        $this->assertTrue($agent->hunger < 0.5, "Hunger should be reduced after eating");
    }
}
