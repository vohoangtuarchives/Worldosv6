<?php

namespace App\Events\Simulation;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UniverseSimulationPulsed implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Universe $universe,
        public UniverseSnapshot $snapshot,
        public array $engineResponse = []
    ) {}

    public function broadcastOn(): array
    {
        return ['public:universes'];
    }

    public function broadcastAs(): string
    {
        return 'pulsed';
    }
}
