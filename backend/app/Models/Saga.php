<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Saga extends Model
{
    protected $fillable = ['world_id', 'name', 'status'];

    public function world(): BelongsTo
    {
        return $this->belongsTo(World::class);
    }

    public function universes(): HasMany
    {
        return $this->hasMany(Universe::class);
    }
}
