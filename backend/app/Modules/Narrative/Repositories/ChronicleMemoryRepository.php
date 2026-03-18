<?php

namespace App\Modules\Narrative\Repositories;

use App\Models\Chronicle;
use Illuminate\Support\Facades\Log;

/**
 * ChronicleMemoryRepository: Manages history tracking and context building for the NarrativeEngine.
 */
class ChronicleMemoryRepository
{
    /**
     * Build context based on recent history of the universe.
     */
    public function getContext(int $universeId, array $tokens): string
    {
        $recent = Chronicle::where('universe_id', $universeId)
            ->where('type', 'narrative_tick')
            ->orderByDesc('to_tick')
            ->limit(3)
            ->get()
            ->reverse();

        $historyStr = $recent->isEmpty() 
            ? "Chưa có biên niên sử nào được ghi chép cho vũ trụ này."
            : $recent->map(fn($c) => "[Tick {$c->to_tick}]: " . substr($c->content, 0, 500) . "...")->implode("\n\n---\n\n");

        $tokenStr = !empty($tokens) ? implode(', ', $tokens) : 'Không có token đặc biệt nào được phát hiện.';
        
        return "NARRATIVE TOKENS: {$tokenStr}\n\nLỊCH SỬ GẦN ĐÂY:\n{$historyStr}";
    }

    /**
     * Store a new narrative event.
     */
    public function store(int $universeId, int $tick, string $content, array $omens, array $events): Chronicle
    {
        return Chronicle::create([
            'universe_id' => $universeId,
            'from_tick'   => $tick,
            'to_tick'     => $tick,
            'content'     => $content,
            'type'        => 'narrative_tick',
            'raw_payload' => [
                'omens' => $omens,
                'detected_events' => $events,
                'engine_version' => '8.0'
            ]
        ]);
    }
}
