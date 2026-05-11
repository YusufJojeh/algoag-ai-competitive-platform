<?php

namespace App\Http\Requests;

use App\Services\BenchmarkKeys;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BenchmarkRunRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'problem' => ['required', 'string', 'min:10', 'max:2000'],
            'suggestions' => ['required', 'array', 'max:20'],
            'suggestions.*.name' => ['required', 'string', 'max:255'],
            'suggestions.*.benchmark_key' => ['nullable', Rule::in(BenchmarkKeys::KEYS)],
        ];
    }
}
