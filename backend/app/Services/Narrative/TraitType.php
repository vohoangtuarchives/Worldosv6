<?php

namespace App\Services\Narrative;

/**
 * Định nghĩa 17 chiều Trait Vector (§TraitVector 17D).
 * Dùng constant thay cho magic index để đảm bảo type-safety và readability.
 */
final class TraitType
{
    // === CLUSTER I: Power & Dominance (0-2) ===
    const DOMINANCE    = 0;
    const AMBITION     = 1;
    const COERCION     = 2;

    // === CLUSTER II: Social Bonds (3-6) ===
    const LOYALTY      = 3;
    const EMPATHY      = 4;
    const SOLIDARITY   = 5;
    const CONFORMITY   = 6;

    // === CLUSTER III: Cognition (7-10) ===
    const PRAGMATISM      = 7;
    const CURIOSITY       = 8;
    const DOGMATISM       = 9;
    const RISK_TOLERANCE  = 10;

    // === CLUSTER IV: Emotions (11-16) ===
    const FEAR      = 11;
    const VENGEANCE = 12;
    const HOPE      = 13;
    const GRIEF     = 14;
    const PRIDE     = 15;
    const SHAME     = 16;

    /**
     * Lấy giá trị trait theo constant (safe, trả về 0 nếu không tồn tại).
     */
    public static function get(array $traits, int $index): float
    {
        return (float) ($traits[$index] ?? 0.0);
    }

    public static function label(int $index): string
    {
        return match($index) {
            self::DOMINANCE    => 'Dominance',
            self::AMBITION     => 'Ambition',
            self::COERCION     => 'Coercion',
            self::LOYALTY      => 'Loyalty',
            self::EMPATHY      => 'Empathy',
            self::SOLIDARITY   => 'Solidarity',
            self::CONFORMITY   => 'Conformity',
            self::PRAGMATISM   => 'Pragmatism',
            self::CURIOSITY    => 'Curiosity',
            self::DOGMATISM    => 'Dogmatism',
            self::RISK_TOLERANCE => 'RiskTolerance',
            self::FEAR         => 'Fear',
            self::VENGEANCE    => 'Vengeance',
            self::HOPE         => 'Hope',
            self::GRIEF        => 'Grief',
            self::PRIDE        => 'Pride',
            self::SHAME        => 'Shame',
            default            => 'Unknown',
        };
    }
}
