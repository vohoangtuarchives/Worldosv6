<?php

$dirs = [
    __DIR__ . '/backend/app',
    __DIR__ . '/backend/database',
    __DIR__ . '/backend/tests',
    __DIR__ . '/engine/worldos-core/src',
    __DIR__ . '/frontend/src',
];

$replacements = [
    'Prophecy' => 'CausalTrajectory',
    'prophecy' => 'causal_trajectory',
    'Prophecies' => 'CausalTrajectories',
    'prophecies' => 'causal_trajectories',
    'PROPHECY' => 'CAUSAL_TRAJECTORY',
    'PROPHECIES' => 'CAUSAL_TRAJECTORIES',
    'Architect\'s Gaze' => 'Observation Interference',
    'ArchitectGaze' => 'ObservationInterference',
    'architect_gaze' => 'observation_interference',
    'architects_gaze' => 'observation_interference',
    'architectsGaze' => 'observationInterference',
    'Birth Event' => 'Wavefunction Collapse',
    'BirthEvent' => 'WavefunctionCollapse',
    'birth_event' => 'wavefunction_collapse',
    'birthEvent' => 'wavefunctionCollapse',
];

function processDir($dir, $replacements) {
    if (!is_dir($dir)) return;
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));
    foreach ($iterator as $file) {
        if ($file->isFile()) {
            $ext = $file->getExtension();
            if (in_array($ext, ['php', 'rs', 'ts', 'tsx', 'js', 'jsx', 'json', 'md'])) {
                $content = file_get_contents($file->getPathname());
                $newContent = $content;
                foreach ($replacements as $search => $replace) {
                    $newContent = str_replace($search, $replace, $newContent);
                }
                if ($content !== $newContent) {
                    file_put_contents($file->getPathname(), $newContent);
                    echo "Updated: " . $file->getPathname() . "\n";
                }
            }
        }
    }
}

foreach ($dirs as $dir) {
    processDir($dir, $replacements);
}

echo "Done.\n";
