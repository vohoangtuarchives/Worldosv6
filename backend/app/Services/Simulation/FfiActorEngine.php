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

        $libraryPath = $libraryPath ?? base_path('ffi_lib/libworldos_ffi.so');

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
                    uint64_t* memes,
                    uint32_t* mut_actions_out
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
        array $memes
    ): array {
        if ($this->ffi === null) {
            // Mock mode when DLL/SO is missing
            return array_fill(0, count($ids), 0);
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
        $cMemes = $this->ffi->new("uint64_t[$count]");
        $cActionsOut = $this->ffi->new("uint32_t[$count]");

        // Pack data
        for ($i = 0; $i < $count; $i++) {
            $cIds[$i] = $ids[$i];
            $cZoneIds[$i] = $zoneIds[$i];
            $cHunger[$i] = $hunger[$i];
            $cEnergy[$i] = $energy[$i];
            $cFear[$i] = $fear[$i];
            $cMemes[$i] = $memes[$i];
        }

        // Call Rust FFI bridging function
        $result = $this->ffi->process_actors_soa(
            $count,
            $cIds,
            $cZoneIds,
            $cHunger,
            $cEnergy,
            $cFear,
            $cMemes,
            $cActionsOut
        );

        if ($result !== 1) {
            throw new RuntimeException("Rust FFI process_actors_soa returned error code: $result");
        }

        // Unpack output (actions out and potentially updated traits like hunger/energy)
        $outputActions = [];
        for ($i = 0; $i < $count; $i++) {
            $outputActions[] = [
                'action_id' => $cActionsOut[$i],
                'new_hunger' => $cHunger[$i],
                'new_energy' => $cEnergy[$i],
            ];
        }

        return $outputActions;
    }
}
