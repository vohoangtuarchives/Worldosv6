<?php

namespace App\Modules\Narrative\Services;

class NarrativeAiService
{
    public function generate(): string { return ""; }
    public function generateChronicle(int $universeId, int $fromTick, int $toTick, string $type): ?\App\Models\Chronicle
    {
        return \App\Models\Chronicle::where('universe_id', $universeId)->latest()->first();
    }
}

