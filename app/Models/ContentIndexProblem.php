<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContentIndexProblem extends Model
{
    protected $table = 'content_index_problems';

    protected $fillable = [
        'problem_id',
        'slug',
        'status',
        'locale_flags',
        'pattern_ids',
        'title_ar',
        'title_en',
        'content_hash',
        'git_sha',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'locale_flags' => 'array',
            'pattern_ids' => 'array',
        ];
    }
}
