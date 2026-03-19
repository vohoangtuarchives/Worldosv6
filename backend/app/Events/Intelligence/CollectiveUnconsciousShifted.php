<?php

namespace App\Events\Intelligence;

use App\Models\Universe;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CollectiveUnconsciousShifted
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Universe $universe,
        public readonly array $oldVector,
        public readonly array $newVector
    ) {}
}
