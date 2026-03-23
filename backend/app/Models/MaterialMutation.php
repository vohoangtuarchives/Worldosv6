<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaterialMutation extends Model
{
    protected $fillable = [
        'parent_material_id', 'child_material_id', 'trigger_condition', 'context_constraint',
    ];

    protected $casts = [
        'context_constraint' => 'array',
    ];

    public function parentMaterial(): BelongsTo
    {
        return $this->belongsTo(Material::class, 'parent_material_id');
    }

    public function childMaterial(): BelongsTo
    {
        return $this->belongsTo(Material::class, 'child_material_id');
    }
}
