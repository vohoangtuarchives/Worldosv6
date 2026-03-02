<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Actor extends Model
{
    protected $fillable = [
        'universe_id',
        'name',
        'archetype',
        'traits',
        'biography',
        'is_alive',
        'generation',
        'metrics',
    ];

    protected $casts = [
        'traits' => 'array',
        'metrics' => 'array',
        'is_alive' => 'boolean',
    ];

    public function universe(): BelongsTo
    {
        return $this->belongsTo(Universe::class);
    }
}
