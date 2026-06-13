<?php

namespace App\Models;

use App\Modules\Problems\Models\Problem;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Submission extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'problem_id',
        'contest_id',
        'language',
        'code',
        'verdict',
        'status',
        'runtime_ms',
        'per_case_results',
        'judge_meta',
    ];

    protected $casts = [
        'judge_meta' => 'array',
        'per_case_results' => 'array',
    ];

    public const STATUS_PENDING = 'pending';
    public const STATUS_RUNNING = 'running';
    public const STATUS_COMPLETED = 'completed';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function problem(): BelongsTo
    {
        return $this->belongsTo(Problem::class);
    }
}
