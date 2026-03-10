<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Actor extends Model
{
    protected $fillable = [
        'universe_id',
        'name',
        'archetype',
        'traits',
        'trait_scan_status',
        'biography',
        'is_alive',
        'generation',
        'lineage_id',
        'parent_actor_id',
        'birth_tick',
        'death_tick',
        'life_stage',
        'metrics',
        'capabilities',
        'hero_stage',
        'vitality',
    ];

    protected $casts = [
        'traits' => 'array',
        'metrics' => 'array',
        'capabilities' => 'array',
        'vitality' => 'array',
        'is_alive' => 'boolean',
        'birth_tick' => 'integer',
        'death_tick' => 'integer',
    ];

    public function universe(): BelongsTo
    {
        return $this->belongsTo(Universe::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Actor::class, 'parent_actor_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Actor::class, 'parent_actor_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(ActorEvent::class)->orderBy('tick');
    }

    /** Great Person link: one-to-one with SupremeEntity when actor was spawned as vĩ nhân. */
    public function supremeEntity(): HasOne
    {
        return $this->hasOne(SupremeEntity::class);
    }
}
