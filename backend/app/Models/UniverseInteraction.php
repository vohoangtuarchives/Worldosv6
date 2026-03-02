<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UniverseInteraction extends Model
{
    protected $fillable = [
        'universe_a_id',
        'universe_b_id',
        'interaction_type',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    public function universeA()
    {
        return $this->belongsTo(Universe::class, 'universe_a_id');
    }

    public function universeB()
    {
        return $this->belongsTo(Universe::class, 'universe_b_id');
    }
}
