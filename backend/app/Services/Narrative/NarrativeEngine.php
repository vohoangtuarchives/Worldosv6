<?php

namespace App\Services\Narrative;

use App\Models\Chronicle;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

/**
 * Orchestrates: Raw events → EventAggregator → NarrativePromptBuilder → NarrativeGenerator → ChronicleWriter.
 * Single-chronicle path (backward compat) and batched path (1 LLM call per universe+tick group).
 */
class NarrativeEngine
{
    public function __construct(
        protected EventAggregator $aggregator,
        protected NarrativePromptBuilder $promptBuilder,
        protected NarrativeGenerator $generator,
        protected ChronicleWriter $writer,
        protected ?NarrativeCache $cache = null
    ) {
        if ($this->cache === null && app()->bound(NarrativeCache::class)) {
            $this->cache = app(NarrativeCache::class);
        }
    }

    /**
     * Process a single chronicle (legacy path: 1 chronicle → 1 LLM call).
     */
    public function generateForChronicle(Chronicle $chronicle): void
    {
        if (!$chronicle->raw_payload || $chronicle->content) {
            return;
        }
        $payload = is_array($chronicle->raw_payload) ? $chronicle->raw_payload : json_decode($chronicle->raw_payload, true);
        $action = $payload['action'] ?? 'unknown';

        $prompt = $this->promptBuilder->build($action, $payload, $chronicle);
        if ($prompt === '') {
            return;
        }

        if ($this->cache !== null) {
            $key = $this->cache->keyForPayload($action, $payload);
            $cached = $this->cache->get($key);
            if ($cached !== null) {
                $this->writer->write($chronicle, $cached);
                Log::info("NarrativeEngine: cache hit for Chronicle #{$chronicle->id} [{$action}]");
                return;
            }
        }

        $content = $this->generator->generate($prompt);
        if ($content) {
            $this->cache?->put($this->cache->keyForPayload($action, $payload), $content);
            $this->writer->write($chronicle, $content);
            Log::info("NarrativeEngine: generated for Chronicle #{$chronicle->id} [{$action}]");
        }
    }

    /**
     * Process many chronicles in batched mode: aggregate by universe+tick, one LLM call per group, write same content to all chronicles in group.
     *
     * @param  Collection<int, Chronicle>  $chronicles
     * @param  int  $tickWindowSize  Group ticks in windows of this size (1 = exact tick).
     * @return array{processed: int, llm_calls: int}
     */
    public function generateBatched(Collection $chronicles, int $tickWindowSize = 1): array
    {
        $groups = $this->aggregator->aggregateByUniverseAndTick($chronicles, $tickWindowSize);
        $processed = 0;
        $llmCalls = 0;

        foreach ($groups as $group) {
            $chroniclesInGroup = $group['chronicles'];
            $batches = $group['batches'];

            if (count($batches) === 0) {
                continue;
            }

            $firstChronicle = $chroniclesInGroup[0];
            $prompt = count($batches) === 1 && ($batches[0]['payload']['_count'] ?? 1) === 1
                ? $this->promptBuilder->build($batches[0]['action'], $batches[0]['payload'], $firstChronicle)
                : $this->promptBuilder->buildAggregated(
                    array_map(fn ($b) => ['action' => $b['action'], 'payload' => $b['payload']], $batches),
                    $firstChronicle
                );

            $cacheKey = null;
            if ($this->cache !== null) {
                $cacheKey = 'agg:' . $group['universe_id'] . ':' . $group['tick'] . ':' . hash('sha256', $prompt);
                $cached = $this->cache->get($cacheKey);
                if ($cached !== null) {
                    $this->writer->writeToMany($chroniclesInGroup, $cached);
                    $processed += count($chroniclesInGroup);
                    continue;
                }
            }

            $content = $this->generator->generate($prompt);
            $llmCalls++;
            if ($content) {
                $this->cache?->put($cacheKey ?? ('agg:' . $group['universe_id'] . ':' . $group['tick'] . ':' . hash('sha256', $content)), $content);
                $this->writer->writeToMany($chroniclesInGroup, $content);
                $processed += count($chroniclesInGroup);
            }
        }

        return ['processed' => $processed, 'llm_calls' => $llmCalls];
    }
}
