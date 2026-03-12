<?php

namespace Tests\Unit\Services\Simulation;

use App\Contracts\UniverseEvaluatorInterface;
use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Services\Simulation\DecisionEngine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;
use Mockery\MockInterface;

class DecisionEngineTest extends TestCase
{
    use RefreshDatabase;

    private DecisionEngine $engine;
    private MockInterface $evaluatorMock;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->evaluatorMock = $this->mock(UniverseEvaluatorInterface::class);
        $this->engine = new DecisionEngine($this->evaluatorMock);
    }

    private function createSnapshot(float $survival = 0.5, float $power = 0.5, float $wealth = 0.5, float $knowledge = 0.5, float $meaning = 0.5, int $tick = 200, ?Universe $parent = null): UniverseSnapshot
    {
        $universeData = [
            'world_id' => 1,
            'current_tick' => $tick,
        ];

        if ($parent) {
            $universeData['parent_universe_id'] = $parent->id;
        }

        $universe = Universe::create($universeData);

        return UniverseSnapshot::create([
            'universe_id' => $universe->id,
            'tick' => $tick,
            'entropy' => 0.5,
            'state_vector' => [
                'fields' => [
                    'survival' => $survival,
                    'power' => $power,
                    'wealth' => $wealth,
                    'knowledge' => $knowledge,
                    'meaning' => $meaning,
                ],
            ],
            'snapshot_data' => [],
        ]);
    }

    public function test_decide_recommends_fork_when_navigator_score_high(): void
    {
        // To get a high score, we need high novelty, high complexity, and high divergence.
        // Novelty: Use a field vector very far from known archetypes.
        $snapshot = $this->createSnapshot(1.0, 1.0, 1.0, 1.0, 1.0);

        // Maximize complexity: Add many institutions
        for ($i = 0; $i < 20; $i++) {
            DB::table('institutional_entities')->insert([
                'universe_id' => $snapshot->universe_id,
                'name' => 'Inst ' . $i,
                'type' => 'test',
                'created_at_tick' => 1,
                'state' => json_encode([]),
            ]);
        }

        $this->evaluatorMock->shouldReceive('evaluate')->once()->with($snapshot)->andReturn([
            'recommendation' => 'continue',
            'meta' => [],
        ]);

        $result = $this->engine->decide($snapshot);

        // Navigator score should be high enough to exceed FORK_THRESHOLD (0.65)
        // With extreme fields and max complexity, it should surpass 0.65 easily.
        $this->assertGreaterThanOrEqual(0.65, $result['navigator_score']);
        $this->assertEquals('fork', $result['action']);
    }

    public function test_decide_recommends_archive_when_navigator_score_low_and_not_in_grace_period(): void
    {
        // Low novelty: exact match to 'agrarian_empire'
        $snapshot = $this->createSnapshot(0.8, 0.7, 0.5, 0.3, 0.7, 200);

        // Low complexity: 0 institutions

        $this->evaluatorMock->shouldReceive('evaluate')->once()->with($snapshot)->andReturn([
            'recommendation' => 'continue',
            'meta' => [],
        ]);

        $result = $this->engine->decide($snapshot);

        // Score should be very low, below ARCHIVE_THRESHOLD (0.15)
        $this->assertLessThanOrEqual(0.15, $result['navigator_score']);
        
        // Should recommend archive because tick (200) >= MIN_TICKS_BEFORE_ARCHIVE (150)
        $this->assertEquals('archive', $result['action']);
    }

    public function test_decide_does_not_archive_in_grace_period(): void
    {
        // Exact same low-score scenario, but tick is 50 (below MIN_TICKS_BEFORE_ARCHIVE)
        $snapshot = $this->createSnapshot(0.8, 0.7, 0.5, 0.3, 0.7, 50);

        $this->evaluatorMock->shouldReceive('evaluate')->once()->with($snapshot)->andReturn([
            'recommendation' => 'continue',
            'meta' => [],
        ]);

        $result = $this->engine->decide($snapshot);

        // Nav score handles the low numbers, but the action stays 'continue' due to grace period logic
        $this->assertEquals('continue', $result['action']);
        
        // Also test the fork_grace_period condition
        $universe = $snapshot->universe;
        $universe->forked_at_tick = 180;
        $universe->save();

        $snapshot2 = $this->createSnapshot(0.8, 0.7, 0.5, 0.3, 0.7, 200); // 200 is >= 150 but within 50 ticks of 180
        $snapshot2->universe->forked_at_tick = 180;

        $this->evaluatorMock->shouldReceive('evaluate')->once()->with($snapshot2)->andReturn([
            'recommendation' => 'continue',
            'meta' => [],
        ]);

        $result2 = $this->engine->decide($snapshot2);
        
        $this->assertEquals('continue', $result2['action']);
    }

    public function test_decide_preserves_evaluator_recommendation_if_score_neutral(): void
    {
        // Moderate score, no extreme decisions forced
        $snapshot = $this->createSnapshot(0.5, 0.6, 0.85, 0.5, 0.4); // trade_empire match (low novelty)

        for ($i = 0; $i < 5; $i++) {
            DB::table('institutional_entities')->insert([
                'universe_id' => $snapshot->universe_id,
                'name' => 'Inst ' . $i,
                'type' => 'test',
                'created_at_tick' => 1,
                'state' => json_encode([]),
            ]);
        }

        $this->evaluatorMock->shouldReceive('evaluate')->once()->with($snapshot)->andReturn([
            'recommendation' => 'mutate', // An external recommendation
            'meta' => [],
        ]);

        $result = $this->engine->decide($snapshot);

        // Original recommendation 'mutate' should be preserved if it doesn't cross drastic thresholds
        $this->assertEquals('mutate', $result['action']);
    }
}
