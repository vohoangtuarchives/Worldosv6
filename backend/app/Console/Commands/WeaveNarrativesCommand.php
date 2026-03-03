<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Chronicle;
use App\Services\Narrative\EventNarrativeService;
use Illuminate\Support\Facades\Log;

class WeaveNarrativesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'worldos:weave-narratives {--limit=50 : Maximum number of chronicles to process at once}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process raw event payloads and weave them into narrative chronicles using AI.';

    /**
     * Execute the console command.
     */
    public function handle(EventNarrativeService $narrativeService)
    {
        $limit = $this->option('limit');
        
        $chronicles = Chronicle::whereNull('content')
            ->whereNotNull('raw_payload')
            ->orderBy('id', 'asc')
            ->limit($limit)
            ->get();

        if ($chronicles->isEmpty()) {
            $this->info("No raw chronicles found to weave.");
            return;
        }

        $this->info("Found {$chronicles->count()} raw chronicles to weave. Starting AI generation...");

        $successCount = 0;
        foreach ($chronicles as $chronicle) {
            try {
                $narrativeService->generateNarrativeForChronicle($chronicle);
                $successCount++;
                $this->line("Processed Chronicle #{$chronicle->id}: " . substr($chronicle->content, 0, 50) . "...");
            } catch (\Exception $e) {
                Log::error("Failed to weave narrative for Chronicle #{$chronicle->id}: " . $e->getMessage());
                $this->error("Error on Chronicle #{$chronicle->id}: " . $e->getMessage());
            }
        }

        $this->info("Finished weaving. Success: {$successCount}/{$chronicles->count()}");
    }
}
