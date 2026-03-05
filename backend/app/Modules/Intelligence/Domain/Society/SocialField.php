<?php

namespace App\Modules\Intelligence\Domain\Society;

/**
 * Value Object representing the aggregate social field of a universe.
 */
final class SocialField
{
    public function __construct(
        public readonly float $aggressionField,
        public readonly float $rationalField,
        public readonly float $spiritualField,
        public readonly float $conformityField
    ) {}
}
