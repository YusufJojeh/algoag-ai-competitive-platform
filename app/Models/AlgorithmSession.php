<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AlgorithmSession extends Model
{
    protected $table = 'algorithm_sessions';

    protected $fillable = [
        'problem',
        'suggestions',
        'benchmark_results',
        'recommendation',
    ];

    protected $casts = [
        'suggestions' => 'array',
        'benchmark_results' => 'array',
    ];
}
