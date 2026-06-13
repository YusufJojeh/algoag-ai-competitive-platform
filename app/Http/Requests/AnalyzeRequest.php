<?php

namespace App\Http\Requests;

use App\Models\AssistantSession;
use App\Services\Assistant\Prompts\ModePrompts;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AnalyzeRequest extends FormRequest
{
    public function authorize(): bool
    {
        if ($this->filled('session_id')) {
            $session = AssistantSession::find($this->input('session_id'));

            return $session && $session->user_id === $this->user()->id;
        }

        return true;
    }

    public function rules(): array
    {
        return [
            'frame' => ['nullable', 'file', 'image', 'max:4096'],
            'transcript' => ['nullable', 'string', 'max:5000', 'required_without_all:audio,frame'],
            'audio' => ['nullable', 'file', 'mimes:webm,wav,mp3,ogg', 'max:10240'],
            'mode' => ['required', 'string', Rule::in(ModePrompts::allowedRequestModes())],
            'session_id' => ['nullable', 'integer', 'exists:assistant_sessions,id'],
            'language' => ['nullable', 'string', Rule::in(['ar', 'en'])],
            'client_request_id' => ['required', 'string', 'uuid', 'max:36'],
        ];
    }

    public function messages(): array
    {
        return [
            'frame.image' => 'الملف يجب أن يكون صورة.',
            'frame.max' => 'حجم الصورة يجب ألا يتجاوز 4 ميجابايت.',
            'transcript.required_without_all' => 'يرجى كتابة فكرتك أو إرسال تسجيل صوتي أو التقاط شاشة.',
            'mode.required' => 'يرجى اختيار نوع المساعدة.',
            'client_request_id.required' => 'معرّف الطلب مطلوب.',
            'client_request_id.uuid' => 'معرّف الطلب يجب أن يكون UUID صالح.',
        ];
    }
}
