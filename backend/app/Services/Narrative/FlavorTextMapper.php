<?php

namespace App\Services\Narrative;

use Illuminate\Support\Facades\DB;

/**
 * Tier 1 — Flavor Text: map numeric values (e.g. epistemic_instability) to rich text.
 */
class FlavorTextMapper
{
    public function map(string $vectorKey, float $value, string $locale = 'en'): string
    {
        $row = DB::table('flavor_texts')
            ->where('vector_key', $vectorKey)
            ->where('min_value', '<=', $value)
            ->where('max_value', '>=', $value)
            ->where('locale', $locale)
            ->first();

        return $row?->text ?? $this->fallback($vectorKey, $value);
    }

    public function mapMany(array $vector, string $locale = 'en'): array
    {
        $out = [];
        foreach ($vector as $key => $value) {
            if (is_numeric($value)) {
                $out[$key] = $this->map($key, (float) $value, $locale);
            }
        }
        return $out;
    }

    protected function fallback(string $key, float $value): string
    {
        if ($value >= 0.8) {
            return "môi trường hỗn loạn hoặc căng thẳng cao";
        }
        if ($value >= 0.5) {
            return "trạng thái trung gian";
        }
        return "môi trường tương đối ổn định";
    }
}
