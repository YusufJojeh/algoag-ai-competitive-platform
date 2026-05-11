# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AlgoAG is a full-stack competitive-programming learning platform with AI-assisted algorithm selection, benchmarking, and code execution. Built with Laravel 12 + React 18 + Inertia.js (server-driven SPA). The AI layer uses Ollama (local LLM) for algorithm suggestions and optionally OpenAI/Gemini for the multi-modal assistant.

## Commands

### Development
```bash
php artisan serve          # Laravel dev server (port 8000)
npm run dev                # Vite HMR dev server (run alongside artisan serve)
composer run dev           # Runs both concurrently
```

### Setup
```bash
composer install && npm install
cp .env.example .env && php artisan key:generate
php artisan migrate && php artisan db:seed   # Demo user: demo@example.com / password
npm run build
```

### Testing
```bash
php artisan test                   # Run all PHPUnit tests
php artisan test --filter=ClassName # Run a single test class
composer run test                  # PHPUnit with config-clear
npm run test                       # Vitest (frontend)
npm run test:watch                 # Vitest watch mode
npm run test:coverage              # Coverage report (100% threshold enforced for Pages/)
npm run test:e2e                   # Playwright E2E
npm run test:all                   # Frontend + content validation + backend
composer run ci                    # Content validation + PHPUnit (CI pipeline)
```

### Queue (for async jobs)
```bash
php artisan queue:work    # Required when QUEUE_CONNECTION=database
```

## Architecture

### Stack
- **Backend:** Laravel 12 (PHP 8.2+), SQLite (default) or MySQL
- **Frontend:** React 18 + Inertia.js — one `Pages/*.jsx` component per route
- **Styling:** Tailwind CSS 4 + Radix UI
- **AI:** Ollama (local, algorithm suggestions) + OpenAI Vision/Whisper/TTS (multi-modal assistant)
- **Real-time:** Laravel Reverb WebSockets broadcasting to private channel `assistant.{userId}`
- **Queue:** Database-backed job queue (`QUEUE_CONNECTION=database` in prod, `sync` in dev)

### Key Layer Map

```
routes/web.php
  → app/Http/Controllers/          # Route handlers (thin, delegate to services)
  → app/Modules/*/Http/Controllers/ # Domain-specific controllers

app/Services/
  OllamaService                    # Ollama LLM: algorithm suggestions, recommendations
  BenchmarkRunner                  # PHP micro-benchmarks (13+ algorithm categories)
  CodeforcesSolverService          # Multi-stage pipeline: parse → code → explain → judge
  Assistant/AnalysisService        # STT → AI analysis → TTS with streaming + broadcasting
  Assistant/PromptOrchestrator     # Builds system prompts for 11 analysis modes

app/Jobs/
  ProcessAnalysisJob               # Async assistant analysis (timeout 300s)
  ProcessCodeforcesSolutionJob     # Async Codeforces solve pipeline (timeout 900s)

app/Events/Assistant/              # ShouldBroadcast events for real-time UI updates

app/Modules/                       # Domain modules (each has its own controllers, models, services)
  Assistant/    Codeforces/    Execution/    Patterns/    Problems/    Admin/    Realtime/

resources/js/Pages/                # Inertia page components (mirror route structure)
resources/js/components/           # Shared UI components
resources/js/hooks/                # Custom React hooks
resources/js/lib/                  # Utilities (locale, validation, API calls)
```

### Async Pipeline Pattern

Both major AI features use the same pattern:
1. Controller dispatches a `ShouldQueue` job, returns immediately
2. Job runs multi-stage pipeline, persisting progress to the model's `status` field
3. Each stage broadcasts a WebSocket event (e.g., `AnalysisStarted`, `AIChunkReceived`, `AnalysisCompleted`)
4. Frontend polls `messageStatus` endpoint or listens on WebSocket for live updates
5. Jobs support cooperative cancellation by checking `status === 'cancelled'` between stages

### Service Container Bindings (AppServiceProvider)

- `CodeJudge` → `LocalProcessJudge` (real Python subprocess) or `StubCodeJudge` (controlled via `config/judge.php` and `JUDGE_USE_REAL` env)
- `AIProvider` → `OpenAIVisionProvider`
- `STTProvider` → `WhisperSTT`
- `TTSProvider` → `OpenAITTS`

### Middleware
- `SetUiLocale` — reads `ui_locale` session/query param (`ar`/`en`), RTL/LTR
- `HandleInertiaRequests` — shares `auth.user` and `uiLocale` to all Inertia pages
- `EnsureUserIsAdmin` — registered as `admin` alias; used on admin routes

### Content System
Patterns and problems are file-based (markdown/YAML). `ContentIndexPattern` and `ContentIndexProblem` tables cache pre-computed search indices with git SHA tracking. Run `composer run ci` to validate content manifests.

## Key Environment Variables

```env
OLLAMA_URL=http://localhost:11434    # Ollama endpoint
OLLAMA_MODEL=llama3.2               # Model for algorithm suggestions
ASSISTANT_AI_PROVIDER=openai        # openai | gemini | ollama
OPENAI_API_KEY=                     # Required for Vision/Whisper/TTS
JUDGE_USE_REAL=false                # true = real Python subprocess judge
QUEUE_CONNECTION=sync               # sync (dev) | database (prod)
REVERB_APP_KEY=                     # Laravel Reverb WebSocket key
```

## Testing Notes

- **Frontend coverage thresholds:** 100% lines/statements/branches/functions enforced for `resources/js/Pages/`; every page must have a `.test.jsx` file
- **PHPUnit suites:** `Unit` (`tests/Unit/`) and `Feature` (`tests/Feature/`)
- **E2E routes** (`/__e2e/*`) are only registered in local/testing environments
- PHPUnit uses an in-memory SQLite database (`DB_CONNECTION=sqlite`, `:memory:`)
- Vitest runs in jsdom environment with setup at `resources/js/test/setup.js`
