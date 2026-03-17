<?php

$events = [
    'ActorDiedEvent' => 'actor_died',
    'SpeciesExtinctEvent' => 'species_extinct',
    'EcologicalCollapseEvent' => 'ecological_collapse',
    'EcologicalCollapseRecoveryEvent' => 'ecological_collapse_recovery',
    'EcologicalPhaseTransitionEvent' => 'ecological_phase_transition',
    'CivilizationCollapseEvent' => 'civilization_collapse',
    'UniverseRebirthEvent' => 'universe_rebirth',
    'AnomalyLeakEvent' => 'anomaly_leak',
];

$dir = __DIR__ . '/app/Simulation/Events';
if (!is_dir($dir)) {
    mkdir($dir, 0777, true);
}

foreach ($events as $className => $type) {
    $file = $dir . '/' . $className . '.php';
    
    $content = <<<PHP
<?php

namespace App\Simulation\Events;

use App\Simulation\Events\Contracts\SimulationEventInterface;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class $className implements SimulationEventInterface
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int \$universeId,
        public int \$tick,
        public array \$payload = []
    ) {}

    public function getUniverseId(): int
    {
        return \$this->universeId;
    }

    public function getType(): string
    {
        return '$type';
    }

    public function getTick(): int
    {
        return \$this->tick;
    }

    public function getPayload(): array
    {
        return \$this->payload;
    }
}

PHP;

    file_put_contents($file, $content);
    echo "Created $className\n";
}
