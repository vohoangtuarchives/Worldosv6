<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Chronicle extends Model
{
    protected $fillable = [
        'universe_id', 'from_tick', 'to_tick', 'type', 'content', 'perceived_archive_snapshot', 'raw_payload'
    ];

    protected $casts = [
        'perceived_archive_snapshot' => 'array',
        'raw_payload' => 'array',
    ];

    public function universe(): BelongsTo
    {
        return $this->belongsTo(Universe::class);
    }
}
