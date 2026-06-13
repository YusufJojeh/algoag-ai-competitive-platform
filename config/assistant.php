<?php

return [

    'ai_provider' => env('ASSISTANT_AI_PROVIDER', 'openai'),

    'openai' => [
        'api_key' => env('OPENAI_API_KEY'),
        'model' => env('ASSISTANT_AI_MODEL', 'gpt-4o-mini'),
        'max_tokens' => (int) env('ASSISTANT_AI_MAX_TOKENS', 500),
        'timeout' => (int) env('ASSISTANT_AI_TIMEOUT', 60),
        'stt_model' => env('ASSISTANT_STT_MODEL', 'whisper-1'),
        'stt_timeout' => (int) env('ASSISTANT_STT_TIMEOUT', 30),
        'tts_model' => env('ASSISTANT_TTS_MODEL', 'tts-1'),
        'tts_timeout' => (int) env('ASSISTANT_TTS_TIMEOUT', 30),
        'tts_voice_ar' => env('ASSISTANT_TTS_VOICE_AR', 'nova'),
        'tts_voice_en' => env('ASSISTANT_TTS_VOICE_EN', 'alloy'),
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
