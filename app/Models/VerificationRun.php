<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VerificationRun extends Model
{
    protected $table = 'judge_runs';

    public const STATUS_PENDING = 'pending';
    public const STATUS_RUNNING = 'running';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_FAILED = 'failed';

    public const VERDICT_ACCEPTED = 'accepted';
    public const VERDICT_WRONG_ANSWER = 'wrong_answer';
    public const VERDICT_COMPILATION_ERROR = 'compilation_error';
    public const VERDICT_RUNTIME_ERROR = 'runtime_error';
    public const VERDICT_TIME_LIMIT_EXCEEDED = 'time_limit_exceeded';
    public const VERDICT_INTERNAL_ERROR = 'internal_error';
    public const VERDICT_NOT_RUN = 'not_run';

    protected $fillable = [
        'codeforces_solution_id',
        'language',
        'status',
        'verdict',
        'source_code',
        'tests_json',
        'compile_stdout',
        'compile_stderr',
        'run_results_json',
        'runtime_ms',
        'error_message',
    ];

    protected function casts(): array
    {
        return [
            'tests_json' => 'array',
            'run_results_json' => 'array',
        ];
    }

    public function codeforcesSolution(): BelongsTo
    {
        return $this->belongsTo(CodeforcesSolution::class);
    }
}
