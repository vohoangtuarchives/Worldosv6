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

        $infoTypeByArtifact = $this->infoTypeFromArtifactType();
        $amplification = $this->institutionalAmplification($universe);

        // Ensure every artifact with creator has an idea (Doc §8: info_type rumor|propaganda|science|religion|meme)
        Artifact::where('universe_id', $universe->id)
            ->whereNotNull('creator_actor_id')
            ->whereDoesntHave('idea')
            ->get()
            ->each(function (Artifact $a) use ($infoTypeByArtifact) {
                $infoType = $infoTypeByArtifact[$a->artifact_type ?? ''] ?? Idea::INFO_TYPE_MEME;
                Idea::firstOrCreate(
                    [
                        'artifact_id' => $a->id,
                    ],
                    [
                        'universe_id' => $a->universe_id,
                        'origin_actor_id' => $a->creator_actor_id,
                        'theme' => $a->theme ?? $a->artifact_type,
                        'info_type' => $infoType,
                        'influence_score' => $a->impact_score,
                        'followers' => 0,
                        'birth_tick' => $a->tick_created,
                    ]
                );
            });

        // Grow influence/followers for existing ideas; institutional amplification (Doc §8)
        Idea::where('universe_id', $universe->id)->get()->each(function (Idea $idea) use ($growth, $amplification) {
            $mult = $amplification[$idea->info_type ?? Idea::INFO_TYPE_MEME] ?? 1.0;
            $idea->influence_score = min(1.0, $idea->influence_score + $growth * 0.5 * $mult);
            $idea->followers = $idea->followers + $growth * 5 * $mult;
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

    /** Map artifact_type → info_type (Doc §8). */
    private function infoTypeFromArtifactType(): array
    {
        return config('worldos.idea_diffusion.info_type_map', [
            'prophecy' => Idea::INFO_TYPE_RELIGION,
            'invention' => Idea::INFO_TYPE_SCIENCE,
            'doctrine' => Idea::INFO_TYPE_PROPAGANDA,
            'myth' => Idea::INFO_TYPE_RUMOR,
            'meme' => Idea::INFO_TYPE_MEME,
        ]);
    }

    /** Institutional amplification: church → religion, state → propaganda, academy → science (Doc §8). */
    private function institutionalAmplification(Universe $universe): array
    {
        $base = config('worldos.idea_diffusion.institutional_amplification', [
            Idea::INFO_TYPE_RELIGION => 1.2,
            Idea::INFO_TYPE_PROPAGANDA => 1.15,
            Idea::INFO_TYPE_SCIENCE => 1.25,
            Idea::INFO_TYPE_RUMOR => 1.0,
            Idea::INFO_TYPE_MEME => 1.05,
        ]);
        $counts = InstitutionalEntity::where('universe_id', $universe->id)
            ->whereNull('collapsed_at_tick')
            ->get()
            ->groupBy('entity_type');
        if (($counts['church'] ?? collect())->isNotEmpty()) {
            $base[Idea::INFO_TYPE_RELIGION] = ($base[Idea::INFO_TYPE_RELIGION] ?? 1.0) * 1.1;
        }
        if (($counts['state'] ?? collect())->isNotEmpty()) {
            $base[Idea::INFO_TYPE_PROPAGANDA] = ($base[Idea::INFO_TYPE_PROPAGANDA] ?? 1.0) * 1.1;
        }
        if (($counts['philosophy_school'] ?? collect())->isNotEmpty()) {
            $base[Idea::INFO_TYPE_SCIENCE] = ($base[Idea::INFO_TYPE_SCIENCE] ?? 1.0) * 1.1;
        }
        return $base;
    }
}
