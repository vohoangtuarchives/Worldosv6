<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Base path: " . base_path("ffi_lib/worldos_ffi.dll") . "\n";
echo "File exists? " . (file_exists(base_path("ffi_lib/worldos_ffi.dll")) ? 'Yes' : 'No') . "\n";

$engine = new \App\Services\Simulation\FfiRuleEngine();
$state = ['entropy' => 0.6, 'meta' => ['stability' => 0.5]];
$dsl = "
rule high_entropy
  when
    entropy > 0.5
  chance 1.0
  then
    adjust_entropy -0.1
    emit_event CHAOS_SPIKED
    set meta.stability 0.3
";

$result = $engine->evaluateDsl($dsl, json_encode($state), time());
echo json_encode($result, JSON_PRETTY_PRINT);
