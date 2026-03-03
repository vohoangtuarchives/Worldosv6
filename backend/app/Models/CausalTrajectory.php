<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Universe;

class CausalTrajectory extends Model
{
    protected $table = 'prophecies'; // Giữ nguyên tên bảng để tránh migrate lại, nhưng class name phản ánh đúng bản chất

    protected $fillable = [
        'universe_id',
        'target_tick',
        'phenomenon_description', // Thay cho content
        'probability',
        'convergence_type', // Thay cho type
        'is_fulfilled',
    ];

    protected $casts = [
        'probability' => 'float',
        'is_fulfilled' => 'boolean',
    ];

    public function universe(): BelongsTo
    {
        return $this->belongsTo(Universe::class);
    }
}
