<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CodeforcesSolveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'problem' => ['required', 'string', 'min:10', 'max:50000'],
            'language' => ['nullable', 'string', 'in:cpp,python'],
            'response_language' => ['nullable', 'string', 'in:ar,en'],
        ];
    }
}
