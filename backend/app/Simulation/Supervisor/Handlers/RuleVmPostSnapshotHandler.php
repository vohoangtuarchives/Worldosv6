<?php

namespace App\Simulation\Supervisor\Handlers;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Supervisor\Contracts\PostSnapshotHandlerInterface;
use App\Services\Simulation\RuleVmService;
use Illuminate\Support\Facades\Config;

final class RuleVmPostSnapshotHandler implements PostSnapshotHandlerInterface
{
    public function __construct(
        private readonly RuleVmService $ruleVmService,
    ) {}

    public function handle(Universe $universe, UniverseSnapshot $snapshot): void
    {
        if (Config::get('worldos.rule_engine.enabled', false)) {
            $this->ruleVmService->evaluateAndApply($universe, $snapshot);
        }
    }
}
