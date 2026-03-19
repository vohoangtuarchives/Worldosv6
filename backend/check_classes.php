<?php
require __DIR__ . '/vendor/autoload.php';

$classes = [
    'TimelineSelectionEngine' => \App\Modules\Simulation\Services\TimelineSelectionEngine::class,
    'NarrativeExtractionEngine' => \App\Modules\Simulation\Services\NarrativeExtractionEngine::class,
    'CivilizationMemoryEngine' => \App\Modules\Simulation\Services\CivilizationMemoryEngine::class,
    'MythologyGeneratorEngine' => \App\Modules\Simulation\Services\MythologyGeneratorEngine::class,
    'IdeologyEvolutionEngine' => \App\Modules\Simulation\Services\IdeologyEvolutionEngine::class,
    'GreatPersonEngine' => \App\Modules\Simulation\Services\GreatPersonEngine::class,
    'NarrativeGeneratorService' => \App\Services\Narrative\NarrativeGeneratorService::class,
];

foreach ($classes as $name => $class) {
    echo "$name ($class): " . (class_exists($class) ? "EXISTS" : "MISSING") . "\n";
}
