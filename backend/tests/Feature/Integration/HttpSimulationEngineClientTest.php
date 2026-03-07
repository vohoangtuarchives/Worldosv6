<?php

namespace Tests\Feature\Integration;

use App\Services\Simulation\HttpSimulationEngineClient;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class HttpSimulationEngineClientTest extends TestCase
{
    private HttpSimulationEngineClient $client;

    protected function setUp(): void
    {
        parent::setUp();
        $this->client = new HttpSimulationEngineClient('http://engine:50052');
    }

    // ─── Advance ────────────────────────────────────────────────

    public function test_advance_sends_correct_payload_and_parses_snapshot(): void
    {
        Http::fake([
            'engine:50052/advance' => Http::response([
                'ok' => true,
                'snapshot' => [
                    'universe_id' => 42,
                    'tick' => 5,
                    'state_vector' => ['zones' => []],
                    'entropy' => 0.35,
                    'stability_index' => 0.65,
                    'metrics' => ['order' => 0.65],
                    'sci' => 0.8,
                    'instability_gradient' => 0.1,
                ],
                'error_message' => '',
            ], 200),
        ]);

        $result = $this->client->advance(42, 5, ['tick' => 0], ['origin' => 'generic']);

        $this->assertTrue($result['ok']);
        $this->assertNotNull($result['snapshot']);
        $this->assertEquals(42, $result['snapshot']['universe_id']);
        $this->assertEquals(5, $result['snapshot']['tick']);
        $this->assertEquals(0.35, $result['snapshot']['entropy']);
        $this->assertEquals(0.65, $result['snapshot']['stability_index']);
        $this->assertEquals(0.8, $result['snapshot']['sci']);

        Http::assertSent(function ($request) {
            return $request->url() === 'http://engine:50052/advance'
                && $request['universe_id'] === 42
                && $request['ticks'] === 5
                && $request['state_input']['tick'] === 0
                && $request['world_config']['origin'] === 'generic';
        });
    }

    public function test_advance_handles_engine_error_gracefully(): void
    {
        Http::fake([
            'engine:50052/advance' => Http::response([
                'ok' => false,
                'snapshot' => null,
                'error_message' => 'Engine panic: stack overflow',
            ], 200),
        ]);

        $result = $this->client->advance(1, 1);

        $this->assertFalse($result['ok']);
        $this->assertNull($result['snapshot']);
        $this->assertEquals('Engine panic: stack overflow', $result['error_message']);
    }

    public function test_advance_handles_http_timeout(): void
    {
        Http::fake([
            'engine:50052/advance' => function () {
                throw new \Illuminate\Http\Client\ConnectionException('Connection timed out');
            },
        ]);

        $result = $this->client->advance(1, 1);

        $this->assertFalse($result['ok']);
        $this->assertNull($result['snapshot']);
        $this->assertStringContainsString('timed out', $result['error_message']);
    }

    public function test_advance_handles_http_500(): void
    {
        Http::fake([
            'engine:50052/advance' => Http::response('Internal Server Error', 500),
        ]);

        $result = $this->client->advance(1, 1);

        $this->assertFalse($result['ok']);
        $this->assertNull($result['snapshot']);
        $this->assertNotEmpty($result['error_message']);
    }

    // ─── Merge ──────────────────────────────────────────────────

    public function test_merge_sends_correct_payload_and_parses_response(): void
    {
        Http::fake([
            'engine:50052/merge' => Http::response([
                'ok' => true,
                'snapshot' => [
                    'tick' => 10,
                    'state_vector' => '{"merged": true}',
                    'entropy' => 0.5,
                    'stability_index' => 0.5,
                    'metrics' => '{}',
                    'sci' => 0.7,
                    'instability_gradient' => 0.2,
                ],
                'error_message' => '',
            ], 200),
        ]);

        $result = $this->client->merge('{"state":"a"}', '{"state":"b"}');

        $this->assertTrue($result['ok']);
        $this->assertNotNull($result['snapshot']);
        $this->assertEquals(10, $result['snapshot']['tick']);
        $this->assertEquals(0.5, $result['snapshot']['entropy']);
        $this->assertEquals(0.7, $result['snapshot']['sci']);

        Http::assertSent(function ($request) {
            return $request->url() === 'http://engine:50052/merge'
                && $request['state_a'] === '{"state":"a"}'
                && $request['state_b'] === '{"state":"b"}';
        });
    }

    public function test_merge_handles_engine_failure(): void
    {
        Http::fake([
            'engine:50052/merge' => Http::response('Bad Gateway', 502),
        ]);

        $result = $this->client->merge('{}', '{}');

        $this->assertFalse($result['ok']);
        $this->assertNull($result['snapshot']);
    }
}
