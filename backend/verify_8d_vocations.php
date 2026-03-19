<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Modules\Simulation\Services\FfiActorEngine;
use Illuminate\Support\Facades\DB;

$ffi = new FfiActorEngine();

echo "--- 8D Vocation Alignment Verification ---\n";

// 1. Load a Vocation from DB
$vocationId = 'v_swordsman';
$vocation = DB::table('vocation_definitions')->where('id', $vocationId)->first();

if (!$vocation) {
    echo "ERROR: Vocation $vocationId not found. Have you run the seeder?\n";
    exit(1);
}

$vocationObj = (object)$vocation;
$targetProfile = json_decode($vocationObj->motivation_profile ?? '{}', true);

echo "Vocation: " . ($vocationObj->name ?? 'Unknown') . " (ID: {$vocationId})\n";
echo "Target Profile: " . json_encode($targetProfile, JSON_PRETTY_PRINT) . "\n\n";

// 2. Define a Mock Actor Motivation (8D)
// Higher values in destruction/physical should align well with Swordsman
$actorMotivation = [
    'creation' => 0.1,
    'destruction' => 0.7,
    'order' => 0.4,
    'chaos' => 0.5,
    'self_preservation' => 0.8,
    'altruism' => 0.2,
    'physical' => 0.9,
    'metaphysical' => 0.3
];

echo "Actor Motivation: " . json_encode($actorMotivation, JSON_PRETTY_PRINT) . "\n\n";

// 3. Calculate Alignment via Rust FFI
try {
    $alignment = $ffi->calculateVocationAlignment($actorMotivation, $targetProfile);
    echo "FFI Alignment Score: " . $alignment . "\n";
} catch (\Exception $e) {
    echo "FFI ERROR: " . $e->getMessage() . "\n";
    exit(1);
}

// 4. Expected Score Calculation (manual dot product)
$expected = 0.0;
foreach ($actorMotivation as $k => $v) {
    $expected += (float)$v * (float)($targetProfile[$k] ?? 0.0);
}
echo "PHP Expected Score: " . $expected . "\n";

$diff = abs($alignment - $expected);
echo "Difference: " . $diff . "\n";

if ($diff < 0.001) {
    echo "\n✅ SUCCESS: FFI Alignment matches PHP calculation.\n";
} else {
    echo "\n❌ FAILURE: Mismatch detected!\n";
}

echo "--- End of Verification ---\n";
