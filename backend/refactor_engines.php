<?php

$domainMap = [
    'Social' => [
        'PoliticsEngine.php',
        'GlobalEconomyEngine.php',
        'InequalityEngine.php',
        'MarketEngine.php',
        'IdeaDiffusionEngine.php',
        'CivilizationCollapseEngine.php',
        'CivilizationSettlementEngine.php',
        'WarEngine.php',
        'GenreBifurcationEngine.php',
        'CivilizationFieldEngine.php',
        'CivilizationFieldTheoryEngine.php',
        'CivilizationLongCycleEngine.php',
    ],
    'Physics' => [
        'PlanetaryClimateEngine.php',
        'GeologicalEngine.php',
        'MaterialEvolutionEngine.php'
    ],
    'Biological' => [
        'EcologicalPhaseTransitionEngine.php',
        'EcologicalCollapseEngine.php',
        'CelestialAntibodyEngine.php'
    ],
    'Meta' => [
        'ChaosEngine.php',
        'WorldWillEngine.php',
        'AttractorEngine.php',
        'DynamicAttractorEngine.php',
        'ConvergenceEngine.php',
        'OmegaEngine.php',
        'TransmigrationEngine.php',
        'HistoryEngine.php',
        'HistoricalCycleEngine.php',
        'ArtifactCreationEngine.php',
        'AscensionEngine.php',
        'MythicResonanceEngine.php',
        'DecisionEngine.php',
        'ActorDecisionEngine.php',
        'CapabilityEngine.php'
    ]
];

$sourceDir = __DIR__ . '/app/Services/Simulation';
$destDirBase = __DIR__ . '/app/Simulation/Engines';
$appDir = __DIR__ . '/app';

// 1. Collect all files to update
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($appDir));
$allFiles = [];
foreach ($iterator as $file) {
    if ($file->isFile() && $file->getExtension() === 'php') {
        $allFiles[] = $file->getPathname();
    }
}

foreach ($domainMap as $domain => $files) {
    $destDir = $destDirBase . '/' . $domain;
    if (!is_dir($destDir)) {
        mkdir($destDir, 0755, true);
    }
    
    foreach ($files as $file) {
        $sourcePath = $sourceDir . '/' . $file;
        $destPath = $destDir . '/' . $file;
        
        if (!file_exists($sourcePath)) {
            echo "Skipping $file (not found in source)\n";
            continue;
        }

        $className = str_replace('.php', '', $file);
        $oldNamespace = 'App\\Services\\Simulation';
        $newNamespace = 'App\\Simulation\\Engines\\' . $domain;
        
        $oldFqn = $oldNamespace . '\\' . $className;
        $newFqn = $newNamespace . '\\' . $className;

        // Move file
        rename($sourcePath, $destPath);
        echo "Moved $file to $domain\n";

        // Update the file's own namespace declaration
        $content = file_get_contents($destPath);
        $content = str_replace("namespace $oldNamespace;", "namespace $newNamespace;", $content);
        file_put_contents($destPath, $content);

        // Update usages across all app files
        foreach ($allFiles as $appFile) {
            if ($appFile === $destPath) continue; // Skip itself since we just updated it
            
            $appContent = file_get_contents($appFile);
            $modified = false;
            
            // Replace use statements
            if (strpos($appContent, "use $oldFqn;") !== false) {
                $appContent = str_replace("use $oldFqn;", "use $newFqn;", $appContent);
                $modified = true;
            }
            
            // Replace inline FQN like \App\Services\Simulation\...
            if (strpos($appContent, "\\$oldFqn") !== false) {
                $appContent = str_replace("\\$oldFqn", "\\$newFqn", $appContent);
                $modified = true;
            }

            if ($modified) {
                file_put_contents($appFile, $appContent);
            }
        }
    }
}

echo "Refactoring completed.\n";
