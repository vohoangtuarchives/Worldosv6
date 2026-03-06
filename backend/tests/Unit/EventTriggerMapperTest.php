<?php

namespace Tests\Unit;

use App\Services\Narrative\EventTriggerMapper;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EventTriggerMapperTest extends TestCase
{
    use RefreshDatabase;

    protected EventTriggerMapper $mapper;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mapper = $this->app->make(EventTriggerMapper::class);
    }

    public function test_get_metric_value_reads_from_root_metrics_and_pressures(): void
    {
        $vec = [
            'entropy' => 0.7,
            'order' => 0.5,
            'metrics' => ['stability_index' => 0.6, 'energy_level' => 0.8],
            'pressures' => ['collapse_pressure' => 0.9, 'ascension_pressure' => 0.3],
        ];

        $this->assertSame(0.7, $this->mapper->getMetricValue($vec, 'entropy'));
        $this->assertSame(0.6, $this->mapper->getMetricValue($vec, 'stability_index'));
        $this->assertSame(0.9, $this->mapper->getMetricValue($vec, 'collapse_pressure'));
        $this->assertNull($this->mapper->getMetricValue($vec, 'nonexistent'));
    }

    public function test_detect_triggered_events_returns_matching_event_types(): void
    {
        $this->seed(\Database\Seeders\EventTriggerSeeder::class);

        $highEntropyLowStability = [
            'entropy' => 0.75,
            'stability_index' => 0.4,
            'metrics' => ['entropy' => 0.75, 'stability_index' => 0.4],
        ];
        $triggered = $this->mapper->detectTriggeredEvents($highEntropyLowStability);
        $this->assertContains('crisis', $triggered);

        $lowEntropyHighStability = [
            'entropy' => 0.3,
            'stability_index' => 0.7,
            'metrics' => ['entropy' => 0.3, 'stability_index' => 0.7],
        ];
        $triggered2 = $this->mapper->detectTriggeredEvents($lowEntropyHighStability);
        $this->assertContains('golden_age', $triggered2);
    }
}
