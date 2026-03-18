<?php

namespace App\Services\Narrative;

use App\Jobs\ProcessNarrativeJob;
use App\Models\NarrativeJob;
use App\Modules\Narrative\Services\NarrativeScheduler as AdaptiveNarrativeScheduler;
use App\Modules\Simulation\Entities\UniverseEntity;
use App\Models\UniverseSnapshot;

/**
 * NarrativeScheduler: tạo hàng đợi narrative_jobs và dispatch ProcessNarrativeJob.
 *
 * Lưu ý: có 2 khái niệm "scheduler":
 * - AdaptiveNarrativeScheduler (Modules\Narrative): quyết định có nên pulse narrative V2 hay không.
 * - Class này: scheduler cho queue/LLM (event/era/civilization/legend/...) để xử lý bất đồng bộ.
 */
class NarrativeScheduler
{
    public function __construct(
        protected AdaptiveNarrativeScheduler $adaptiveScheduler,
    ) {}

    /**
     * Delegate: narrative V2 adaptive pulse decision.
     */
    public function shouldPulse(UniverseEntity $universe, UniverseSnapshot $snapshot): bool
    {
        return $this->adaptiveScheduler->shouldPulse($universe, $snapshot);
    }

    /**
     * Schedule narrative generation for one or many chronicles (engine=event).
     *
     * @param int $universeId
     * @param array<int,int> $chronicleIds
     * @param int $tickWindowSize
     */
    public function scheduleEvent(int $universeId, array $chronicleIds, int $tickWindowSize = 1): ?NarrativeJob
    {
        $chronicleIds = array_values(array_unique(array_map('intval', $chronicleIds)));
        if (empty($chronicleIds)) {
            return null;
        }

        $payload = [
            'chronicle_ids' => $chronicleIds,
            'tick_window_size' => max(1, (int) $tickWindowSize),
        ];

        return $this->dispatchJob($universeId, 'event', $payload);
    }

    public function scheduleEventForChronicle(int $universeId, int $chronicleId): ?NarrativeJob
    {
        return $this->scheduleEvent($universeId, [$chronicleId], 1);
    }

    public function scheduleEra(int $universeId, int $startTick, int $endTick, ?int $eraId = null): ?NarrativeJob
    {
        $payload = $eraId !== null
            ? ['era_id' => (int) $eraId]
            : ['start_tick' => (int) $startTick, 'end_tick' => (int) $endTick];

        return $this->dispatchJob($universeId, 'era', $payload);
    }

    public function scheduleCivilization(int $universeId, int $civilizationId): ?NarrativeJob
    {
        return $this->dispatchJob($universeId, 'civilization', ['civilization_id' => (int) $civilizationId]);
    }

    public function scheduleCausalTrajectory(int $universeId, int $tick, ?string $stateSummary = null): ?NarrativeJob
    {
        $payload = ['tick' => (int) $tick];
        if ($stateSummary !== null && $stateSummary !== '') {
            $payload['state_summary'] = $stateSummary;
        }
        return $this->dispatchJob($universeId, 'causal_trajectory', $payload);
    }

    public function scheduleLegend(int $universeId, ?int $actorId = null, ?int $legendaryAgentId = null): ?NarrativeJob
    {
        $payload = [];
        if ($legendaryAgentId !== null) {
            $payload['legendary_agent_id'] = (int) $legendaryAgentId;
        }
        if ($actorId !== null) {
            $payload['actor_id'] = (int) $actorId;
        }
        if ($payload === []) {
            return null;
        }
        return $this->dispatchJob($universeId, 'legend', $payload);
    }

    protected function dispatchJob(int $universeId, string $engine, array $payload): NarrativeJob
    {
        $job = NarrativeJob::create([
            'universe_id' => $universeId,
            'engine' => $engine,
            'payload' => $payload,
            'status' => NarrativeJob::STATUS_PENDING,
        ]);

        ProcessNarrativeJob::dispatch($job->id);

        return $job;
    }
}
