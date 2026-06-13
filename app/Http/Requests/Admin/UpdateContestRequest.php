<?php

namespace App\Http\Requests\Admin;

use App\Modules\Arena\Models\Contest;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateContestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->is_admin === true;
    }

    public function rules(): array
    {
        /** @var Contest $contest */
        $contest = $this->route('contest');

        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('contests', 'slug')->ignore($contest->id),
            ],
            'description' => ['nullable', 'string', 'max:5000'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_public' => ['boolean'],
            'problems' => ['nullable', 'array', 'max:100'],
            'problems.*.problem_id' => ['required', 'integer', 'exists:problems,id'],
            'problems.*.label' => ['nullable', 'string', 'max:8'],
        ];
    }
}
