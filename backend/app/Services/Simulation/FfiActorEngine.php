<?php

namespace App\Services\Simulation;

use FFI;
use RuntimeException;

class FfiActorEngine
{
    private ?FFI $ffi = null;

    public function __construct(string $libraryPath = null)
    {
        if (!extension_loaded('ffi')) {
            throw new RuntimeException('FFI extension is not loaded');
        }

        if ($libraryPath === null) {
            $ext = PHP_OS_FAMILY === 'Windows' ? 'dll' : 'so';
            $libraryPath = base_path("ffi_lib/worldos_ffi.{$ext}");
        }

        // Only load if the file exists (good for local dev checks)
        if (file_exists($libraryPath)) {
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
            ", $libraryPath);
        }
    }

    /**
     * Process multiple actors using the Struct-of-Arrays format.
     * Evaluates Decision Graphs in Rust micro-layer.
     */
    public function processActorsSoa(
        array $ids,
        array $zoneIds,
        array $hunger,
        array $energy,
        array $fear,
        array $trauma, // New: Persistence
        array $heroicTypes,
        array $lineageIds,
        array $memes,
        int $tick // New: For deterministic seed generation
    ): array {
        if ($this->ffi === null) {
            // Mock mode when DLL/SO is missing
            return array_fill(0, count($ids), ['action_id' => 0, 'new_hunger' => 0.5, 'new_energy' => 0.5, 'new_trauma' => 0.0]);
        }

        $count = count($ids);
        if ($count === 0) {
            return [];
        }

        // Allocate C memory arrays
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

        // Pack data and generate deterministic seeds (§Level-10 Determinism)
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
            // Deterministic seed: mix of global tick and unique actor ID
            $cSeeds[$i] = ($tick * 13) + ($ids[$i] * 7); 
        }

        // Call Rust FFI bridging function (Rayon Optimized)
        $result = $this->ffi->process_actors_soa(
            $count,
            $cIds,
            $cZoneIds,
            $cHunger,
            $cEnergy,
            $cFear,
            $cTrauma,
            $cHeroicTypes,
            $cLineageIds,
            $cMemes,
            $cSeeds,
            $cActionsOut
        );

        if ($result !== 1) {
            throw new RuntimeException("Rust FFI process_actors_soa returned error code: $result");
        }

        // Unpack output
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

    /**
     * Process 8-field attractor dynamics (Diffusion + Decay) in Rust.
     */
    public function processFieldsV7(
        array $fields, // 2D array [count][8]
        array $neighborCounts,
        array $neighborOffsets,
        array $neighbors,
        float $diffusionRate,
        float $preservationRate
    ): array {
        if ($this->ffi === null) {
            return $fields; // Mock or DLL missing
        }

        $count = count($fields);
        if ($count === 0) return [];

        // Allocate C memory
        $cFields = $this->ffi->new("double[" . ($count * 8) . "]");
        $cNCounts = $this->ffi->new("uint32_t[$count]");
        $cNOffsets = $this->ffi->new("uint32_t[$count]");
        $cNListCount = count($neighbors);
        $cNList = $this->ffi->new("uint32_t[$cNListCount]");

        // Pack data
        for ($i = 0; $i < $count; $i++) {
            $row = array_values($fields[$i]); // Ensure indexed
            for ($f = 0; $f < 8; $f++) {
                $cFields[$i * 8 + $f] = (double)($row[$f] ?? 0.0);
            }
            $cNCounts[$i] = (int)$neighborCounts[$i];
            $cNOffsets[$i] = (int)$neighborOffsets[$i];
        }

        foreach ($neighbors as $k => $val) {
            $cNList[$k] = (int)$val;
        }

        // Call Rust
        $this->ffi->process_fields_v7(
            $count,
            $cFields,
            $cNCounts,
            $cNOffsets,
            $cNList,
            $diffusionRate,
            $preservationRate
        );

        // Unpack output
        $newFields = [];
        for ($i = 0; $i < $count; $i++) {
            $row = [];
            for ($f = 0; $f < 8; $f++) {
                $row[] = (float)$cFields[$i * 8 + $f];
            }
            $newFields[] = $row;
        }

        return $newFields;
    }
}
