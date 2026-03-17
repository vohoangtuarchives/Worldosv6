<?php

$files = [
    __DIR__ . '/app/Simulation/Engines/Social/GlobalEconomyEngine.php',
    __DIR__ . '/app/Simulation/Engines/Social/MarketEngine.php',
    __DIR__ . '/app/Simulation/Engines/Social/InequalityEngine.php',
    __DIR__ . '/app/Simulation/Engines/Social/PoliticsEngine.php',
    __DIR__ . '/app/Simulation/Engines/Social/WarEngine.php',
    __DIR__ . '/app/Simulation/Engines/Physics/GeologicalEngine.php'
];

foreach ($files as $file) {
    if (!file_exists($file)) continue;
    
    $content = file_get_contents($file);
    
    if (strpos($content, 'implements \App\Simulation\Contracts\SimulationEngine') !== false ||
        strpos($content, 'implements SimulationEngine') !== false) {
        continue;
    }
    
    $className = basename($file, '.php');
    $name = strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', str_replace('Engine', '', $className)));
    
    // Replace class definition
    $content = preg_replace(
        '/class ' . $className . '\s*\{/', 
        "class {$className} implements \App\Simulation\Contracts\SimulationEngine\n{", 
        $content
    );
    
    // Inject methods
    $methods = <<<PHP
    use \App\Simulation\Concerns\DefaultSimulationEnginePhase;

    public function name(): string { return '{$name}'; }
    public function priority(): int { return 10; }
    public function tickRate(): int { return (int) config('worldos.tick_pipeline.meta.interval', 10); }

    public function handle(\App\Simulation\Runtime\State\WorldState \$state, \App\Simulation\Domain\TickContext \$ctx): \App\Simulation\Domain\EngineResult
    {
        if (method_exists(\$this, 'runWithState')) {
            \$this->runWithState(\$state, \$ctx->getTick());
        } elseif (method_exists(\$this, 'evaluate')) {
            // Unlikely, but fallback
            \$universe = \App\Models\Universe::find(\$ctx->getUniverseId());
            if (\$universe) \$this->evaluate(\$universe, \$ctx->getTick());
        }
        return \App\Simulation\Domain\EngineResult::empty();
    }
PHP;
    
    // Insert after the first opening brace of the class
    $content = preg_replace(
        '/(class ' . $className . ' implements \\\App\\\Simulation\\\Contracts\\\SimulationEngine\s*\{)/', 
        "$1\n$methods\n", 
        $content
    );
    
    file_put_contents($file, $content);
    echo "Patched $className\n";
}
