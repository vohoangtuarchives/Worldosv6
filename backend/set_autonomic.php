<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

foreach(\App\Models\Universe::all() as $u) {
    $u->status = 'active';
    $u->save();
    $w = $u->world;
    $w->is_autonomic = true;
    $w->save();
    echo "Universe {$u->id} (Status: {$u->status}) in World {$w->id} (Autonomic: yes)\n";
}
