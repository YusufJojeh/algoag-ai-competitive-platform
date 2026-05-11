<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'problem_id' => ['nullable', 'integer', 'exists:problems,id'],
            'language' => ['required', 'string', Rule::in(['cpp', 'python'])],
            'code' => ['required', 'string', 'min:1', 'max:100000'],
        ];
    }
}
