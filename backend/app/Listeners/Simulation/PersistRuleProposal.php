<?php

namespace App\Listeners\Simulation;

use App\Events\Simulation\RuleProposed;
use App\Models\RuleProposal;

/**
 * Persist rule proposal to rule_proposals table when sandbox test succeeds (Phase 3 rule versioning).
 */
class PersistRuleProposal
{
    public function handle(RuleProposed $event): void
    {
        RuleProposal::create([
            'universe_id' => $event->universeId,
            'tick' => $event->tick,
            'dsl' => $event->dsl,
            'sandbox_result' => $event->sandboxResult,
        ]);
    }
}
