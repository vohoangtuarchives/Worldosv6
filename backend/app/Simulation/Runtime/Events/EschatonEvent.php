<?php

namespace App\Simulation\Runtime\Events;

use App\Simulation\Runtime\Contracts\SimulationEvent;

class EschatonEvent implements SimulationEvent
{
    public function __construct(
        public readonly int $oldEpoch,
        public readonly int $newEpoch,
        public readonly int $tick,
        public readonly string $cause
    ) {}

    public function type(): string
    {
        return 'cosmic.eschaton';
    }

    public function payload(): array
    {
        return [
            'old_epoch' => $this->oldEpoch,
            'new_epoch' => $this->newEpoch,
            'cause' => $this->cause,
            'tick' => $this->tick
        ];
    }
}
