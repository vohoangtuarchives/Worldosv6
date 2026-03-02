<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupremeEntity extends Model
{
    protected $fillable = [
        'universe_id',
        'name',
        'entity_type',
        'domain',
        'description',
        'power_level',
        'alignment',
        'status',
        'ascended_at_tick',
        'fallen_at_tick',
    ];

    protected $casts = [
        'alignment' => 'array',
        'power_level' => 'float',
    ];

    public function universe(): BelongsTo
    {
        return $this->belongsTo(Universe::class);
    }
}
