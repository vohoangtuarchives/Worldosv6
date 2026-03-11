<?php

namespace App\Simulation\Runtime\Stages;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Runtime\Contracts\SimulationStageInterface;
use App\Services\Simulation\ResonanceAuditorService;
use App\Services\Simulation\MultiverseSovereigntyService;
use App\Actions\Simulation\ArchetypeShiftAction;
use App\Services\AI\FaithService;
use App\Actions\Simulation\EmpowerDemiurgesAction;
use App\Actions\Simulation\DemiurgeAutonomousAction;
use App\Actions\Simulation\DivineMiracleAction;
use App\Services\AI\EtherealOmenService;
use App\Services\Simulation\HeatDeathService;
use App\Actions\Simulation\AutonomousAxiomMutationAction;
use App\Actions\Simulation\AgentSovereigntyAction;
use App\Services\Simulation\CelestialAntibodyEngine;
use App\Services\Simulation\ChaosEngine;
use App\Services\Simulation\TransmigrationEngine;

/**
 * Meta / Cosmic layer: resonance, sovereignty, archetype, alignments, demiurges,
 * miracles, heat death, axiom mutation, agent sovereignty, antibody, chaos, transmigration.
 */
final class MetaCosmicStage implements SimulationStageInterface
{
    public function __construct(
        protected ResonanceAuditorService $resonanceAuditor,
        protected MultiverseSovereigntyService $sovereignty,
        protected ArchetypeShiftAction $archetypeShift,
        protected FaithService $faithService,
        protected EmpowerDemiurgesAction $empowerDemiurges,
        protected DemiurgeAutonomousAction $demiurgeAction,
        protected DivineMiracleAction $miracleAction,
        protected EtherealOmenService $etherOmen,
        protected HeatDeathService $heatDeath,
        protected AutonomousAxiomMutationAction $axiomMutation,
        protected AgentSovereigntyAction $agentSovereignty,
        protected CelestialAntibodyEngine $antibodyEngine,
        protected ChaosEngine $chaosEngine,
        protected TransmigrationEngine $transmigrationEngine
    ) {}

    public function run(Universe $universe, int $tick, ?UniverseSnapshot $savedSnapshot = null, array $context = []): void
    {
        $universe->refresh();

        $this->resonanceAuditor->audit($universe);
        $universe->refresh();

        $scars = $savedSnapshot?->metrics['scars'] ?? $context['snapshot']['metrics']['scars'] ?? [];
        $this->sovereignty->orchestrate($universe, $scars);

        $this->archetypeShift->execute($universe);
        $this->processAlignments($universe);

        if ($savedSnapshot && $savedSnapshot->tick % 5 === 0) {
            $this->empowerDemiurges->execute();
            $this->demiurgeAction->execute();
            $this->triggerRandomMiracles($universe);
        }

        if ($savedSnapshot && $savedSnapshot->tick % 50 === 0) {
            $this->heatDeath->monitor();
            $this->axiomMutation->execute($universe->world);
        }

        $this->agentSovereignty->execute($universe);
        $this->antibodyEngine->execute($universe);
        $this->chaosEngine->destabilize($universe);

        if (random_int(0, 1000) < 5) {
            $this->transmigrationEngine->triggerIsekai($universe);
        }
    }

    private function processAlignments(Universe $universe): void
    {
        $legends = \App\Models\LegendaryAgent::where('universe_id', $universe->id)->get();
        foreach ($legends as $legend) {
            $favored = is_array($legend->fate_tags) && in_array('divine_favor', $legend->fate_tags);
            $growthMod = $favored ? 1.5 : 1.0;
            $traits = [
                'order' => (rand(0, 100) / 100) * $growthMod,
                'entropy' => (rand(0, 100) / 100) * (1.0 / $growthMod),
            ];
            $this->faithService->updateAlignment($legend, $traits);
        }
    }

    private function triggerRandomMiracles(Universe $universe): void
    {
        $rivals = \App\Models\Demiurge::where('is_active', true)->get();
        $omen = $this->etherOmen->generateInternalOmen($universe);
        foreach ($rivals as $demiurge) {
            $chance = ($demiurge->will_power / 2000) + ($omen['sci_impact'] ?? 0);
            if (rand(0, 1000) / 1000 < $chance && $chance > 0) {
                $types = ['absolute_order', 'void_eruption', 'legendary_ascension'];
                $this->miracleAction->execute($demiurge, $universe, $types[array_rand($types)]);
            }
        }
    }
}
