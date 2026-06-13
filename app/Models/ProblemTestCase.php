<?php

namespace App\Models;

use App\Modules\Problems\Models\Problem;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * An official test case for an Arena problem.
 * Cases with is_sample=true are public; the rest are hidden and their I/O must
 * never be exposed to normal users.
 */
class ProblemTestCase extends Model
{
    use HasFactory;

    protected $fillable = [
        'problem_id',
        'ordinal',
        'input',
        'expected_output',
        'is_sample',
    ];

    protected $casts = [
        'is_sample' => 'boolean',
        'ordinal' => 'integer',
    ];

    public function problem(): BelongsTo
    {
        return $this->belongsTo(Problem::class);
    }
}
