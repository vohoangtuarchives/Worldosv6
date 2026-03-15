<?php

$dir = __DIR__ . '/backend';

// Define replacements
$replacements = [
    'SagaService' => 'ImplicitOrchestratorService',
    'app\Services\Saga' => 'app\Services\Orchestrator',
    'App\Services\Saga' => 'App\Services\Orchestrator',
    '$sagaService' => '$orchestrator',
    '$this->sagaService' => '$this->orchestrator',
    'sagaService' => 'orchestratorService',
    'SagaAdvanceCommand' => 'AdvanceSimulationCommand',
    'saga:advance' => 'simulation:advance'
];

$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));
foreach ($iterator as $file) {
    if ($file->isFile() && $file->getExtension() === 'php') {
        $path = $file->getPathname();
        $content = file_get_contents($path);
        $newContent = $content;

        foreach ($replacements as $search => $replace) {
            $newContent = str_replace($search, $replace, $newContent);
        }

        if ($content !== $newContent) {
            file_put_contents($path, $newContent);
            echo "Renamed SagaService to ImplicitOrchestratorService in: $path\n";
        }
    }
}

// Rename the directory
@rename(__DIR__ . '/backend/app/Services/Saga', __DIR__ . '/backend/app/Services/Orchestrator');
@rename(__DIR__ . '/backend/app/Services/Orchestrator/SagaService.php', __DIR__ . '/backend/app/Services/Orchestrator/ImplicitOrchestratorService.php');
@rename(__DIR__ . '/backend/app/Console/Commands/SagaAdvanceCommand.php', __DIR__ . '/backend/app/Console/Commands/AdvanceSimulationCommand.php');
@rename(__DIR__ . '/backend/tests/Feature/SagaServiceTest.php', __DIR__ . '/backend/tests/Feature/ImplicitOrchestratorServiceTest.php');

echo "Done formatting references.\n";

