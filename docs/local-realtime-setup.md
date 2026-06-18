# Local Realtime Setup

How to run AlgoAG locally with full real-time (Reverb WebSockets) and async job processing.

## Required `.env` values

Copy `.env.example` to `.env` and verify these blocks (all are already in `.env.example`):

```env
# App
APP_ENV=local
APP_URL=http://localhost:8000

# Database (MySQL via XAMPP; or use SQLite by replacing the block)
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=algo
DB_USERNAME=root
DB_PASSWORD=

# Queue + broadcasting
QUEUE_CONNECTION=database
BROADCAST_CONNECTION=reverb

# Reverb server (Laravel's first-party WebSocket server)
REVERB_APP_ID=algoag-local
REVERB_APP_KEY=algoag-local-key
REVERB_APP_SECRET=algoag-local-secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http

# Vite (frontend Echo) — these reference the same Reverb values
VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

## One command starts everything

```bash
composer run dev
```

This boots four processes concurrently via `npx concurrently`:

| Name | Command | Port | Purpose |
|---|---|---|---|
| `server` | `php artisan serve` | 8000 | Laravel HTTP server |
| `reverb` | `php artisan reverb:start` | 8080 | WebSocket server for broadcast events |
| `queue` | `php artisan queue:work --tries=3` | — | Processes async jobs (Codeforces solve, assistant analyze) |
| `vite` | `npm run dev` | 5174 | Vite dev server / HMR |

`--kill-others` is enabled — killing any one process kills the rest.

## Verify everything works

```bash
composer run verify
```

Runs `php artisan test` then `npm run build`. Use this before pushing.

## Optional services

### Ollama (algorithm suggestions, Codeforces solver)

```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

Install Ollama from [ollama.com](https://ollama.com) and run `ollama pull llama3.2`. The app gracefully degrades if Ollama is unavailable: the suggestion controller shows a warning, and the Codeforces solve controller returns a generic error before queuing the job.

### OpenAI (assistant Vision / Whisper / TTS)

```env
ASSISTANT_AI_PROVIDER=openai
OPENAI_API_KEY=your-openai-key
ASSISTANT_AI_MODEL=gpt-4o-mini
ASSISTANT_STT_PROVIDER=whisper
ASSISTANT_TTS_PROVIDER=openai
```

Required only for the multi-modal assistant (`/assistant`). Without a key, the analyze endpoint will fail when the job tries to call OpenAI; the failure is logged and surfaced to the user as a generic Arabic error message.

### Code judge

Default is the safe stub:

```env
JUDGE_USE_REAL=false
```

To enable the real Python process judge for local development:

```env
JUDGE_USE_REAL=true
JUDGE_TIME_LIMIT_SECONDS=10
```

Python 3 must be on `PATH`. **Do not enable in production without a sandbox driver** — the `AppServiceProvider` will throw a `RuntimeException` at boot. See `docs/security-hardening.md` section 3.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Frontend never receives broadcast events | Reverb not running | Check the `reverb` pane in the concurrent output; `php artisan reverb:start` separately to see errors |
| Async jobs queued but never processed | Queue worker not running | Ensure `queue` pane is alive; check `jobs` and `failed_jobs` tables |
| Codeforces solver always returns "Ollama unavailable" | Ollama not on `OLLAMA_URL` | `curl http://localhost:11434/api/tags` should return JSON; if not, start Ollama |
| Assistant analyze fails immediately | `OPENAI_API_KEY` missing or invalid | Check `storage/logs/laravel.log` for the OpenAI HTTP response |
| `php artisan reverb:start` fails with port 8080 in use | Another service on 8080 | Change `REVERB_PORT` in `.env` to e.g. `8081`, also update `VITE_REVERB_PORT` |
| Vite shows "Failed to connect" on Reverb | `VITE_REVERB_*` vars don't match `REVERB_*` | Restart Vite after editing `.env` — `VITE_*` vars are baked at build time |
| 404 on `/__e2e/runtime/auth/fixture` from Playwright | E2E gate rejecting the request | Set `ENABLE_E2E_FIXTURES=true` and a non-empty `E2E_FIXTURE_SECRET` in `.env` (and the same value in the Playwright env) |

## Production deployment notes

- `JUDGE_USE_REAL=false` is the default. To run real code, configure a sandbox driver — see `docs/security-hardening.md`.
- `ENABLE_E2E_FIXTURES=false` is the default. Do not enable in production.
- `BROADCAST_CONNECTION=reverb` requires running `php artisan reverb:start` as a daemon (systemd, supervisor, etc.).
- `QUEUE_CONNECTION=database` requires running `php artisan queue:work` as a daemon. Codeforces solve jobs have a 15-minute timeout.
