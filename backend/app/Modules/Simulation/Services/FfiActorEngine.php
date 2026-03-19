<?php

namespace App\Modules\Simulation\Services;

use FFI;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * @method int process_actors_soa(int $count, mixed $ids, mixed $zone_ids, mixed $hunger, mixed $energy, mixed $fear, mixed $trauma, mixed $heroic_types, mixed $lineage_ids, mixed $memes, mixed $seeds, mixed $actions_out)
 * @method int process_fields_v7(int $count, mixed $fields, mixed $neighbor_counts, mixed $neighbor_offsets, mixed $neighbors, float $diffusion_rate, float $preservation_rate)
 * @method string tick_universe_emergent(string $state_json, string $influences_json, int $seed)
 * @method void free_rust_string(mixed $s)
 * @method float vocation_calculate_alignment_ffi(string $actor_json, string $target_json)
 * @method float ruleset_get_gravity_ffi(string $ruleset_json)
 */
class FfiActorEngine
{
    /** @var FFI|null */
    private $ffi = null;

    public function __construct(string $libraryPath = null)
    {
        if (!extension_loaded('ffi')) {
            return;
        }

        if ($libraryPath === null) {
            $ext = PHP_OS_FAMILY === 'Windows' ? 'dll' : 'so';
            $libraryPath = base_path("ffi_lib/worldos_ffi.{$ext}");
        }

        if (file_exists($libraryPath)) {
            error_log("FFI Loading library from: " . $libraryPath);
            $this->ffi = FFI::cdef("
                int process_actors_soa(
                    size_t count,
                    const uint64_t* ids,
                    const uint32_t* zone_ids,
                    float* hunger,
                    float* energy,
                    float* fear,
                    float* trauma,
                    uint8_t* heroic_types,
                    uint64_t* lineage_ids,
                    uint64_t* memes,
                    const uint64_t* seeds,
                    uint32_t* mut_actions_out
                );

                int process_fields_v7(
                    size_t count,
                    double* fields,
                    const uint32_t* neighbor_counts,
                    const uint32_t* neighbor_offsets,
                    const uint32_t* neighbors,
                    double diffusion_rate,
                    double preservation_rate
                );

                char* tick_universe_emergent(
                    const char* state_json,
                    const char* influences_json
                );

                void free_rust_string(char* s);

                float vocation_calculate_alignment_ffi(const char* actor_json, const char* target_json);
                float ruleset_get_gravity_ffi(const char* ruleset_json);
            ", $libraryPath);
        }
    }

    public function processActorsSoa(
        int $tick,
        array $ids,
        array $zoneIds,
        array $hunger,
        array $energy,
        array $fear,
        array $trauma, // Persistence (§Level-10)
        array $heroicTypes,
        array $lineageIds,
        array $memes
    ): array {
        if ($this->ffi === null) {
            return array_fill(0, count($ids), ['action_id' => 0, 'new_hunger' => 0.5, 'new_energy' => 0.5, 'new_trauma' => 0.0]);
        }

        $count = count($ids);
        if ($count === 0) return [];

        $cIds = $this->ffi->new("uint64_t[$count]");
        $cZoneIds = $this->ffi->new("uint32_t[$count]");
        $cHunger = $this->ffi->new("float[$count]");
        $cEnergy = $this->ffi->new("float[$count]");
        $cFear = $this->ffi->new("float[$count]");
        $cTrauma = $this->ffi->new("float[$count]");
        $cHeroicTypes = $this->ffi->new("uint8_t[$count]");
        $cLineageIds = $this->ffi->new("uint64_t[$count]");
        $cMemes = $this->ffi->new("uint64_t[$count]");
        $cSeeds = $this->ffi->new("uint64_t[$count]");
        $cActionsOut = $this->ffi->new("uint32_t[$count]");

        for ($i = 0; $i < $count; $i++) {
            $cIds[$i] = $ids[$i];
            $cZoneIds[$i] = $zoneIds[$i];
            $cHunger[$i] = $hunger[$i];
            $cEnergy[$i] = $energy[$i];
            $cFear[$i] = $fear[$i];
            $cTrauma[$i] = $trauma[$i] ?? 0.0;
            $cHeroicTypes[$i] = $heroicTypes[$i];
            $cLineageIds[$i] = $lineageIds[$i];
            $cMemes[$i] = $memes[$i];
            $cSeeds[$i] = ($tick * 13) + ($ids[$i] * 7); 
        }

        $result = $this->ffi->process_actors_soa(
            $count, $cIds, $cZoneIds, $cHunger, $cEnergy, $cFear, $cTrauma,
            $cHeroicTypes, $cLineageIds, $cMemes, $cSeeds, $cActionsOut
        );

        if ($result !== 1) throw new RuntimeException("Rust FFI error: $result");

        $outputActions = [];
        for ($i = 0; $i < $count; $i++) {
            $outputActions[] = [
                'action_id' => $cActionsOut[$i],
                'new_hunger' => $cHunger[$i],
                'new_energy' => $cEnergy[$i],
                'new_trauma' => $cTrauma[$i],
            ];
        }

        return $outputActions;
    }

    public function processFieldsV7(
        array $fields, array $neighborCounts, array $neighborOffsets,
        array $neighbors, float $diffusionRate, float $preservationRate
    ): array {
        if ($this->ffi === null) return $fields;

        $count = count($fields);
        if ($count === 0) return [];

        $cFields = $this->ffi->new("double[" . ($count * 8) . "]");
        $cNCounts = $this->ffi->new("uint32_t[$count]");
        $cNOffsets = $this->ffi->new("uint32_t[$count]");
        $cNListCount = count($neighbors);
        $cNList = $this->ffi->new("uint32_t[$cNListCount]");

        for ($i = 0; $i < $count; $i++) {
            $row = array_values($fields[$i]);
            for ($f = 0; $f < 8; $f++) $cFields[$i * 8 + $f] = (double)($row[$f] ?? 0.0);
            $cNCounts[$i] = (int)$neighborCounts[$i];
            $cNOffsets[$i] = (int)$neighborOffsets[$i];
        }

        foreach ($neighbors as $k => $val) $cNList[$k] = (int)$val;

        $this->ffi->process_fields_v7($count, $cFields, $cNCounts, $cNOffsets, $cNList, $diffusionRate, $preservationRate);

        $newFields = [];
        for ($i = 0; $i < $count; $i++) {
            $row = [];
            for ($f = 0; $f < 8; $f++) $row[] = (float)$cFields[$i * 8 + $f];
            $newFields[] = $row;
        }

        return $newFields;
    }

    public function tickUniverseEmergent(array $state, array $influences, int $seed): array
    {
        if ($this->ffi === null) return ['state' => $state, 'scars' => [], 'narrative_tags' => []];

        // Ensure ONLY specific map-based layers are objects {} not [] if empty
        // We do NOT use JSON_FORCE_OBJECT globally because 'zones' must be a sequence []
        $mapFields = ['cosmic', 'planetary', 'ecosystem', 'civilization', 'fields', 'global_fields', 'actor_table', 'axioms'];
        foreach ($mapFields as $f) {
            if (isset($state[$f]) && is_array($state[$f]) && empty($state[$f])) {
                $state[$f] = (object)[];
            }
        }
        
        // Ensure 'zones' is definitely a sequence
        if (isset($state['zones'])) $state['zones'] = array_values($state['zones']);

        $stateJson = json_encode($state, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION);
        @file_put_contents(storage_path('logs/ffi_state.json'), $stateJson);
        $influencesJson = json_encode(array_values($influences ?: [])); 

        $cResult = $this->ffi->tick_universe_emergent($stateJson, $influencesJson);
        if ($cResult === null) throw new RuntimeException("Rust FFI tick_universe_emergent returned null");

        $phpResultJson = FFI::string($cResult);
        $this->ffi->free_rust_string($cResult);

        $decoded = json_decode($phpResultJson, true);
        if (!is_array($decoded)) {
            Log::error("FfiActorEngine: tick_universe_emergent returned invalid JSON", [
                'raw' => substr($phpResultJson, 0, 500),
                'state_size' => strlen(json_encode($state))
            ]);
            return ['state' => $state, 'scars' => [], 'narrative_tags' => []];
        }

        return $decoded;
    }

    public function calculateVocationAlignment(array $actorMotivation, array $targetProfile): float
    {
        if (!$this->ffi) return 0.0;
        return $this->ffi->vocation_calculate_alignment_ffi(json_encode($actorMotivation), json_encode($targetProfile));
    }

    public function getCombinedGravity(array $rulesets): float
    {
        if (!$this->ffi) return 1.0;
        return $this->ffi->ruleset_get_gravity_ffi(json_encode($rulesets));
    }
}

