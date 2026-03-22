<?php

namespace App\Modules\World\Services;

use App\Modules\World\Services\MaterialMutationDag;
use App\Modules\World\Services\PressureResolver;

/**
 * MaterialLifecycleEngine: Handle the birth, decay, and mutation of matter.
 */
class MaterialLifecycleEngine
{
    public function __construct(
        protected PressureResolver $pressureResolver,
        protected MaterialMutationDag $mutationDag
    ) {}

    public function process(array $state, int $tick): array
    {
        $stress = $this->pressureResolver->resolve($state);
        // Mutation logic...
        return $state;
    }
}
