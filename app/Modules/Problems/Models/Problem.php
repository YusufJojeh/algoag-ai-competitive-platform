<?php

namespace App\Modules\Problems\Models;

use App\Models\ProblemTestCase;
use App\Models\Submission;
use App\Models\Tag;
use Database\Factories\ProblemFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Problem extends Model
{
    use HasFactory;

    /** Problem lives outside App\Models, so point the resolver at its factory explicitly. */
    protected static function newFactory(): ProblemFactory
    {
        return ProblemFactory::new();
    }

    protected $fillable = [
        'title',
        'slug',
        'statement',
        'difficulty',
        'time_limit_ms',
        'memory_limit_mb',
        'is_public',
        'published_at',
        'published_from_contest_id',
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'published_at' => 'datetime',
    ];

    public function scopePublic($query)
    {
        return $query
            ->where('is_public', true)
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now());
    }

    public function scopeUnpublishedContestOnly($query)
    {
        return $query
            ->where('is_public', false)
            ->whereNull('published_at')
            ->whereNotNull('published_from_contest_id');
    }

    public function isPubliclyVisible(): bool
    {
        return $this->is_public === true
            && $this->published_at !== null
            && $this->published_at->lte(now());
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }

    public function testCases(): HasMany
    {
        return $this->hasMany(ProblemTestCase::class)->orderBy('ordinal');
    }
}
