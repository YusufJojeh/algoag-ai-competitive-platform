<?php

namespace App\Modules\Arena\Models;

use App\Modules\Problems\Models\Problem;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContestProblem extends Model
{
    protected $fillable = [
        'contest_id',
        'problem_id',
        'label',
        'ordinal',
    ];

    protected $casts = [
        'ordinal' => 'integer',
    ];

    public function contest(): BelongsTo
    {
        return $this->belongsTo(Contest::class);
    }

    public function problem(): BelongsTo
    {
        return $this->belongsTo(Problem::class);
    }
}
