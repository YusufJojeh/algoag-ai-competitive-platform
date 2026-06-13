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
        'problem_text_translations',
        'parsed_problem',
        'parsed_problem_translations',
        'solution_code',
        'solution_language',
        'response_language',
        'explanation',
        'explanation_translations',
        'generated_tests',
        'run_results',
        'algorithm_breakdown',
        'algorithm_breakdown_translations',
        'status',
        'progress_stage',
        'job_id',
        'error_message',
    ];

    protected $casts = [
        'parsed_problem' => 'array',
        'problem_text_translations' => 'array',
        'parsed_problem_translations' => 'array',
        'explanation_translations' => 'array',
        'generated_tests' => 'array',
        'run_results' => 'array',
        'algorithm_breakdown_translations' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public const STATUS_PENDING = 'pending';

    public const STATUS_PROCESSING = 'processing';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_FAILED = 'failed';

    public const STAGE_QUEUED = 'queued';

    public const STAGE_PARSING = 'parsing';

    public const STAGE_GENERATING_CODE = 'generating_code';

    public const STAGE_GENERATING_EXPLANATION = 'generating_explanation';

    public const STAGE_GENERATING_TESTS = 'generating_tests';

    public const STAGE_JUDGING = 'judging';

    public const STAGE_GENERATING_BREAKDOWN = 'generating_breakdown';

    public const STAGE_COMPLETED = 'completed';

    public const STAGE_FAILED = 'failed';
}
