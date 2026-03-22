<?php

namespace App\Modules\Simulation\Core\Supervisor\Handlers;

use App\Modules\Simulation\Models\Universe;
use App\Modules\Simulation\Models\UniverseSnapshot;
use App\Modules\Simulation\Core\Supervisor\Contracts\PostSnapshotHandlerInterface;
use App\Modules\Simulation\Services\RuleEngine\RuleVmService;
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




