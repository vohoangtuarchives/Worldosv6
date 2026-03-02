<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AgentConfig extends Model
{
    protected $fillable = [
        'agent_name',
        'personality',
        'creativity',
        'themes',
        'model_type',
        'local_endpoint',
        'model_name',
        'api_key'
    ];

    protected $casts = [
        'themes' => 'array',
        'creativity' => 'integer'
    ];
}
