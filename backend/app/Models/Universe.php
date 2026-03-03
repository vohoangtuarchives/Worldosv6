<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Universe extends Model
{
    protected $fillable = [
        'world_id', 'saga_id', 'multiverse_id', 'parent_universe_id',
        'current_tick', 'level', 'epoch', 'status', 'state_vector', 'name',
        'observation_load', 'last_observed_at', 'observer_bonus',
    ];

    protected $casts = [
        'state_vector' => 'array',
        'observation_load' => 'float',
        'last_observed_at' => 'datetime',
        'observer_bonus' => 'float',
    ];

    public function world(): BelongsTo
    {
        return $this->belongsTo(World::class);
    }

    public function saga(): BelongsTo
    {
        return $this->belongsTo(Saga::class);
    }

    public function multiverse(): BelongsTo
    {
        return $this->belongsTo(Multiverse::class);
    }

    public function parentUniverse(): BelongsTo
    {
        return $this->belongsTo(Universe::class, 'parent_universe_id');
    }

    public function childUniverses(): HasMany
    {
        return $this->hasMany(Universe::class, 'parent_universe_id');
    }

    public function snapshots(): HasMany
    {
        return $this->hasMany(UniverseSnapshot::class);
    }

    public function branchEvents(): HasMany
    {
        return $this->hasMany(BranchEvent::class);
    }
    
    public function supremeEntities(): HasMany
    {
        return $this->hasMany(SupremeEntity::class);
    }

    // --- Domain Logic removed (Moved to UniverseEntity) ---
}
