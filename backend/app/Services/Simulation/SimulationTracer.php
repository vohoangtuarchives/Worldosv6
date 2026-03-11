<?php

namespace App\Services\Simulation;

use Illuminate\Support\Facades\Log;

/**
 * Doc §31: Stub for simulation tracing (Jaeger/OpenTelemetry).
 * When worldos.observability.tracing_enabled is true, span boundaries are logged (duration_ms).
 * To use a real tracer: install OpenTelemetry SDK, bind a TracerInterface in the container,
 * and delegate span creation here to that tracer (e.g. startSpan/endSpan or scope).
 * No-op when disabled.
 */
final class SimulationTracer
{
    /**
     * Run the given callable inside a named span. When tracing is disabled, runs the callable directly.
     *
     * @template T
     * @param  callable(): T  $callback
     * @return T
     */
    public static function span(string $name, callable $callback): mixed
    {
        if (! config('worldos.observability.tracing_enabled', false)) {
            return $callback();
        }
        $start = microtime(true);
        Log::debug("SimulationTracer: span_start [{$name}]");
        try {
            $result = $callback();
            Log::debug("SimulationTracer: span_end [{$name}]", ['duration_ms' => round((microtime(true) - $start) * 1000, 2)]);

            return $result;
        } catch (\Throwable $e) {
            Log::debug("SimulationTracer: span_error [{$name}]", ['error' => $e->getMessage()]);
            throw $e;
        }
    }
}
