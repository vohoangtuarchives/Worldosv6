<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class NarrativeSeries extends Model
{
    protected $fillable = [
        'universe_id',
        'saga_id',
        'title',
        'genre_key',
        'current_book_index',
        'total_chapters_generated',
        'status',
        'config',
    ];

    protected $casts = [
        'config' => 'array',
        'current_book_index' => 'integer',
        'total_chapters_generated' => 'integer',
    ];

    public function universe(): BelongsTo
    {
        return $this->belongsTo(Universe::class);
    }

    public function saga(): BelongsTo
    {
        return $this->belongsTo(Saga::class);
    }

    public function chapters(): HasMany
    {
        return $this->hasMany(SerialChapter::class, 'series_id');
    }

    public function bible(): HasOne
    {
        return $this->hasOne(StoryBible::class, 'series_id');
    }
}
