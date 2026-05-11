<?php

return [

    'ai_provider' => env('ASSISTANT_AI_PROVIDER', 'openai'),

    'openai' => [
        'api_key' => env('OPENAI_API_KEY'),
        'model' => env('ASSISTANT_AI_MODEL', 'gpt-4o-mini'),
        'max_tokens' => 500,
        'timeout' => 60,
    ],

    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
        'model' => env('ASSISTANT_GEMINI_MODEL', 'gemini-2.0-flash'),
    ],

    'ollama' => [
        'url' => env('OLLAMA_URL', 'http://localhost:11434'),
        'model' => env('ASSISTANT_OLLAMA_MODEL', 'llava'),
    ],

    'stt_provider' => env('ASSISTANT_STT_PROVIDER', 'whisper'),
    'tts_provider' => env('ASSISTANT_TTS_PROVIDER', 'openai'),

    'retention' => [
        'frames_minutes' => 60,
        'audio_minutes' => 60,
        'tts_hours' => 24,
    ],

    'observability' => [
        'log_prompts' => env('ASSISTANT_LOG_PROMPTS', false),
        'log_responses' => env('ASSISTANT_LOG_RESPONSES', false),
    ],

];
