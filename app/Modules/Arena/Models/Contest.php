<?php

namespace App\Modules\Arena\Models;

use App\Models\Submission;
use App\Models\User;
use App\Modules\Problems\Models\Problem;
use Database\Factories\ContestFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contest extends Model
{
    use HasFactory;

    protected static function newFactory(): ContestFactory
    {
        return ContestFactory::new();
    }

    protected $fillable = [
        'title',
        'slug',
        'description',
        'starts_at',
        'ends_at',
        'is_public',
        'is_practice',
        'problems_published_at',
        'created_by',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'is_public' => 'boolean',
        'is_practice' => 'boolean',
        'problems_published_at' => 'datetime',
    ];

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function contestProblems(): HasMany
    {
        return $this->hasMany(ContestProblem::class)->orderBy('ordinal');
    }

    public function problems(): BelongsToMany
    {
        return $this->belongsToMany(Problem::class, 'contest_problems')
            ->withPivot(['label', 'ordinal'])
            ->withTimestamps()
            ->orderByPivot('ordinal');
    }

    public function participants(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'contest_participants')
            ->withPivot('registered_at')
            ->withTimestamps();
    }

    /** Submissions tied to this contest (weak contest_id reference). */
    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class, 'contest_id');
    }

    public function hasStarted(): bool
    {
        return $this->starts_at === null || $this->starts_at->lte(now(config('app.timezone')));
    }

    public function hasEnded(): bool
    {
        return $this->ends_at !== null && $this->ends_at->lte(now(config('app.timezone')));
    }

    public function isRunning(): bool
    {
        return $this->hasStarted() && ! $this->hasEnded();
    }

    public function status(): string
    {
        if (! $this->hasStarted()) {
            return 'upcoming';
        }

        return $this->hasEnded() ? 'ended' : 'running';
    }

    /**
     * Whether the contest currently accepts submissions.
     * Practice contests accept anytime. Timed contests require a real start that
     * has passed and (if set) an end that has not. A null starts_at on a timed
     * contest means it has not started.
     */
    public function acceptsSubmissions(?\Carbon\CarbonInterface $now = null): bool
    {
        if ($this->is_practice) {
            return true;
        }

        $now ??= now(config('app.timezone'));

        $started = $this->starts_at !== null && $this->starts_at->lte($now);
        if (! $started) {
            return false;
        }

        return $this->ends_at === null || $this->ends_at->gte($now);
    }

    public function allowsProblemViewing(?\Carbon\CarbonInterface $now = null): bool
    {
        if ($this->is_practice) {
            return true;
        }

        return $this->acceptsSubmissions($now);
    }

    public function hasParticipant(int $userId): bool
    {
        return $this->participants()->where('users.id', $userId)->exists();
    }

    public function hasProblem(int $problemId): bool
    {
        return $this->problems()->where('problems.id', $problemId)->exists();
    }
}
