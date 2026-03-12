<?php

namespace App\Simulation\Supervisor\Handlers;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Supervisor\Contracts\PostSnapshotHandlerInterface;
use App\Services\Simulation\ActorCognitiveService;

final class CognitivePostSnapshotHandler implements PostSnapshotHandlerInterface
{
    public function __construct(
        private readonly ActorCognitiveService $cognitiveService,
    ) {}

    public function handle(Universe $universe, UniverseSnapshot $snapshot): void
    {
        $this->cognitiveService->computeAndStore($universe, $snapshot);
    }
}
