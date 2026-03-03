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
        'observation_load', 'last_observed_at',
    ];

    protected $casts = [
        'state_vector' => 'array',
        'observation_load' => 'float',
        'last_observed_at' => 'datetime',
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

    // --- Domain Logic ---

    public function isHalted(): bool
    {
        return $this->status === 'halted';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function getEntropy(): float
    {
        return (float) ($this->state_vector['entropy'] ?? 0.0);
    }

    public function getStability(): float
    {
        return (float) ($this->state_vector['stability_index'] ?? 0.0);
    }

    public function applyDelta(array $deltas): void
    {
        $vec = $this->state_vector ?? [];
        
        $vec['entropy'] = max(0.0, min(1.0, ($vec['entropy'] ?? 0.0) + ($deltas['entropy'] ?? 0.0)));
        $vec['stability_index'] = max(0.0, min(1.0, ($vec['stability_index'] ?? 0.0) + ($deltas['order'] ?? 0.0)));
        
        foreach (['innovation', 'growth', 'trauma'] as $key) {
            if (isset($deltas[$key])) {
                $vec[$key] = ($vec[$key] ?? 0.0) + $deltas[$key];
            }
        }

        $this->update(['state_vector' => $vec]);
    }

    public function addScar(string $scar): bool
    {
        $vec = $this->state_vector ?? [];
        $scars = $vec['scars'] ?? [];
        
        if (!in_array($scar, $scars)) {
            $scars[] = $scar;
            $vec['scars'] = $scars;
            $this->update(['state_vector' => $vec]);
            return true;
        }
        
        return false;
    }

    public function canFork(int $branchLimit = 1): bool
    {
        if (!$this->isActive()) return false;
        
        $activeCount = self::where('saga_id', $this->saga_id)
            ->where('status', 'active')
            ->count();
            
        return $activeCount < $branchLimit;
    }
}
