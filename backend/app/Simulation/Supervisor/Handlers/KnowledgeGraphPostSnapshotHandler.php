<?php

namespace App\Simulation\Supervisor\Handlers;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Supervisor\Contracts\PostSnapshotHandlerInterface;
use App\Services\Simulation\KnowledgeGraphService;

final class KnowledgeGraphPostSnapshotHandler implements PostSnapshotHandlerInterface
{
    public function __construct(
        private readonly KnowledgeGraphService $knowledgeGraphService,
    ) {}

    public function handle(Universe $universe, UniverseSnapshot $snapshot): void
    {
        $this->knowledgeGraphService->evaluate($universe, (int) $snapshot->tick);
    }
}
