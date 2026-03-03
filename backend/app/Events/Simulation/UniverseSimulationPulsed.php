<?php

namespace App\Events\Simulation;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UniverseSimulationPulsed
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Universe $universe,
        public UniverseSnapshot $snapshot,
        public array $engineResponse = []
    ) {}
}
