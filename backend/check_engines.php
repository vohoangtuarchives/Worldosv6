<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$engines = config('worldos.engine_registry.engines', []);
$broken = [];

foreach ($engines as $engineClass) {
    if (!class_exists($engineClass)) {
        echo "Missing class: $engineClass\n";
        continue;
    }
    
    $reflection = new ReflectionClass($engineClass);
    if (!$reflection->implementsInterface(\App\Simulation\Contracts\SimulationEngine::class)) {
        $broken[] = $engineClass;
    }
}

echo "Broken engines:\n";
print_r($broken);
