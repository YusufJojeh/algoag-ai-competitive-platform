<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiUsageRecord extends Model
{
    protected $fillable = [
        'user_id',
        'feature',
        'provider',
        'model',
        'status',
        'duration_ms',
        'token_usage',
        'failure_category',
    ];

    protected function casts(): array
    {
        return [
            'token_usage' => 'array',
            'duration_ms' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
