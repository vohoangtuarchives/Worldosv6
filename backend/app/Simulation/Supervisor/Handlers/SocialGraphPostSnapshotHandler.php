<?php

namespace App\Simulation\Supervisor\Handlers;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Supervisor\Contracts\PostSnapshotHandlerInterface;
use App\Services\Simulation\SocialGraphService;

final class SocialGraphPostSnapshotHandler implements PostSnapshotHandlerInterface
{
    public function __construct(
        private readonly SocialGraphService $socialGraphService,
    ) {}

    public function handle(Universe $universe, UniverseSnapshot $snapshot): void
    {
        $this->socialGraphService->evaluate($universe, (int) $snapshot->tick);
    }
}
