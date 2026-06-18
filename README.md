# ALGOAG

ALGOAG is a Laravel 12 + React/Inertia competitive programming platform for learning, solving, contests, and AI-assisted algorithm practice.

## Overview

ALGOAG is built around a problems-first workflow: learners open public problems, submit Python or C++ solutions, review verdicts, join Mini Codeforces-style Arena contests, and use AI-assisted tools for algorithm reasoning and Codeforces-style problem solving. Admin users manage users, topics, courses, lessons, problems, hidden tests, contests, contest-only problems, and settings.

The local judge is intended for development and demo use. It can run Python and C++ locally when enabled, but production use requires a real sandbox such as Docker, gVisor, or Firejail.

## Main Features

- Public problem bank with topics/tags and difficulty labels.
- Python and C++ submissions with hidden test cases.
- Local demo judge with a safe stub mode by default.
- Mini Codeforces-style Arena with timed and practice contests.
- Contest start/duration scheduling with computed `ends_at`.
- Contest-only private problems hidden until contest end.
- Scheduled publishing of ended contest-only problems to public Problems.
- Computed post-contest difficulty based on participant performance.
- ICPC-style standings.
- AI assistant with text, vision, speech-to-text, and text-to-speech integrations.
- Codeforces solver workflow supporting Python and C++ only.
- Admin management for users, topics, courses, lessons, problems, contests, and settings.
- Laravel Reverb/Echo support with frontend polling fallbacks where implemented.
- Queue and scheduler support for long-running AI and publishing tasks.

## Tech Stack

- Backend: Laravel 12, PHP 8.2+
- Frontend: React 18, Inertia.js, Vite, Tailwind CSS, Shadcn-style local UI components
- Realtime: Laravel Reverb, Echo, Pusher protocol
- Database: MySQL for normal local usage; SQLite is used by tests
- Queue: Laravel queue, normally `database` locally
- Testing: PHPUnit, Vitest, TypeScript compile check
- AI: OpenAI primary provider, Ollama fallback for some text-generation flows
- Judge: local Python/C++ process judge for demo/dev, stub judge by default

## Local Setup

```bash
composer install
npm install
copy .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
npm run build
```

Use stable local addresses, especially when a VPN is enabled:

```env
APP_URL=http://127.0.0.1:8000
VITE_DEV_SERVER_HOST=127.0.0.1
VITE_HMR_HOST=127.0.0.1
REVERB_HOST=127.0.0.1
REVERB_SERVER_HOST=127.0.0.1
```

## Environment Variables

Important values from `.env.example`:

```env
APP_URL=http://127.0.0.1:8000
APP_TIMEZONE=Asia/Damascus
DB_CONNECTION=mysql
QUEUE_CONNECTION=database
BROADCAST_CONNECTION=reverb
JUDGE_USE_REAL=false
JUDGE_TIME_LIMIT_SECONDS=10
```

AI values are intentionally blank in `.env.example`. Do not commit real keys.

```env
OPENAI_API_KEY=
AI_PRIMARY_PROVIDER=openai
AI_OPENAI_MODEL=gpt-4o
ASSISTANT_AI_MODEL=gpt-4o-mini
```

## Running The App

Terminal 1:

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

Terminal 2:

```bash
npm run dev
```

Terminal 3, if using database queue:

```bash
php artisan queue:work
```

Terminal 4, for scheduled tasks:

```bash
php artisan schedule:work
```

Optional Reverb:

```bash
php artisan reverb:start --host=127.0.0.1
```

## Scheduler And Publishing

The scheduler runs:

- `assistant:cleanup` hourly.
- `ai:mark-stale-jobs` every five minutes.
- `arena:publish-ended-problems` every ten minutes with `withoutOverlapping()`.

Manual publishing command:

```bash
php artisan arena:publish-ended-problems
```

## Local Judge Setup

The safe default is:

```env
JUDGE_USE_REAL=false
```

In this mode submissions are recorded with the stub judge and no user code is executed. For local demos on a trusted machine:

```env
JUDGE_USE_REAL=true
```

Requirements:

- Python available as `python` or `python3`.
- C++ compiler available as `g++` or `c++`.

Windows g++ options include MSYS2/MinGW-w64. After installation, ensure `g++.exe` is on PATH and verify:

```bash
g++ --version
php artisan test tests/Feature/LocalProcessJudgeTest.php
```

Security warning: do not run untrusted code in production without a real sandbox. Supported sandbox driver names are documented in config as `docker`, `gvisor`, and `firejail`, but the production isolation itself must be implemented and operated before claiming production judge safety.

## Demo Accounts

After `php artisan db:seed`:

- Admin: `admin@example.com` / `password`
- Demo user: `demo@example.com` / `password`
- Student: `student@example.com` / `password`

## Demo Flow

1. Open `http://127.0.0.1:8000`.
2. Log in as `demo@example.com`.
3. Open Problems and submit a Python or C++ solution.
4. Join an Arena contest and review the countdown/running/ended states.
5. Open standings.
6. Log in as admin and create a topic, course lesson, problem, and contest.
7. Add a contest-only problem, end the contest, run `php artisan arena:publish-ended-problems`, and confirm the problem appears publicly.
8. Try the AI assistant and Codeforces solver.

## Testing

```bash
php artisan optimize:clear
php artisan route:list
php artisan schedule:list
php artisan test
npm run test
npm run build
npm run lint
```

For a safe migration smoke test without touching local MySQL:

```bash
$env:APP_ENV='testing'; $env:DB_CONNECTION='sqlite'; $env:DB_DATABASE=':memory:'; php artisan migrate --force
$env:APP_ENV='testing'; $env:DB_CONNECTION='sqlite'; $env:DB_DATABASE=':memory:'; php artisan migrate:fresh --seed --force
```

## Screenshots

Add final screenshots under a separate portfolio folder or release assets:

- Landing
- Problems list and problem show
- Submission result
- Arena and standings
- Admin users/topics/courses/problems/contests
- AI assistant and Codeforces solver

## Status And License

Portfolio/graduation-ready local demo project. License: MIT, as declared in `composer.json`.
