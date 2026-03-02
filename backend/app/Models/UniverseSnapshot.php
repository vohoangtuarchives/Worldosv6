<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UniverseSnapshot extends Model
{
    protected $fillable = [
        'universe_id', 'tick', 'state_vector', 'entropy', 'stability_index', 'metrics',
    ];

    protected $casts = [
        'state_vector' => 'array',
        'metrics' => 'array',
        'entropy' => 'float',
        'stability_index' => 'float',
    ];

    public function universe(): BelongsTo
    {
        return $this->belongsTo(Universe::class);
    }
}
