<?php

namespace App\Simulation\Runtime;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Runtime\Contracts\SimulationStageInterface;
use App\Simulation\Runtime\Contracts\TickSchedulerInterface;
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
                $stage->run($universe, $tick, $savedSnapshot, $context);
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
