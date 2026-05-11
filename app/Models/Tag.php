<?php

namespace App\Models;

use App\Modules\Problems\Models\Problem;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tag extends Model
{
    protected $fillable = [
        'name',
        'slug',
    ];

    public function problems(): BelongsToMany
    {
        return $this->belongsToMany(Problem::class);
    }
}
