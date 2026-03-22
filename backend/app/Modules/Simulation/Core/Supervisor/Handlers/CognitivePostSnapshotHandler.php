<?php

namespace App\Modules\Simulation\Core\Supervisor\Handlers;

use App\Modules\Simulation\Models\Universe;
use App\Modules\Simulation\Models\UniverseSnapshot;
use App\Modules\Simulation\Core\Supervisor\Contracts\PostSnapshotHandlerInterface;
use App\Modules\Simulation\Services\ActorCognitiveService;

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


