<?php

namespace App\Simulation\Runtime\Stages;

use App\Models\Universe;
use App\Models\UniverseSnapshot;
use App\Simulation\Runtime\Contracts\SimulationStageInterface;
use App\Modules\Intelligence\Actions\ProcessActorEnergyAction;
use App\Modules\Intelligence\Actions\ProcessActorSurvivalAction;
use App\Modules\Intelligence\Services\ActorBehaviorEngine;
use App\Modules\Intelligence\Services\LanguageEngine;

/**
 * Actor simulation stage: energy, survival, behavior, language.
 * Culture runs in CultureStage.
 */
final class ActorStage implements SimulationStageInterface
{
    public function __construct(
        protected ProcessActorEnergyAction $processActorEnergy,
        protected ProcessActorSurvivalAction $processActorSurvival,
        protected ActorBehaviorEngine $actorBehaviorEngine,
        protected LanguageEngine $languageEngine
    ) {}

    public function run(Universe $universe, int $tick, ?UniverseSnapshot $savedSnapshot = null, array $context = []): void
    {
        $response = array_merge($context, ['_ticks' => $context['_ticks'] ?? 1]);
        $this->processActorEnergy->handle($universe, $response);
        $this->processActorSurvival->handle($universe, $response);
        $universe->refresh();

        $this->actorBehaviorEngine->evaluate($universe, $tick);
        $this->languageEngine->evaluate($universe, $tick);
    }
}
