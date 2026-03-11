<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Prophecy extends Model
{
    protected $fillable = [
        'universe_id',
        'created_tick',
        'prediction_tick',
        'text',
        'confidence',
        'fulfilled',
        'source_snapshot_metrics',
    ];

    protected $casts = [
        'confidence' => 'float',
        'fulfilled' => 'boolean',
        'source_snapshot_metrics' => 'array',
    ];

    public function universe(): BelongsTo
    {
        return $this->belongsTo(Universe::class);
    }

    public function actors(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Actor::class, 'actor_prophecy_beliefs')
            ->withPivot('belief_strength')
            ->withTimestamps();
    }
}
