<?php

namespace App\Services\Simulation;

use FFI;
use RuntimeException;
use Illuminate\Support\Facades\Log;

class FfiRuleEngine
{
    private ?FFI $ffi = null;

    public function __construct(?string $libraryPath = null)
    {
        if (!extension_loaded('ffi')) {
            throw new RuntimeException('FFI extension is not loaded');
        }

        if ($libraryPath === null) {
            $ext = PHP_OS_FAMILY === 'Windows' ? 'dll' : 'so';
            $libraryPath = base_path("ffi_lib/worldos_ffi.{$ext}");
        }

        if (file_exists($libraryPath)) {
            try {
                $this->ffi = FFI::cdef("
                    char* evaluate_dsl_v10(const char* dsl_script, const char* state_json, uint64_t seed);
                    void free_rust_string(char* s);
                ", $libraryPath);
            } catch (\Throwable $e) {
                Log::error("FFI::cdef error: " . $e->getMessage());
            }
        } else {
            Log::warning("FfiRuleEngine: Shared library not found at {$libraryPath}");
        }
    }

    /**
     * Evaluate a DSL script against a JSON encoded WorldState using the Rust `worldos-rules` engine.
     * 
     * @param string $dslScript The raw text of the .dsl file.
     * @param string $stateJson JSON encoded representation of the WorldState.
     * @param int $seed Random seed for deterministic evaluation.
     * @return array|null The decoded JSON output from the rules engine or null on failure.
     */
    public function evaluateDsl(string $dslScript, string $stateJson, int $seed): ?array
    {
        if ($this->ffi === null) {
            return null; // Fallback to PHP evaluation if FFI is not available
        }

        // Call the Rust function
        $cResultPtr = $this->ffi->evaluate_dsl_v10((string)$dslScript, (string)$stateJson, (int)$seed);

        if ($cResultPtr === null) {
            Log::error("FfiRuleEngine: evaluate_dsl_v10 returned a null pointer.");
            return null;
        }

        try {
            // Read the C string into a PHP string
            $phpString = FFI::string($cResultPtr);
            
            // Free the Rust allocated string immediately
            $this->ffi->free_rust_string($cResultPtr);

            // Decode the JSON result
            $decoded = json_decode($phpString, true);

            if (isset($decoded['error'])) {
                Log::error("FfiRuleEngine Rust Error: " . $decoded['error']);
                return null;
            }

            // Normalize Rust externally tagged Enums to the flat PHP format expected by RuleVmService
            $normalized = [];
            foreach ($decoded as $out) {
                if (isset($out['Event'])) {
                    $normalized[] = [
                        'type' => 'event',
                        'event_name' => $out['Event']['name'] ?? '',
                        'metadata' => $out['Event']['payload'] ?? []
                    ];
                } elseif (isset($out['AdjustStability'])) {
                    $normalized[] = [
                        'type' => 'adjust_stability',
                        'adjust_stability_delta' => $out['AdjustStability']['delta'] ?? 0.0
                    ];
                } elseif (isset($out['AdjustEntropy'])) {
                    $normalized[] = [
                        'type' => 'adjust_entropy',
                        'adjust_entropy_delta' => $out['AdjustEntropy']['delta'] ?? 0.0
                    ];
                } elseif (isset($out['AddPath'])) {
                    $normalized[] = [
                        'type' => 'add_path',
                        'add_path' => $out['AddPath']['path'] ?? '',
                        'add_path_delta' => $out['AddPath']['delta'] ?? 0.0
                    ];
                } elseif (isset($out['SetPath'])) {
                    $normalized[] = [
                        'type' => 'set_path',
                        'set_path' => $out['SetPath']['path'] ?? '',
                        'set_path_value' => $out['SetPath']['value'] ?? null
                    ];
                } elseif (isset($out['SpawnActor'])) {
                    $normalized[] = [
                        'type' => 'spawn_actor',
                        'spawn_actor_kind' => $out['SpawnActor']['kind'] ?? ''
                    ];
                }
            }

            return $normalized;

        } catch (\Throwable $e) {
            Log::error("FfiRuleEngine Exception: " . $e->getMessage());
            // Attempt to free if an exception occurred after allocation but before free
            try {
                if ($cResultPtr !== null) {
                     $this->ffi->free_rust_string($cResultPtr);
                }
            } catch (\Throwable $freeEx) {} // Ignore double free errors in catch block
            
            return null;
        }
    }
}
