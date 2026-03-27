<?php

namespace App\Modules\Narrative\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Chronicle;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

class WeaveNarrativesCommand extends Command
{
    protected $signature = 'worldos:weave-narratives 
                            {universe_id? : Specify the universe ID to weave}
                            {--limit=50 : Maximum number of chronicles to process at once}
                            {--batched : Aggregate by universe+tick and use 1 LLM call per group (scales better)}';

    protected $description = 'Trigger the Python Narrative Loom to weave raw events into literary prose.';

    public function handle()
    {
        $limit = (int) $this->option('limit');
        $universeIdInput = $this->argument('universe_id');

        $query = Chronicle::whereNull('content')->whereNotNull('raw_payload');
        if ($universeIdInput) {
            $query->where('universe_id', $universeIdInput);
        }

        $chronicles = $query->orderBy('tick', 'asc')->limit($limit)->get();

        if ($chronicles->isEmpty()) {
            $this->info("No raw chronicles found to weave.");
            return 0;
        }

        // Group by Universe ID to trigger Narrative Loom per universe
        $grouped = $chronicles->groupBy('universe_id');
        $successCount = 0;

        foreach ($grouped as $universeId => $group) {
            $minTick = $group->min('tick');
            $maxTick = $group->max('tick');
            $ids = $group->pluck('id')->toArray();

            $this->info("Triggering Narrative Loom for Universe {$universeId} (Ticks: {$minTick} - {$maxTick})...");

            try {
                $response = Http::timeout(300)->post('http://narrative_loom:8001/weave-chronicles', [
                    'world_id' => $universeId,
                    'tick_start' => $minTick,
                    'tick_end' => $maxTick
                ]);

                if ($response->successful()) {
                    $result = $response->json();
                    $prose = $result['final_prose'] ?? 'No prose generated.';
                    $this->info("Successfully woven! Prose length: " . strlen($prose));
                    
                    // Update the DB so they are no longer pending
                    DB::transaction(function () use ($ids, $prose, $universeId, $minTick, $result) {
                        // Set the first chronicle of the batch to hold the full prose
                        $firstId = array_shift($ids);
                        Chronicle::where('id', $firstId)->update(['content' => $prose]);
                        
                        // Set the rest to Merged
                        if (count($ids) > 0) {
                            Chronicle::whereIn('id', $ids)->update(['content' => '[Merged into Loom Output]']);
                        }

                        // Create a "Media Station" Narrative record for Bloom UI
                        \App\Models\Narrative::create([
                            'universe_id' => $universeId,
                            'tick_born'   => $minTick,
                            'story'       => $prose,
                            'virality'    => 0.8, // Default high virality for Loom output
                            'distortion'  => 0.2, // Loom output has some creative distortion
                            'is_active'   => true,
                            'news_headline' => $result['news_headline'] ?? 'Breaking News from Universe ' . $universeId,
                            'news_slogan'   => $result['news_slogan'] ?? 'The story blooms...',
                            'vfx_config'    => $result['vfx_config'] ?? [],
                            'tags'          => ['loom_output', 'multiverse_news'],
                        ]);
                    });

                    $successCount += rtrim(count($ids) + 1, '1') + 1; // total processed
                } else {
                    $this->error("Narrative Loom API Error: " . $response->body());
                    Log::error("Narrative Loom API Error: " . $response->body());
                }
            } catch (\Exception $e) {
                Log::error("Failed to call Narrative Loom for Universe {$universeId}: " . $e->getMessage());
                $this->error("HTTP Request Error: " . $e->getMessage());
            }
        }

        $this->info("Finished weaving. Batches processed successfully.");
        return 0;
    }
}

