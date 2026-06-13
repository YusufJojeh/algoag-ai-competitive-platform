<?php

return [
    'ollama' => [
        'url' => env('OLLAMA_URL', 'http://localhost:11434'),
        'model' => env('OLLAMA_MODEL', 'llama3.2'),
    ],

    /*
    | Text-generation AI used by algorithm suggestions and the Codeforces solver
    | pipeline (parse -> code -> explain -> tests -> breakdown). OpenAI is the
    | primary provider; Ollama is the automatic fallback when the OpenAI key is
    | absent or a request fails, so the app keeps working offline / key-less.
    */
    'ai' => [
        'primary' => env('AI_PRIMARY_PROVIDER', 'openai'),
        'openai' => [
            'api_key' => env('OPENAI_API_KEY'),
            // A stronger default than the assistant's gpt-4o-mini: full solutions
            // need head-room. Override with AI_OPENAI_MODEL.
            'model' => env('AI_OPENAI_MODEL', 'gpt-4o'),
            // Generous ceiling so complete C++/Python solutions are never truncated.
            'max_tokens' => (int) env('AI_OPENAI_MAX_TOKENS', 4000),
            'timeout' => (int) env('AI_OPENAI_TIMEOUT', 120),
        ],
        'codeforces' => [
            // Total solution attempts (1 initial + repairs) when the official
            // sample fails under a runnable language. Bounds cost/latency.
            'max_attempts' => (int) env('AI_CODEFORCES_MAX_ATTEMPTS', 3),
        ],
    ],
];
