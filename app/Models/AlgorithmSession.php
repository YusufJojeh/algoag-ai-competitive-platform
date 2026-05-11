<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AlgorithmSession extends Model
{
    protected $table = 'algorithm_sessions';

    protected $fillable = [
        'user_id',
        'problem',
        'suggestions',
        'benchmark_results',
        'recommendation',
    ];

    protected $casts = [
        'suggestions' => 'array',
        'benchmark_results' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
