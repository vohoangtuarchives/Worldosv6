<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Chronicle extends Model
{
    protected $fillable = [
        'universe_id', 'actor_id', 'world_event_id', 'from_tick', 'to_tick', 'type', 'content', 'importance',
        'perceived_archive_snapshot', 'raw_payload'
    ];

    protected $casts = [
        'perceived_archive_snapshot' => 'array',
        'raw_payload' => 'array',
        'importance' => 'float',
    ];

    public function universe(): BelongsTo
    {
        return $this->belongsTo(Universe::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(Actor::class);
    }
}
