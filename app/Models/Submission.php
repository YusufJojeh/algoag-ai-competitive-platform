<?php

namespace App\Models;

use App\Modules\Problems\Models\Problem;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Submission extends Model
{
    protected $fillable = [
        'user_id',
        'problem_id',
        'language',
        'code',
        'verdict',
        'judge_meta',
    ];

    protected $casts = [
        'judge_meta' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function problem(): BelongsTo
    {
        return $this->belongsTo(Problem::class);
    }
}
