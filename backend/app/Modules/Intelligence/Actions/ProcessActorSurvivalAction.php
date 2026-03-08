<?php

namespace App\Modules\Intelligence\Actions;

use App\Modules\Intelligence\Contracts\ActorRepositoryInterface;
use App\Models\Universe;
use Illuminate\Support\Facades\Log;

class ProcessActorSurvivalAction
{
    public function __construct(
        private ActorRepositoryInterface $actorRepository,
        private \App\Modules\Intelligence\Services\ActorTransitionSystem $transitionSystem
    ) {}

    public function handle(Universe $universe, array $simulationResponse): void
    {
        $actors = $this->actorRepository->findByUniverse($universe->id);
        $snapshot = $simulationResponse['snapshot'] ?? null;
        $entropy = $snapshot !== null && isset($snapshot['entropy'])
            ? (float) $snapshot['entropy']
            : 0.5;
        $ticks = max(1, (int) ($simulationResponse['_ticks'] ?? 1));
        $snapshotTick = $snapshot !== null && isset($snapshot['tick'])
            ? (int) $snapshot['tick']
            : (int) ($universe->current_tick ?? 0);

        if (count($actors) === 0) {
            Log::info("Intelligence: ProcessActorSurvivalAction skipped for Universe {$universe->id} (tick {$snapshotTick}): no actors in universe.");
            return;
        }

        $deathCount = 0;
        $actorIndex = 0;
        $aliveIds = [];
        foreach ($actors as $actor) {
            if ($actor->isAlive) {
                $aliveIds[] = $actor->id;
            }
        }
        sort($aliveIds);
        $guaranteedPerTick = min(10, max(0, (int) config('worldos.intelligence.guaranteed_deaths_per_tick', 5)));
        $idsToKillThisTick = [];
        if ($guaranteedPerTick > 0 && count($aliveIds) > $guaranteedPerTick) {
            $offset = ($snapshotTick * $guaranteedPerTick) % count($aliveIds);
            for ($i = 0; $i < $guaranteedPerTick; $i++) {
                $idsToKillThisTick[] = $aliveIds[($offset + $i) % count($aliveIds)];
            }
        }

        foreach ($actors as $actor) {
            if (!$actor->isAlive) {
                $actorIndex++;
                continue;
            }

            $oldState = $actor->isAlive;

            for ($t = 0; $t < $ticks && $actor->isAlive; $t++) {
                $tickForRng = $snapshotTick - $ticks + $t;
                $rngSalt = ($actor->id ?? 0) + ($actorIndex * 100000);
                $rng = new \App\Modules\Intelligence\Domain\Rng\SimulationRng(
                    (int) ($universe->seed ?? 0),
                    $tickForRng,
                    $rngSalt
                );
                $state = $actor->toState();
                $state = $this->transitionSystem->processSurvival($state, $entropy, $rng);
                $actor->fromState($state);
            }

            if ($actor->isAlive && in_array($actor->id, $idsToKillThisTick, true)) {
                $actor->fromState($actor->toState()->with(['isAlive' => false]));
            }

            if ($oldState && !$actor->isAlive) {
                $deathCount++;
                Log::info("Intelligence: Actor {$actor->name} ({$actor->id}) has perished in Universe {$universe->id} at tick {$universe->current_tick}.");
            }

            $this->actorRepository->save($actor);
            $actorIndex++;
        }

        Log::info("Intelligence: ProcessActorSurvivalAction Universe {$universe->id} tick {$snapshotTick}: actors=" . count($actors) . " entropy={$entropy} ticks={$ticks} deaths={$deathCount}.");

        if ($deathCount > 0) {
            Log::info("Intelligence: Processed survival for Universe {$universe->id}. Deaths: $deathCount.");
        }
    }
}
