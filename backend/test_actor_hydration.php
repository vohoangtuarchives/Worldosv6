<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Actor;

echo "Testing Actor hydration...\n";

try {
    $actor = Actor::where('name', 'Lâm Phàm')->first();
    if (!$actor) {
        die("Actor 1 not found\n");
    }
    echo "Actor found: {$actor->name}\n";
    
    echo "Accessing traits...\n";
    $traits = $actor->traits;
    echo "Traits count: " . count($traits) . "\n";
    
    echo "Accessing metrics...\n";
    $metrics = $actor->metrics;
    echo "Metrics count: " . count($metrics) . "\n";
    
    echo "Success!\n";
} catch (\Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
