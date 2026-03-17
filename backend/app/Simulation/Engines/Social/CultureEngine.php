<?php

namespace App\Simulation\Engines\Social;

use App\Models\CulturalArtifact;
use Illuminate\Support\Facades\DB;
use App\Simulation\Contracts\SimulationEngine;
use App\Simulation\Domain\EngineResult;
use App\Simulation\Domain\TickContext;
use App\Simulation\Runtime\State\WorldState;

/**
 * CultureEngine handles the generation, maintenance, and impact of Cultural Artifacts.
 * Artifacts include ART, LITERATURE, TABOO, RITUAL, and NORM.
 * It injects cultural data into the WorldState for frontend visualization and other engines.
 */
final class CultureEngine implements SimulationEngine
{
    use \App\Simulation\Concerns\DefaultSimulationEnginePhase;

    private const ARTIFACT_TYPES = ['ART', 'LITERATURE', 'TABOO', 'RITUAL', 'NORM'];

    public function phase(): string
    {
        return 'social';
    }

    public function name(): string
    {
        return 'culture_engine';
    }

    public function priority(): int
    {
        return 80;
    }

    public function tickRate(): int
    {
        return 1;
    }

    public function handle(WorldState $state, TickContext $ctx): EngineResult
    {
        $tick = $ctx->getTick();
        $universeId = $ctx->getUniverseId();
        
        $events = [];

        // 1. Fetch active artifacts
        $activeArtifacts = CulturalArtifact::where('universe_id', $universeId)
            ->where('is_active', true)
            ->get();

        $cultureMap = [];
        $civsPresent = [];

        foreach ($activeArtifacts as $artifact) {
            $civId = $artifact->civ_id;
            $civsPresent[$civId] = true;

            if (!isset($cultureMap[$civId])) {
                $cultureMap[$civId] = [
                    'artifacts' => [],
                    'total_power' => 0.0,
                    'type_counts' => [],
                ];
            }

            $cultureMap[$civId]['artifacts'][] = [
                'id' => $artifact->id,
                'name' => $artifact->name,
                'type' => $artifact->type,
                'power' => $artifact->power_level,
                'age' => max(0, $tick - $artifact->created_at_tick),
            ];
            $cultureMap[$civId]['total_power'] += $artifact->power_level;

            $type = $artifact->type;
            if (!isset($cultureMap[$civId]['type_counts'][$type])) {
                $cultureMap[$civId]['type_counts'][$type] = 0;
            }
            $cultureMap[$civId]['type_counts'][$type]++;
        }

        // Processing culture dominant states and chance of new artifact
        foreach ($cultureMap as $civId => &$data) {
            $dominant = '';
            $maxCount = -1;
            foreach ($data['type_counts'] as $type => $count) {
                if ($count > $maxCount) {
                    $maxCount = $count;
                    $dominant = $type;
                }
            }
            $data['dominant_type'] = $dominant;
        }

        // Random chance to generate a new artifact for ANY civ that exists in the world 
        $factions = $state->get('factions', []);
        $allCivs = array_column($factions, 'id');

        if (!empty($allCivs) && config('worldos.intelligence.culture_tick_interval', 1) > 0) {
            if (mt_rand(1, 100) <= 5) {
                $randomCiv = $allCivs[array_rand($allCivs)];
                $type = self::ARTIFACT_TYPES[array_rand(self::ARTIFACT_TYPES)];
                $name = $this->generateArtifactName($type);
                $power = config('worldos.testing', false) ? 5.0 : mt_rand(10, 50) / 10.0; // Fixed power in testing
                
                $artifact = CulturalArtifact::create([
                    'universe_id' => $universeId,
                    'civ_id' => $randomCiv,
                    'name' => $name,
                    'type' => $type,
                    'created_at_tick' => $tick,
                    'power_level' => $power,
                    'is_active' => true,
                ]);

                $events[] = [
                    'type' => 'NEW_CULTURAL_ARTIFACT',
                    'civ_id' => $randomCiv,
                    'artifact_id' => $artifact->id,
                    'name' => $artifact->name,
                    'artifact_type' => $type,
                    'tick' => $tick
                ];
                
                // Add to current map directly
                $cultureMap[$randomCiv]['artifacts'][] = [
                    'id' => $artifact->id,
                    'name' => $artifact->name,
                    'type' => $type,
                    'power' => $power,
                    'age' => 0,
                ];
                $cultureMap[$randomCiv]['total_power'] += $power;
                
                if (!isset($cultureMap[$randomCiv]['type_counts'][$type])) {
                    $cultureMap[$randomCiv]['type_counts'][$type] = 0;
                }
                $cultureMap[$randomCiv]['type_counts'][$type]++;
            }
        }

        $effects = [
            [
                'type' => 'MERGE_STATE',
                'path' => 'civilization.culture',
                'value' => [
                    'civ_cultures' => $cultureMap,
                    'last_updated' => $tick,
                ]
            ]
        ];

        return new EngineResult($events, $effects);
    }

    private function generateArtifactName(string $type): string
    {
        $prefixes = ['Mona', 'The Great', 'Sacred', 'Forbidden', 'Ancient', 'Eternal', 'Cursed'];
        $suffixes = ['Lisa', 'Code', 'Dance', 'Song', 'Ritual', 'Scroll', 'Oath', 'Pact'];

        $prefix = $prefixes[array_rand($prefixes)];
        $suffix = $suffixes[array_rand($suffixes)];

        return "{$prefix} {$suffix} of {$type}";
    }
}
