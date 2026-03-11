<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Chronicle;
use App\Services\Narrative\EventNarrativeService;
use App\Services\Narrative\NarrativeEngine;
use Illuminate\Support\Facades\Log;

class WeaveNarrativesCommand extends Command
{
    protected $signature = 'worldos:weave-narratives 
                            {--limit=50 : Maximum number of chronicles to process at once}
                            {--batched : Aggregate by universe+tick and use 1 LLM call per group (scales better)}';

    protected $description = 'Process raw event payloads and weave them into narrative chronicles using AI.';

    public function handle(EventNarrativeService $narrativeService, NarrativeEngine $engine)
    {
        $limit = (int) $this->option('limit');
        $batched = $this->option('batched');

        $chronicles = Chronicle::whereNull('content')
            ->whereNotNull('raw_payload')
            ->orderBy('id', 'asc')
            ->limit($batched ? min($limit, 500) : $limit)
            ->get();

        if ($chronicles->isEmpty()) {
            $this->info("No raw chronicles found to weave.");
            return 0;
        }

        if ($batched) {
            $this->info("Batched mode: aggregating by universe+tick, then 1 LLM call per group.");
            $result = $engine->generateBatched($chronicles, 1);
            $this->info("Processed: {$result['processed']} chronicles with {$result['llm_calls']} LLM call(s).");
            return 0;
        }

        $this->info("Found {$chronicles->count()} raw chronicles. Starting AI generation (1 call per chronicle)...");
        $successCount = 0;
        foreach ($chronicles as $chronicle) {
            try {
                $narrativeService->generateNarrativeForChronicle($chronicle);
                $successCount++;
                $this->line("Processed Chronicle #{$chronicle->id}: " . substr($chronicle->content ?? '', 0, 50) . "...");
            } catch (\Exception $e) {
                Log::error("Failed to weave narrative for Chronicle #{$chronicle->id}: " . $e->getMessage());
                $this->error("Error on Chronicle #{$chronicle->id}: " . $e->getMessage());
            }
        }
        $this->info("Finished weaving. Success: {$successCount}/{$chronicles->count()}");
        return 0;
    }
}
