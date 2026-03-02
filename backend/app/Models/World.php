<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class World extends Model
{
    protected $fillable = ['multiverse_id', 'name', 'slug', 'axiom', 'world_seed', 'origin', 'current_genre', 'base_genre', 'active_genre_weights', 'is_autonomic'];

    protected $casts = [
        'axiom' => 'array',
        'world_seed' => 'array',
        'active_genre_weights' => 'array',
        'is_autonomic' => 'boolean',
    ];

    public function multiverse(): BelongsTo
    {
        return $this->belongsTo(Multiverse::class);
    }

    public function universes(): HasMany
    {
        return $this->hasMany(Universe::class);
    }

    public function sagas(): HasMany
    {
        return $this->hasMany(Saga::class);
    }
}
