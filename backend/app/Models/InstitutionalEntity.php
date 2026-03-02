<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InstitutionalEntity extends Model
{
    protected $fillable = [
        'universe_id', 'name', 'entity_type', 'ideology_vector',
        'org_capacity', 'institutional_memory', 'legitimacy',
        'influence_map', 'spawned_at_tick', 'collapsed_at_tick',
    ];

    protected $casts = [
        'ideology_vector' => 'array',
        'influence_map' => 'array',
        'org_capacity' => 'float',
        'institutional_memory' => 'float',
        'legitimacy' => 'float',
    ];

    public function universe(): BelongsTo
    {
        return $this->belongsTo(Universe::class);
    }

    /**
     * Check if entity should collapse (org_capacity <= 0).
     */
    public function isCollapsed(): bool
    {
        return $this->org_capacity <= 0 || $this->collapsed_at_tick !== null;
    }
}
