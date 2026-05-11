<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContentIndexPattern extends Model
{
    protected $table = 'content_index_patterns';

    protected $fillable = [
        'pattern_id',
        'status',
        'title_ar',
        'title_en',
        'summary_ar',
        'summary_en',
        'analytics_tags',
        'search_text',
        'content_hash',
        'git_sha',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'analytics_tags' => 'array',
        ];
    }
}
