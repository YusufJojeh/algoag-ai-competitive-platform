# AI Production Readiness

This project currently ships AI for the algorithm assistant, Ollama algorithm suggestions, benchmark recommendations, and Codeforces-style solve generation. It does not include store, product, SEO, marketing, or blog AI generation modules.

## Required Environment

- `ASSISTANT_AI_PROVIDER=openai`
- `OPENAI_API_KEY=...`
- `ASSISTANT_AI_MODEL=gpt-4o-mini`
- `ASSISTANT_AI_MAX_TOKENS=500`
- `ASSISTANT_AI_TIMEOUT=60`
- `ASSISTANT_STT_MODEL=whisper-1`
- `ASSISTANT_STT_TIMEOUT=30`
- `ASSISTANT_TTS_MODEL=tts-1`
- `ASSISTANT_TTS_TIMEOUT=30`
- `ASSISTANT_TTS_VOICE_AR=nova`
- `ASSISTANT_TTS_VOICE_EN=alloy`
- `AI_PRIMARY_PROVIDER=openai`
- `AI_OPENAI_MODEL=gpt-4o`
- `AI_OPENAI_MAX_TOKENS=4000`
- `AI_OPENAI_TIMEOUT=120`
- `AI_CODEFORCES_MAX_ATTEMPTS=3`
- `OLLAMA_URL=http://localhost:11434`
- `OLLAMA_MODEL=llama3.2`
- `QUEUE_CONNECTION=database`
- `BROADCAST_CONNECTION=reverb` when realtime events are desired
- `AI_USAGE_ASSISTANT_DAILY_LIMIT=100`
- `AI_USAGE_CODEFORCES_DAILY_LIMIT=20`
- `AI_STALE_JOB_MINUTES=15`

Only `openai` is implemented for the voice/vision assistant. `gemini` and `ollama` are rejected for assistant analysis until provider classes are added. Algorithm suggestions, benchmark recommendations, and Codeforces solving use OpenAI as the primary text-generation provider and fall back to Ollama when the OpenAI key is absent or the request fails.

## Required Processes

Run the web server, Vite, Reverb if realtime is enabled, and a queue worker:

```bash
php artisan queue:work --tries=3
php artisan schedule:work
```

The scheduler runs `assistant:cleanup` hourly and `ai:mark-stale-jobs` every five minutes. Stale assistant and Codeforces jobs are marked failed with user-safe messages.

## Failure Modes

- Missing `OPENAI_API_KEY`: assistant jobs fail safely and record an AI usage failure.
- Unsupported `ASSISTANT_AI_PROVIDER`: service resolution fails clearly instead of silently using another provider.
- Ollama unavailable: `/suggest` and `/solve` return user-safe errors without raw provider exception details.
- Queue worker stopped: jobs remain queued until the stale-job command marks them failed; the frontend warns that a queue worker may be missing.

## Logging Rules

Provider logs must include only safe metadata: provider, HTTP status, request id when available, message id or user id where relevant, and failure category. Do not log raw prompts, transcripts, image data, provider response bodies, or API keys.

## Manual Acceptance Checklist

- Submit text-only assistant request and receive a reply.
- Submit frame-only assistant request and receive a reply.
- Submit audio-only assistant request and verify transcription plus analysis.
- Stop the queue worker and verify queued/stale UX.
- Remove `OPENAI_API_KEY` and verify safe failure.
- Stop Ollama and verify `/suggest` and `/solve` fail safely.
- Confirm frontend bundle does not expose OpenAI/Ollama secrets.
