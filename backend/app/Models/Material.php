<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Material extends Model
{
    public const ONTOLOGY_PHYSICAL = 'physical';
    public const ONTOLOGY_INSTITUTIONAL = 'institutional';
    public const ONTOLOGY_SYMBOLIC = 'symbolic';
    public const ONTOLOGY_BEHAVIORAL = 'behavioral';

    public const LIFECYCLE_DORMANT = 'dormant';
    public const LIFECYCLE_ACTIVE = 'active';
    public const LIFECYCLE_OBSOLETE = 'obsolete';

    protected $fillable = [
        'name', 'slug', 'description', 'ontology', 'lifecycle',
        'inputs', 'outputs', 'pressure_coefficients',
    ];

    protected $casts = [
        'inputs' => 'array',
        'outputs' => 'array',
        'pressure_coefficients' => 'array',
    ];

    public function instances(): HasMany
    {
        return $this->hasMany(MaterialInstance::class);
    }

    public function pressures(): HasMany
    {
        return $this->hasMany(MaterialPressure::class);
    }

    public function parentMutations(): HasMany
    {
        return $this->hasMany(MaterialMutation::class, 'parent_material_id');
    }

    public function childMutations(): HasMany
    {
        return $this->hasMany(MaterialMutation::class, 'child_material_id');
    }
}
