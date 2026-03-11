<?php

namespace App\Services\Narrative;

use App\Jobs\ProcessNarrativeJob;
use App\Models\NarrativeJob;

/**
 * Schedules narrative work: creates narrative_jobs row and dispatches ProcessNarrativeJob to narrative queue.
 * All LLM calls go through the queue; simulation is not blocked.
 */
class NarrativeScheduler
{
    public function __construct(
        protected ?NarrativeCache $cache = null
    ) {
        if ($this->cache === null && app()->bound(NarrativeCache::class)) {
            $this->cache = app(NarrativeCache::class);
        }
    }

    /**
     * Schedule event narrative for one or more chronicles (engine=event).
     *
     * @param  array<int>  $chronicleIds
     */
    public function scheduleEvent(int $universeId, array $chronicleIds, int $tickWindowSize = 1): ?NarrativeJob
    {
        if (empty($chronicleIds)) {
            return null;
        }

        $job = NarrativeJob::create([
            'universe_id' => $universeId,
            'engine' => 'event',
            'payload' => [
                'chronicle_ids' => $chronicleIds,
                'tick_window_size' => $tickWindowSize,
            ],
            'status' => NarrativeJob::STATUS_PENDING,
        ]);

        ProcessNarrativeJob::dispatch($job->id);

        return $job;
    }

    /**
     * Schedule event narrative for a single chronicle (convenience).
     */
    public function scheduleEventForChronicle(int $universeId, int $chronicleId): ?NarrativeJob
    {
        return $this->scheduleEvent($universeId, [$chronicleId], 1);
    }

    /**
     * Schedule era narrative (engine=era). Payload: era_id or universe_id + start_tick + end_tick.
     */
    public function scheduleEra(int $universeId, int $startTick, int $endTick, ?int $eraId = null): ?NarrativeJob
    {
        $job = NarrativeJob::create([
            'universe_id' => $universeId,
            'engine' => 'era',
            'payload' => [
                'start_tick' => $startTick,
                'end_tick' => $endTick,
                'era_id' => $eraId,
            ],
            'status' => NarrativeJob::STATUS_PENDING,
        ]);

        ProcessNarrativeJob::dispatch($job->id);

        return $job;
    }

    /**
     * Schedule civilization narrative (engine=civilization). Payload: civilization_id.
     */
    public function scheduleCivilization(int $universeId, int $civilizationId): ?NarrativeJob
    {
        $job = NarrativeJob::create([
            'universe_id' => $universeId,
            'engine' => 'civilization',
            'payload' => ['civilization_id' => $civilizationId],
            'status' => NarrativeJob::STATUS_PENDING,
        ]);

        ProcessNarrativeJob::dispatch($job->id);

        return $job;
    }

    /**
     * Schedule mythology narrative (engine=mythology). Payload: universe_id, chronicle_ids or start_tick/end_tick, myth_type.
     *
     * @param  array{chronicle_ids?: int[], start_tick?: int, end_tick?: int, myth_type?: string}  $payload
     */
    public function scheduleMythology(int $universeId, array $payload = []): ?NarrativeJob
    {
        $job = NarrativeJob::create([
            'universe_id' => $universeId,
            'engine' => 'mythology',
            'payload' => array_merge($payload, ['universe_id' => $universeId]),
            'status' => NarrativeJob::STATUS_PENDING,
        ]);

        ProcessNarrativeJob::dispatch($job->id);

        return $job;
    }

    /**
     * Schedule religion generation from myth seed (engine=religion). Payload: myth_id.
     */
    public function scheduleReligion(int $universeId, int $mythId): ?NarrativeJob
    {
        $job = NarrativeJob::create([
            'universe_id' => $universeId,
            'engine' => 'religion',
            'payload' => ['myth_id' => $mythId],
            'status' => NarrativeJob::STATUS_PENDING,
        ]);

        ProcessNarrativeJob::dispatch($job->id);

        return $job;
    }

    /**
     * Schedule prophecy generation (engine=prophecy). Payload: universe_id, tick, state_summary (optional).
     */
    public function scheduleProphecy(int $universeId, int $tick, ?string $stateSummary = null): ?NarrativeJob
    {
        $job = NarrativeJob::create([
            'universe_id' => $universeId,
            'engine' => 'prophecy',
            'payload' => ['tick' => $tick, 'state_summary' => $stateSummary],
            'status' => NarrativeJob::STATUS_PENDING,
        ]);

        ProcessNarrativeJob::dispatch($job->id);

        return $job;
    }

    /**
     * Schedule legend generation (engine=legend). Payload: actor_id or legendary_agent_id.
     */
    public function scheduleLegend(int $universeId, ?int $actorId = null, ?int $legendaryAgentId = null): ?NarrativeJob
    {
        if ($actorId === null && $legendaryAgentId === null) {
            return null;
        }
        $job = NarrativeJob::create([
            'universe_id' => $universeId,
            'engine' => 'legend',
            'payload' => array_filter(['actor_id' => $actorId, 'legendary_agent_id' => $legendaryAgentId]),
            'status' => NarrativeJob::STATUS_PENDING,
        ]);

        ProcessNarrativeJob::dispatch($job->id);

        return $job;
    }
}
