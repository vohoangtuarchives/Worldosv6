<?php

namespace App\Services\Narrative;

use App\Models\Actor;
use App\Models\Universe;
use App\Models\Religion;
use Illuminate\Support\Facades\DB;

/**
 * Spreads religions by culture/trade/war: increase followers count and assign religion to actors (actor_religion).
 * Run every religion_interval ticks.
 */
class ReligionSpreadEngine
{
    public function runForUniverse(Universe $universe, int $currentTick = 0): void
    {
        $religions = Religion::where('universe_id', $universe->id)->get();
        foreach ($religions as $religion) {
            $rate = (float) $religion->spread_rate;
            $followers = (int) $religion->followers;
            $gain = max(0, (int) round($rate * 10 + $followers * 0.01));
            $religion->update(['followers' => $followers + $gain]);

            $this->assignReligionToActors($universe, $religion, $currentTick);
        }
    }

    /**
     * Assign this religion to up to N random alive actors in universe who do not yet have a religion.
     */
    protected function assignReligionToActors(Universe $universe, Religion $religion, int $currentTick): void
    {
        $maxNewBelievers = max(1, (int) round($religion->spread_rate * 5));
        $actorIdsWithReligion = DB::table('actor_religion')->pluck('actor_id')->all();
        $candidates = Actor::where('universe_id', $universe->id)
            ->where('is_alive', true)
            ->whereNotIn('id', $actorIdsWithReligion)
            ->inRandomOrder()
            ->limit($maxNewBelievers)
            ->get();

        foreach ($candidates as $actor) {
            $actor->religions()->sync([$religion->id => ['believed_at_tick' => $currentTick]]);
        }
    }

    /**
     * Run for all universes that have religions (e.g. from scheduler).
     */
    public function runAll(int $currentTick = 0): void
    {
        $universeIds = Religion::query()->distinct()->pluck('universe_id');
        foreach ($universeIds as $uid) {
            $universe = Universe::find($uid);
            if ($universe) {
                $this->runForUniverse($universe, $currentTick);
            }
        }
    }
}
