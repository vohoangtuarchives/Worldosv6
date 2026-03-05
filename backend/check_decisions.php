<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$decisions = \App\Models\AgentDecision::orderByDesc('created_at')->limit(10)->get();
if ($decisions->isEmpty()) {
    echo "No agent decisions found.\n";
} else {
    foreach ($decisions as $d) {
        echo "Time: {$d->created_at}\n";
        echo "Action: {$d->action_type}\n";
        echo "Reason: " . (substr($d->reasoning, 0, 100)) . "...\n";
        echo "---------------------------------\n";
    }
}
