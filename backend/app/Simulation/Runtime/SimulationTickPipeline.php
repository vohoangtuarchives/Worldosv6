<?php

namespace App\Simulation\Runtime;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Services\Simulation\SimulationTracer;
use App\Simulation\Runtime\Contracts\SimulationStageInterface;
use App\Simulation\Runtime\Contracts\TickSchedulerInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;

final class SimulationTickPipeline
{
    /**
     * @param  array<string, SimulationStageInterface>  $stages  Stage key => stage instance
     */
    public function __construct(
        protected TickSchedulerInterface $scheduler,
        protected array $stages
    ) {}

    /**
     * @param  array<string, mixed>  $context  Optional context (e.g. engine response) passed to each stage
     */
    public function run(Universe $universe, int $tick, ?UniverseSnapshot $savedSnapshot = null, array $context = []): void
    {
        foreach ($this->scheduler->stageOrder() as $key) {
            $stage = $this->stages[$key] ?? null;
            if (!$stage instanceof SimulationStageInterface) {
                continue;
            }
            if (!$this->scheduler->shouldRun($key, $tick)) {
                continue;
            }
            try {
                $tracing = Config::get('worldos.observability.tracing_enabled', false);
                if ($tracing) {
                    $start = microtime(true);
                    SimulationTracer::span("stage.{$key}", function () use ($stage, $universe, $tick, $savedSnapshot, $context) {
                        $stage->run($universe, $tick, $savedSnapshot, $context);
                    });
                    $durationMs = (microtime(true) - $start) * 1000;
                    Cache::put("worldos.engine_execution_ms.{$universe->id}.{$key}", round($durationMs, 2), now()->addHours(1));
                } else {
                    $stage->run($universe, $tick, $savedSnapshot, $context);
                }
                $universe->refresh();
            } catch (\Throwable $e) {
                Log::error("SimulationTickPipeline: stage failed", [
                    'stage' => $key,
                    'universe_id' => $universe->id,
                    'tick' => $tick,
                    'message' => $e->getMessage(),
                ]);
                throw $e;
            }
        }
    }
}
