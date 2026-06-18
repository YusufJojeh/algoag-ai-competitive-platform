<?php

namespace App\Http\Requests\Admin;

use App\Modules\Problems\Models\Problem;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProblemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->is_admin === true;
    }

    public function rules(): array
    {
        /** @var Problem $problem */
        $problem = $this->route('problem');

        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('problems', 'slug')->ignore($problem->id),
            ],
            'statement' => ['required', 'string', 'max:50000'],
            'difficulty' => ['required', Rule::in(['easy', 'medium', 'hard', 'extreme'])],
            'time_limit_ms' => ['required', 'integer', 'min:1', 'max:600000'],
            'memory_limit_mb' => ['required', 'integer', 'min:1', 'max:2048'],
            'tag_ids' => ['nullable', 'array', 'max:50'],
            'tag_ids.*' => ['integer', 'distinct', 'exists:tags,id'],
            'test_cases' => ['nullable', 'array', 'max:200'],
            'test_cases.*.input' => ['nullable', 'string', 'max:100000'],
            'test_cases.*.expected_output' => ['nullable', 'string', 'max:100000'],
            'test_cases.*.is_sample' => ['boolean'],
        ];
    }
}
