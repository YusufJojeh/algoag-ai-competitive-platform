<?php

namespace App\Http\Requests\Admin;

use App\Modules\Arena\Models\Contest;
use Illuminate\Support\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateContestRequest extends FormRequest
{
    private const MIN_DURATION_MINUTES = 2;
    private const MAX_DURATION_MINUTES = 1440;

    public function authorize(): bool
    {
        return $this->user()?->is_admin === true;
    }

    protected function prepareForValidation(): void
    {
        $this->normalizeMinimumStartTime();
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
            'duration_hours' => ['nullable', 'integer', 'min:0', 'max:24'],
            'duration_minutes' => ['nullable', 'integer', 'min:0', 'max:59'],
            'is_public' => ['boolean'],
            'is_practice' => ['boolean'],
            'problems' => ['nullable', 'array', 'max:100'],
            'problems.*.problem_id' => ['required', 'integer', 'exists:problems,id'],
            'problems.*.label' => ['nullable', 'string', 'max:8'],
            'contest_only_problems' => ['nullable', 'array', 'max:50'],
            'contest_only_problems.*.id' => ['nullable', 'integer', 'exists:problems,id'],
            'contest_only_problems.*.label' => ['nullable', 'string', 'max:8'],
            'contest_only_problems.*.title' => ['required', 'string', 'max:255'],
            'contest_only_problems.*.statement' => ['required', 'string', 'max:50000'],
            'contest_only_problems.*.difficulty' => ['required', Rule::in(['easy', 'medium', 'hard', 'extreme'])],
            'contest_only_problems.*.time_limit_ms' => ['required', 'integer', 'min:1', 'max:600000'],
            'contest_only_problems.*.memory_limit_mb' => ['required', 'integer', 'min:1', 'max:2048'],
            'contest_only_problems.*.test_cases' => ['nullable', 'array', 'max:200'],
            'contest_only_problems.*.test_cases.*.input' => ['nullable', 'string', 'max:100000'],
            'contest_only_problems.*.test_cases.*.expected_output' => ['nullable', 'string', 'max:100000'],
            'contest_only_problems.*.test_cases.*.is_sample' => ['boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($this->boolean('is_practice')) {
                return;
            }

            if (! $this->filled('starts_at')) {
                $validator->errors()->add('starts_at', 'Start time is required for timed contests.');
            }

            if (! $this->filled('duration_hours')) {
                $validator->errors()->add('duration_hours', 'Duration hours are required for timed contests.');
            }

            if (! $this->filled('duration_minutes')) {
                $validator->errors()->add('duration_minutes', 'Duration minutes are required for timed contests.');
            }

            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $totalMinutes = $this->durationMinutes();

            if ($totalMinutes < self::MIN_DURATION_MINUTES) {
                $validator->errors()->add('duration_minutes', 'Contest duration must be at least 2 minutes.');
            }

            if ($totalMinutes > self::MAX_DURATION_MINUTES) {
                $validator->errors()->add('duration_hours', 'Contest duration may not exceed 24 hours.');
            }
        });
    }

    private function normalizeMinimumStartTime(): void
    {
        if ($this->boolean('is_practice') || ! $this->filled('starts_at')) {
            return;
        }

        $timezone = config('app.timezone');
        $minimum = now($timezone)->addMinutes(2)->seconds(0);

        try {
            $startsAt = Carbon::parse((string) $this->input('starts_at'), $timezone)->seconds(0);
        } catch (\Throwable) {
            return;
        }

        if ($startsAt->lt($minimum)) {
            $startsAt = $minimum;
        }

        $this->merge(['starts_at' => $startsAt->format('Y-m-d H:i:s')]);
    }

    private function durationMinutes(): int
    {
        return ((int) $this->input('duration_hours', 0) * 60)
            + (int) $this->input('duration_minutes', 0);
    }
}
