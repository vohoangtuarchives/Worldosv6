<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Multiverse extends Model
{
    protected $fillable = ['name', 'slug', 'config'];

    protected $casts = [
        'config' => 'array',
    ];

    public function worlds(): HasMany
    {
        return $this->hasMany(World::class);
    }

    public function universes(): HasMany
    {
        return $this->hasMany(Universe::class);
    }
}
