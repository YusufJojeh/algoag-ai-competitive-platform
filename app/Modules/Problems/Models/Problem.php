<?php

namespace App\Modules\Problems\Models;

use App\Models\Submission;
use App\Models\Tag;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Problem extends Model
{
    protected $fillable = [
        'title',
        'slug',
        'statement',
        'difficulty',
        'time_limit_ms',
        'memory_limit_mb',
    ];

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }
}
