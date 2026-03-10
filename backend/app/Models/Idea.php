<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Idea extends Model
{
    protected $fillable = [
        'universe_id',
        'origin_actor_id',
        'artifact_id',
        'theme',
        'influence_score',
        'followers',
        'birth_tick',
    ];

    protected $casts = [
        'influence_score' => 'float',
        'followers' => 'float',
        'birth_tick' => 'integer',
    ];

    public function universe(): BelongsTo
    {
        return $this->belongsTo(Universe::class);
    }

    public function originActor(): BelongsTo
    {
        return $this->belongsTo(Actor::class, 'origin_actor_id');
    }

    public function artifact(): BelongsTo
    {
        return $this->belongsTo(Artifact::class);
    }

    public function schools(): HasMany
    {
        return $this->hasMany(School::class);
    }
}
