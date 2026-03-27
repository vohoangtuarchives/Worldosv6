<?php

namespace App\Modules\Simulation\Core\Supervisor\Handlers;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Modules\Simulation\Core\Supervisor\Contracts\PostSnapshotHandlerInterface;
use App\Modules\Simulation\Services\Society\ActorCognitiveService;

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


