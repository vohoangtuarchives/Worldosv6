<?php

namespace App\Console\Commands;

use App\Models\Saga;
use App\Services\Saga\SagaService;
use Illuminate\Console\Command;

class SagaAdvanceCommand extends Command
{
    protected $signature = 'saga:advance-v3
                            {--ticks=5 : Ticks per universe}
                            {--saga= : Saga ID (optional, runs first active saga if not set)}';

    protected $description = 'Advance saga universe(s) by N ticks (WorldOS V6)';

    public function handle(\App\Services\Saga\SagaService $sagaService): int
    {
        $ticks = (int) $this->option('ticks');
        $sagaId = $this->option('saga');

        $saga = $sagaId
            ? Saga::findOrFail($sagaId)
            : Saga::where('status', 'active')->first();

        if (! $saga) {
            $this->error('No active saga found.');
            return 1;
        }

        $this->info("Running batch for saga {$saga->id} ({$saga->name}), ticks={$ticks}");
        $results = $sagaService->runBatch($saga, $ticks);
        $rows = [];
        foreach ($results as $universeId => $r) {
            $snap = $r['snapshot'] ?? [];
            $rows[] = [
                $universeId,
                ($r['ok'] ?? false) ? 'yes' : 'no',
                $snap['tick'] ?? '-',
            ];
        }
        $this->table(['Universe ID', 'OK', 'Tick'], $rows);
        return 0;
    }
}
