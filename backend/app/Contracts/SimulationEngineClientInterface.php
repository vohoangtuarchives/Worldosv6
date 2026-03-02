<?php

namespace App\Contracts;

/**
 * Interface for calling the WorldOS simulation engine (Rust gRPC).
 * Phase 1: stub. Phase 3: implement with real gRPC client.
 */
interface SimulationEngineClientInterface
{
    /**
     * Advance universe by N ticks, return snapshot.
     *
     * @param  int  $universeId
     * @param  int  $ticks
     * @param  string  $stateInput  Optional serialized state to load (empty = load from store).
     * @return array{ok: bool, snapshot?: array, error_message?: string}
     */
    public function advance(int $universeId, int $ticks, string $stateInput = ''): array;
}
