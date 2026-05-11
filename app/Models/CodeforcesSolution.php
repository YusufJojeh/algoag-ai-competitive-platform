<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CodeforcesSolution extends Model
{
    use HasFactory;

    protected $table = 'codeforces_solutions';

    protected $fillable = [
        'user_id',
        'problem_text',
        'parsed_problem',
        'solution_code',
        'solution_language',
        'explanation',
        'generated_tests',
        'run_results',
        'algorithm_breakdown',
        'status',
        'job_id',
        'error_message',
    ];

    protected $casts = [
        'parsed_problem' => 'array',
        'generated_tests' => 'array',
        'run_results' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public const STATUS_PENDING = 'pending';

    public const STATUS_PROCESSING = 'processing';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_FAILED = 'failed';
}
