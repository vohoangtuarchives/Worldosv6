<?php

namespace App\Services\Simulation;

use App\Models\Artifact;
use App\Models\Chronicle;
use App\Models\Idea;
use App\Models\InstitutionalEntity;
use App\Models\School;
use App\Models\Universe;

/**
 * IdeaDiffusionEngine — Phase 4.
 * From artifacts create/update ideas; grow followers/influence; when threshold met create school.
 */
class IdeaDiffusionEngine
{
    public function process(Universe $universe, int $tick): void
    {
        $config = config('worldos.idea_diffusion', []);
        $growth = (float) ($config['influence_growth_per_tick'] ?? 0.01);
        $followersThreshold = (int) ($config['followers_threshold_for_school'] ?? 10);

        // Ensure every artifact with creator has an idea
        Artifact::where('universe_id', $universe->id)
            ->whereNotNull('creator_actor_id')
            ->whereDoesntHave('idea')
            ->get()
            ->each(function (Artifact $a) {
                Idea::firstOrCreate(
                    [
                        'artifact_id' => $a->id,
                    ],
                    [
                        'universe_id' => $a->universe_id,
                        'origin_actor_id' => $a->creator_actor_id,
                        'theme' => $a->theme ?? $a->artifact_type,
                        'influence_score' => $a->impact_score,
                        'followers' => 0,
                        'birth_tick' => $a->tick_created,
                    ]
                );
            });

        // Grow influence/followers for existing ideas
        Idea::where('universe_id', $universe->id)->get()->each(function (Idea $idea) use ($growth) {
            $idea->influence_score = min(1.0, $idea->influence_score + $growth * 0.5);
            $idea->followers = $idea->followers + $growth * 5; // small bump
            $idea->save();
        });

        // Create school when followers >= threshold and no school yet for this idea
        Idea::where('universe_id', $universe->id)
            ->where('followers', '>=', $followersThreshold)
            ->whereDoesntHave('schools')
            ->get()
            ->each(function (Idea $idea) use ($universe, $tick, $followersThreshold) {
                $school = School::create([
                    'universe_id' => $universe->id,
                    'founder_actor_id' => $idea->origin_actor_id,
                    'idea_id' => $idea->id,
                    'name' => 'School of ' . ($idea->theme ?? 'Thought'),
                    'members' => (int) $idea->followers,
                    'influence' => $idea->influence_score,
                    'status' => 'emerging',
                ]);
                Chronicle::create([
                    'universe_id' => $universe->id,
                    'actor_id' => $idea->origin_actor_id,
                    'from_tick' => $tick,
                    'to_tick' => $tick,
                    'type' => 'school_founded',
                    'importance' => $idea->influence_score * 0.5,
                    'raw_payload' => [
                        'action' => 'legacy_event',
                        'description' => "School founded: {$school->name}.",
                        'school_id' => $school->id,
                        'idea_id' => $idea->id,
                    ],
                ]);

                // Phase 5: Pipeline School → Institution (one institution per idea)
                if (! InstitutionalEntity::where('idea_id', $school->idea_id)->exists()) {
                    InstitutionalEntity::create([
                    'universe_id' => $universe->id,
                    'founder_actor_id' => $school->founder_actor_id,
                    'idea_id' => $school->idea_id,
                    'name' => $school->name,
                    'entity_type' => 'philosophy_school',
                    'institution_type' => 'philosophy_school',
                    'ideology_vector' => [],
                    'org_capacity' => 1.0,
                    'institutional_memory' => 1.0,
                    'legitimacy' => 0.5,
                    'influence_map' => [],
                    'status' => 'emerging',
                    'members' => $school->members,
                    'spawned_at_tick' => $tick,
                ]);
                Chronicle::create([
                    'universe_id' => $universe->id,
                    'actor_id' => $school->founder_actor_id,
                    'from_tick' => $tick,
                    'to_tick' => $tick,
                    'type' => 'institution_founded',
                    'importance' => $idea->influence_score * 0.6,
                    'raw_payload' => [
                        'action' => 'legacy_event',
                        'description' => "Institution founded: {$school->name}.",
                    ],
                ]);
                }
            });
    }
}
