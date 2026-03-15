<?php

namespace App\Simulation\Runtime\Core;

use App\Simulation\Runtime\Contracts\SimulationEvent;
use App\Models\Universe;
use App\Simulation\Runtime\Projectors\AscensionProjector;
use App\Simulation\Runtime\Projectors\EschatonProjector;

class SimulationEventDispatcher
{
    public function __construct(
        protected AscensionProjector $ascensionProjector,
        protected EschatonProjector $eschatonProjector
    ) {}

    /**
     * Dispatch an array of events to their respective projectors.
     * 
     * @param SimulationEvent[] $events
     */
    public function dispatch(array $events, Universe $universe): void
    {
        foreach ($events as $event) {
            match ($event->type()) {
                'cosmic.ascension' => $this->ascensionProjector->apply($event, $universe),
                'cosmic.eschaton'  => $this->eschatonProjector->apply($event, $universe),
                default => null // Log unhandled event or skip
            };
        }
    }
}
